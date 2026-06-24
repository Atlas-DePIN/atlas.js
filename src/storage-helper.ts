import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";

import { IAesBundle, IEncryptionOptions } from "./interfaces";

import { DEFAULT_REPLICAS } from "./utils/defaults";
import { decryptFile, encryptFile, generateAesKey } from "./utils/crypto";
import { buildMerkleTree } from "./utils/merkle";
import { buildFid, hashAndHex } from "./utils/hash";

import { AtlasClient } from "./atlas-client";
import { FiletreeHelper } from "./filetree-helper";
import { EncodeObject } from "@atlas/atlas.js-protos";
import { MessageComposer } from "./utils/composer";
import { UploadHelper } from "./upload-helper";

/** Maximum distinct providers to try per file before giving up. */
const MAX_UPLOAD_PROVIDER_ATTEMPTS = 5;

/** Upload attempts on a specific provider when one is explicitly named. */
const SPECIFIC_PROVIDER_ATTEMPTS = 3;

/**
 * Manages the storage lifecycle for a connected Atlas wallet.
 *
 * Loads subscription info, provider list, drives, and directory contents from
 * the chain.  Uses {@link FiletreeHelper} for filetree operations and derives
 * an access key from the wallet's signature for authenticated queries.
 *
 * Emits storage events so consumers can react to subscription changes and
 * directory navigation without polling.
 */
export class StorageManager {
  protected client: AtlasClient;

  /** Providers available on the network. */
  private _providers: Provider[] = [];
  get providers(): Provider[] {
    return this._providers
  }

  /**
   * Create a storage handler bound to an Atlas client and its active wallet.
   *
   * The handler listens for wallet connection changes so it can reload account
   * storage state when the user switches accounts.
   */
  constructor(client: AtlasClient) {
    this.client = client;
  }

  /**
   * Create a storage handler and load the user's storage account.
   *
   * @returns The initialised handler instance.
   */
  static async new(client: AtlasClient): Promise<StorageManager> {
    const handler = new StorageManager(client)
    await handler.loadProviders()
    return handler;
  }

  /**
   * Load providers from the chain, optionally filtered to specific addresses.
   *
   * When `addresses` is given, only providers whose on-chain address appears
   * in the list are retained.  When omitted, all providers are loaded.
   *
   * Updates the `providers` getter on success.
   */
  public async loadProviders(hostnames?: string[]): Promise<void> {
    try {
      const all = await this.client.query.providers();
      this._providers = hostnames
        ? all.filter((p) => hostnames.includes(p.hostname))
        : all;
    } catch (err: any) {
      // TODO: log error
      throw err;
    }
  }

  /**
   * Purchase a storage subscription for the active account or a receiver.
   *
   * The minimum purchase is one gigabyte for one day.
   */
  public async purchaseSubscription(bytes: number, days: number, isDefault: boolean, address: string = this.client.address): Promise<string> {
    if (bytes < 1000 ** 3) {
      throw new Error('Cannot purchase less than 1GB of storage.');
    }
    if (days < 1) {
      throw new Error('Cannot purchase storage for less than 1 day.');
    }

    const msgs: EncodeObject[] = [
      MessageComposer.MsgBuyStorage(
        this.client.address,
        address,
        days,
        bytes,
        isDefault
      )
    ];

    const txResult = await this.client.signAndBroadcast(msgs);
    return txResult.hash;
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  /**
   * Encrypt, merkle, commit to chain, and upload a single file to storage
   * providers.
   *
   * Returns the on-chain file ID (FID).
   *
   * @param file           - The file to upload.
   * @param subscriptionId - The storage subscription to post under.
   * @param opts           - Optional settings (replicas, encryption, provider
   *                         hostname).
   */
  public async uploadFile(
    file: File,
    subscriptionId: string,
    opts?: {
      replicas?: number;
      encryption?: IEncryptionOptions;
      provider?: string;
    },
  ): Promise<string> {
    return (await this.uploadFiles([file], subscriptionId, opts))[0];
  }

  /**
   * Upload multiple files in a single batch.
   *
   * All files share the same subscription and encryption settings.
   * Processing (encrypt + merkle) runs in parallel across files;
   * chain commits are batched into one transaction.
   *
   * @returns An array of FIDs in the same order as the input files.
   */
  public async uploadFiles(
    files: File[],
    subscriptionId: string,
    opts?: {
      replicas?: number;
      encryption?: IEncryptionOptions;
      provider?: string;
    },
  ): Promise<string[]> {
    if (files.length === 0) {
      return [];
    }

    const replicas = opts?.replicas ?? DEFAULT_REPLICAS;
    const nonce = Math.floor(Math.random() * 2_147_483_647);

    // --- Step 1: Process all files in parallel ---
    const entries = await Promise.all(
      files.map(async (file, i) => {
        const currentNonce = nonce + i;
        let processedFile = file;
        let encryption = opts?.encryption;

        // Encrypt if options provided
        if (encryption) {
          encryption.aes = encryption.aes ?? (await generateAesKey());
          processedFile = await encryptFile(file, encryption);
        }

        // Build merkle tree
        const tree = await buildMerkleTree(processedFile);
        const merkleRoot = tree.root;

        // Generate file ID
        const fid = await buildFid(merkleRoot, this.client.address, currentNonce);

        return { file: processedFile, fid, merkleRoot, encryption };
      }),
    );

    // --- Step 2: Commit to chain (batched) ---
    const msgs: EncodeObject[] = entries.map((e) =>
      MessageComposer.MsgPostFile(
        e.fid,
        this.client.address,
        e.merkleRoot,
        e.file.size,
        replicas,
        subscriptionId,
      ),
    );
    await this.client.signAndBroadcast(msgs);

    // --- Step 3: Upload file data to providers ---
    await Promise.all(
      entries.map(async (e) => {
        if (opts?.provider) {
          await this.uploadToSpecificProvider(e.fid, e.file, opts.provider!);
        } else {
          await this.uploadToRandomProvider(e.fid, e.file);
        }
      }),
    );

    return entries.map((e) => e.fid);
  }

  /**
   * Upload a single file to a specific provider, retrying on failure.
   */
  private async uploadToSpecificProvider(fid: string, file: File, hostname: string): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= SPECIFIC_PROVIDER_ATTEMPTS; attempt++) {
      try {
        const result = await UploadHelper.upload(hostname, fid, file);
        if (result.success) return;
        lastError = new Error(result.message ?? "Upload returned unsuccessful status.");
      } catch (err: any) {
        console.warn(`Upload attempt ${attempt}/${SPECIFIC_PROVIDER_ATTEMPTS} to "${hostname}" failed: ${err.message}.`);
        lastError = err;
      }
    }
    throw new Error(
      `Failed to upload file "${fid}" to "${hostname}" after ${SPECIFIC_PROVIDER_ATTEMPTS} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Upload a file to a randomly selected provider, retrying with different
   * providers on failure.
   */
  private async uploadToRandomProvider(fid: string, file: File): Promise<void> {
    if (this._providers.length === 0) {
      throw new Error("Cannot upload. No storage providers available.");
    }

    const tried = new Set<string>();
    let lastError: Error | null = null;

    while (tried.size < Math.min(MAX_UPLOAD_PROVIDER_ATTEMPTS, this._providers.length)) {
      const untried = this._providers.filter((p) => !tried.has(p.hostname));
      if (untried.length === 0) break;

      const provider = untried[Math.floor(Math.random() * untried.length)];
      tried.add(provider.hostname);

      try {
        const result = await UploadHelper.upload(provider.hostname, fid, file);
        if (result.success) return;
        lastError = new Error(result.message ?? "Upload returned unsuccessful status.");
      } catch (err: any) {
        console.warn(`Upload to "${provider.hostname}" failed: ${err.message}. Trying next provider...`);
        lastError = err;
      }
    }

    throw new Error(
      `Failed to upload file "${fid}" after ${tried.size} provider(s): ${lastError?.message}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Download
  // ---------------------------------------------------------------------------

  /**
   * Download a file by FID from one of its assigned storage providers.
   *
   * Tries each provider assigned to the file until one succeeds.  When a
   * specific `provider` is passed only that host is attempted.
   *
   * Encrypted files are decrypted with the viewer authority bundle stored on
   * the filetree node.
   */
  public async downloadFile(fid: string, aes?: IAesBundle, provider?: string, name?: string): Promise<File> {
    let providers: string[];

    if (provider) {
      providers = [provider];
    } else {
      const fileDetails = await this.client.query.file(fid);
      providers = fileDetails.providers;
    }

    if (providers.length === 0) {
      throw new Error(`File "${fid}" does not have an assigned storage provider.`);
    }

    let lastError: Error | null = null;

    for (const p of providers) {
      try {
        const rawFile = await this.downloadRaw(fid, p, name);
        if (aes) {
          return ensureNonEmptyFile(await decryptFile(rawFile, name, aes));
        } else {
          return ensureNonEmptyFile(rawFile);
        }
      } catch (err: any) {
        console.warn(`Download of "${fid}" from "${p}" failed: ${err.message}. Trying next provider...`);
        lastError = err;
      }
    }

    throw new Error(
      `Failed to download file "${fid}" after ${providers.length} provider(s): ${lastError?.message}`,
    );
  }

  /**
   * Fetch raw file bytes from the configured storage gateway.
   */
  public async downloadRaw(fid: string, provider: string, name?: string): Promise<File> {
    const providerInfo = await this.client.query.provider(provider);
    const response = await fetch(`https://${providerInfo.hostname}/api/v1/download/${fid}`, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Failed to download file "${fid}": ${response.status} ${response.statusText}`);
    }

    const body = await response.blob();
    return new File([body], name || fid);
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Delete one file from storage and its filetree node.
   *
   * Returns the transaction hash after refreshing the current directory.
   */
  public async deleteFile(fid: string): Promise<string> {
    const msg = MessageComposer.MsgDeleteFile(this.client.address, fid)
    try {
      const txResult = await this.client.signAndBroadcast([msg]);
      return txResult.hash;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("file not found")) {
        throw new Error("File Not Found")
      } else {
        throw err
      }
    }
  }
}

function ensureNonEmptyFile(file: File): File {
  if (file.size === 0) {
    throw new Error('File is empty.');
  }
  return file;
}

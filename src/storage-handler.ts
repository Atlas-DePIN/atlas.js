import { EncodeObject } from "@atlas/atlas.js-protos";
import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";


import { IAesBundle, IEncryptionOptions } from "./interfaces";
import { Privacy } from "./types";

import { DEFAULT_REPLICAS } from "./utils/defaults";
import { MessageComposer } from "./utils/composer";
import { buildMerkleTree } from "./utils/merkle";
import { buildFid } from "./utils/hash";
import { decryptFile, encryptFile, generateAesKey } from "./utils/crypto";

import { AtlasClient } from "./atlas-client";
import { UploadHelper } from "./upload-helper";

/** Result of a single file upload, including the key if encryption was used. */
export interface UploadedFile {
  fid: string;
  aes?: IAesBundle;
}

/**
 * Bare-bones storage operations for the Atlas Protocol.
 *
 * Provides upload, download, delete, and provider-management methods without
 * any filetree or queue state.
 */
export class StorageHandler {
  protected client: AtlasClient;

  /** Providers available on the network. */
  private _providers: Provider[] = [];
  get providers(): Provider[] {
    return this._providers
  }

  /**
   * Create a storage handler bound to an Atlas client and its active wallet.
   */
  constructor(client: AtlasClient) {
    this.client = client;
  }

  /**
   * Load providers from the chain, optionally filtered to specific hostnames.
   */
  public async loadProviders(hostnames?: string[]): Promise<void> {
    try {
      const all = await this.client.query.providers();
      this._providers = hostnames
        ? all.filter((p) => hostnames.includes(p.hostname))
        : all;
    } catch (err: any) {
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
   * Encrypt, merkle, commit to chain, and upload files to storage providers.
   *
   * When `opts.encryption` is provided the file is encrypted before upload
   * and an AES key is auto-generated if none is supplied.  The key is
   * returned alongside each FID so the caller can decrypt or share it.
   *
   * @returns An array of `{ fid, aes }` — `aes` is present only when
   *          encryption was used.
   */
  public async uploadFiles(
    files: File[],
    subscriptionId: string,
    privacy: Privacy = Privacy.PUBLIC,
    opts?: {
      replicas?: number;
      encryption?: IEncryptionOptions;
      provider?: string;
      maxProviderAttempts?: number;
    },
  ): Promise<UploadedFile[]> {
    if (files.length === 0) {
      return [];
    }

    const isPrivate = privacy === Privacy.ENCRYPTED;
    const replicas = opts?.replicas ?? DEFAULT_REPLICAS;
    const nonce = Math.floor(Math.random() * 2_147_483_647);

    // --- Step 1: Process all files in parallel ---
    const entries = await Promise.all(
      files.map(async (file, i) => {
        const currentNonce = nonce + i;
        let processedFile = file;
        let encryption = isPrivate ? (opts?.encryption ?? {}) : undefined;

        if (isPrivate) {
          encryption!.aes = encryption!.aes ?? (await generateAesKey());
          processedFile = await encryptFile(file, encryption!);
        }

        const tree = await buildMerkleTree(processedFile);
        const merkleRoot = tree.root;

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
    const maxAttempts = opts?.maxProviderAttempts;
    await Promise.all(
      entries.map(async (e) => {
        if (opts?.provider) {
          await this.uploadToSpecificProvider(e.fid, e.file, opts.provider!, maxAttempts);
        } else {
          await this.uploadToRandomProvider(e.fid, e.file, maxAttempts);
        }
      }),
    );

    return entries.map((e) => ({
      fid: e.fid,
      aes: e.encryption?.aes,
    }));
  }

  /**
   * Upload a single file.
   *
   * Convenience wrapper around {@link uploadFiles}.
   */
  public async uploadFile(
    file: File,
    subscriptionId: string,
    privacy: Privacy = Privacy.PUBLIC,
    opts?: {
      replicas?: number;
      encryption?: IEncryptionOptions;
      provider?: string;
      maxProviderAttempts?: number;
    },
  ): Promise<UploadedFile> {
    return (await this.uploadFiles([file], subscriptionId, privacy, opts))[0];
  }

  /**
   * Upload a single file to a specific provider, retrying on failure.
   */
  private async uploadToSpecificProvider(fid: string, file: File, hostname: string, maxAttempts: number = 3): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await UploadHelper.upload(hostname, fid, file);
        if (result.success) return;
        lastError = new Error(result.message ?? "Upload returned unsuccessful status.");
      } catch (err: any) {
        console.warn(`Upload attempt ${attempt}/${maxAttempts} to "${hostname}" failed: ${err.message}.`);
        lastError = err;
      }
    }
    throw new Error(
      `Failed to upload file "${fid}" to "${hostname}" after ${maxAttempts} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Upload a file to a randomly selected provider, retrying with different
   * providers on failure.
   */
  private async uploadToRandomProvider(fid: string, file: File, maxAttempts: number = 5): Promise<void> {
    if (this._providers.length === 0) {
      throw new Error("Cannot upload. No storage providers available.");
    }

    const tried = new Set<string>();
    let lastError: Error | null = null;

    while (tried.size < Math.min(maxAttempts, this._providers.length)) {
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
   * Encrypted files are decrypted with the provided AES bundle.
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
   * Delete one file from storage.
   */
  public async deleteFile(fid: string): Promise<string> {
    return (await this.deleteFiles([fid]))[0];
  }

  /**
   * Delete multiple files from storage in a single transaction.
   *
   * Each FID is batched into the same `signAndBroadcast` call.
   *
   * @returns An array of transaction hashes (one per batch — all FIDs
   *          share the same hash when batched).
   */
  public async deleteFiles(fids: string[]): Promise<string[]> {
    if (fids.length === 0) return [];

    const msgs = fids.map((fid) =>
      MessageComposer.MsgDeleteFile(this.client.address, fid),
    );
    try {
      const txResult = await this.client.signAndBroadcast(msgs);
      return new Array(fids.length).fill(txResult.hash);
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

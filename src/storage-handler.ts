import { EventEmitter } from "events";
import { PrivateKey } from "eciesjs";
import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";
import { StorageSubscription } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/subscription";

import { TreeNode, QueuedFileStatus } from "./types";
import { FileProcessingEvent, StorageEvents, StorageHandlerEvent, WalletEvents } from "./types/events";
import { SubscriptionError } from "./types/errors";
import { IAtlasDriveInfo, IAtlasDirectoryInfo, IDirectory, IQueuedFile, IFileUploadOptions } from "./interfaces";

import { DEFAULT_ENCYRPTION_CHUNK_SIZE, DEFAULT_REPLICAS } from "./utils/defaults";
import { encryptFile, generateAesKey } from "./utils/crypto";
import { buildMerkleTree } from "./utils/merkle";
import { SIGNER_SEED } from "./utils/constants";
import { bytesToHex } from "./utils/converters";
import { buildFid } from "./utils/hash";

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
export class StorageHandler extends EventEmitter {
  protected client: AtlasClient;
  protected access: PrivateKey;
  protected filetree: FiletreeHelper

  protected queuedFiles: Map<string, IQueuedFile> = new Map();

  /** Providers available on the network. */
  private _providers: Provider[] = [];
  get providers(): Provider[] {
    return this._providers
  }

  /** The active storage subscription for the connected wallet. */
  private _subscription: StorageSubscription
  get subscription(): StorageSubscription {
    return this._subscription
  }

  /** Drives owned by the connected wallet. */
  private _drives: IAtlasDriveInfo[] = [];
  get drives(): IAtlasDriveInfo[] {
    return this._drives
  }

  /** The currently loaded directory. */
  private _directory: IDirectory;
  get directory(): IDirectory {
    return this._directory
  }

  /**
   * Create a storage handler bound to an Atlas client and its active wallet.
   *
   * The handler listens for wallet connection changes so it can reload account
   * storage state when the user switches accounts.
   */
  constructor(client: AtlasClient) {
    super();
    this.client = client;
    this.filetree = new FiletreeHelper(client)

    this.client.removeAllListeners(WalletEvents.CONNECT);
    this.client.on(WalletEvents.CONNECT, () => null);
  }

  declare on: (event: StorageEvents | string, listener: (...args: any[]) => void) => this;
  declare off: (event: StorageEvents | string, listener: (...args: any[]) => void) => this;
  declare emit: (event: StorageEvents | string, ...args: any[]) => boolean;

  /**
   * Create a storage handler and load the user's storage account.
   *
   * @returns The initialised handler instance.
   */
  static async new(client: AtlasClient): Promise<StorageHandler> {
    const handler = new StorageHandler(client)
    await handler.loadAccount()
    return handler;
  }

  /**
   * Derive an ECIES access key from the wallet's signature.
   *
   * Signs the {@link SIGNER_SEED} message and converts the raw signature bytes
   * into a `PrivateKey`.  The key is also passed to the filetree helper for
   * authenticated filetree operations.
   */
  protected async enableSigner(): Promise<void> {
    const signature = await this.client.signMessage(SIGNER_SEED);
    this.access = PrivateKey.fromHex(bytesToHex(signature.signature));
    this.filetree.useAccessKey(this.access)
  }

  /**
   * Fetch the list of storage providers from the chain.
   *
   * Updates the `providers` getter on success.
   */
  public async loadProviders(): Promise<void> {
    try {
      this._providers = await this.client.query.providers();
    } catch (err: any) {
      // TODO: log error
      throw err;
    }
  }

  /**
   * Load the wallet's subscription, derive the access key, then resolve
   * drives and the default directory.
   *
   * If no drives exist, creates a default "home" drive and navigates into it.
   * Otherwise loads the first drive marked as default.
   */
  protected async loadAccount() {
    // TODO: reset
    try {
      await this.loadSubscription();
      await this.enableSigner();
    } catch (err: any) {
      // TODO: log warning
    }
    
    this._drives = await this.listDrives();
    if (this.drives.length === 0) {
      const metadata: IAtlasDriveInfo = {
        name: 'home',
        size: 0,
        isDefault: true
      }
      const msg = await this.filetree.createDrive(metadata)
      await this.client.signAndBroadcast([msg], {
        gasAdjustment: 2,   // Dev Note: needed higher gas limit for this Tx. To investigate why.
      });
      this._drives = [metadata];
      await this.loadDirectory('home');
      return
    } else {
      const defaultDrive = this.drives.find((drive) => drive.isDefault) ?? this.drives[0];
      await this.loadDirectory(defaultDrive.name);
    }
  }

  /**
   * Load the storage subscription for the connected wallet.
   *
   * Emits {@link StorageHandlerEvent.SUB_NEW} on success or
   * {@link StorageHandlerEvent.SUB_NONE} if the subscription cannot be found.
   *
   * @param id - Optional subscription ID.  Omitting it loads the default
   *             subscription for the wallet address.
   *
   * @throws {@link SubscriptionError} if the query fails.
   */
  public async loadSubscription(id?: string): Promise<void> {
    try {
      this._subscription = await this.client.query.subscription(this.client.address, id);
      this.emit(StorageHandlerEvent.SUB_NEW, this.subscription);
    } catch (error) {
      this.emit(StorageHandlerEvent.SUB_NONE);
      throw new SubscriptionError(`Failed to load subscription "${id}" for "${this.client.address}": ${error}`);
    }
  }

  /**
   * Load the contents of a directory and update the `directory` getter.
   *
   * Fetches the directory tree node and its children, then parses each child
   * into its typed representation (directory, file, or generic object).
   *
   * Emits {@link StorageHandlerEvent.DIR_NAV} on completion.
   *
   * @param path  - The directory path to load.
   * @param owner - The on-chain address that owns the directory.  Defaults to
   *                the connected wallet address.
   *
   * @throws If no owner is available (no wallet connected).
   */
  public async loadDirectory(path: string, owner: string = this.client.address): Promise<void> {
    if (!owner) {
      throw new TypeError('Unable to load directory. No owner specified and no wallet connected.');
    }
    // Get directory tree node
    const node = await this.filetree.getTreeNode(path, owner)
    const nextDirectory: IDirectory = {
      metadata: JSON.parse(node.contents) as IAtlasDirectoryInfo,
      path,
      files: [],
      subdirs: [],
      objects: [],
    };

    // Get directory children on-chain
    const children: TreeNode[] = await this.filetree.getTreeNodeChildren(path, owner)

    // Parse and sort directory children by their types
    for (const [index, node] of children.entries()) {
      try {
        if (node.nodeType === 'directory') {
          nextDirectory.subdirs.push(parseNodeContents(node.contents, `${path}/children[${index}]:directory`));
        } else if (node.nodeType === 'file') {
          nextDirectory.files.push(parseNodeContents(node.contents, `${path}/children[${index}]:file`));
        } else {
          nextDirectory.objects.push(node.contents);
        }
      } catch (err: any) {
        console.warn(`Child ${index} of directory "${path}" has invalid "${node.nodeType}" contents:\n ${node.contents}`);
      }
    }

    this._directory = nextDirectory;
    this.emit(StorageHandlerEvent.DIR_NAV, nextDirectory.path);
  }

  /**
   * List all drives owned by the connected wallet.
   *
   * Queries the filetree root children and filters for nodes with a
   * `drive` type, parsing their contents into {@link IAtlasDriveInfo}.
   */
  protected async listDrives(): Promise<IAtlasDriveInfo[]> {
    const nodes = await this.filetree.getTreeNodeChildren("");
    return nodes
      .filter((node) => node.nodeType === 'drive')
      .map((node) => this.safeParseNodeContents<IAtlasDriveInfo>(node.contents, 'drive'));
  }



  /**
   * Add a public file to the upload queue.
   *
   * @param file    - The file to upload.
   * @param options - Upload options (replicas, encryption, etc.).
   */
  public async queuePublicFile(file: File, options: IFileUploadOptions): Promise<void> {
    const queuedFile: IQueuedFile = {
      file,
      merkleRoot: new Uint8Array(),
      nonce: Math.floor(Math.random() * 2_147_483_647),
      replicas: options.replicas ?? DEFAULT_REPLICAS,
      metadata: {},
      status: 'idle',
    };

    this.queuedFiles.set(file.name, queuedFile);
  }

  /**
   * Add a private (encrypted) file to the upload queue.
   *
   *
   * @param file    - The file to upload.
   * @param options - Upload options (replicas, encryption config).
   */
  public async queuePrivateFile(file: File, options: IFileUploadOptions): Promise<void> {
    const queuedFile: IQueuedFile = {
      file,
      merkleRoot: new Uint8Array(),
      nonce: Math.floor(Math.random() * 2_147_483_647),
      replicas: options.replicas ?? DEFAULT_REPLICAS,
      metadata: {},
      encryption: options.encryption,
      status: 'idle',
    };

    this.queuedFiles.set(file.name, queuedFile);
  }

  /**
   * Commit queued files to the chain and upload them to storage providers.
   *
   * Runs the full upload pipeline for every file in the queue:
   *   1. Commit file metadata on chain via {@link commitAll}.
   *   2. Upload file data to provider(s) via {@link uploadAll}.
   *   3. Refresh the subscription and loaded folder state.
   *
   * @param provider - Optional provider hostname. When omitted, files are uploaded 
   *                   to randomly selected providers from the available pool.
   * @param dir      - The target directory path on the filetree. Defaults
   *                   to the currently loaded directory.
   */
  public async startUploads(provider: string = "", dir: string = this._directory.path) {
    if (this.queuedFiles.size === 0) {
      throw new Error('Cannot upload. Queue is empty.');
    }
    const queued = Array.from(this.queuedFiles.entries());

    await this.commitAll(queued, dir);
    await this.uploadAll(queued, provider);

    await this.loadSubscription();
    // await this.reloadDirectory();
  }

  protected async commitAll(files: Array<[string, IQueuedFile]>, dir: string) {
    const msgs: EncodeObject[] = [
      await this.filetree.incrementDirectoryItemCount(dir, files.length),
    ];

    for (const [key, queued] of files) {
      this.updateQueuedFileStatus(key, 'uploading');
      msgs.push(
        MessageComposer.MsgPostFile(
          queued.fid,
          this.client.address,
          queued.merkleRoot,
          queued.file.size,
          queued.replicas,
          this.subscription.id,
        ),
      );
      msgs.push(await this.filetree.createFile(queued, dir))
    }

    await this.client.signAndBroadcast(msgs);
  }

  protected async uploadAll(
    files: Array<[string, IQueuedFile]>,
    provider?: string,
  ): Promise<void> {
    if (this._providers.length === 0 && !provider) {
      throw new Error('Cannot upload. No storage providers available.');
    }

    await Promise.all(
      files.map(async ([key, queued]) => {
        await this.processFile(key);

        this.updateQueuedFileStatus(key, 'uploading');

        if (provider) {
          // Specific provider mode -- try the same provider up to 3 times
          await this.trySpecificProvider(key, queued, provider);
        } else {
          // Random provider mode -- try distinct providers up to 5 times
          await this.tryRandomProviders(key, queued);
        }
      }),
    );
  }

  /**
   * Attempt uploading to a single named provider, retrying up to
   * {@link SPECIFIC_PROVIDER_ATTEMPTS} times.
   */
  private async trySpecificProvider(
    key: string,
    queued: IQueuedFile,
    hostname: string,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= SPECIFIC_PROVIDER_ATTEMPTS; attempt++) {
      try {
        const result = await UploadHelper.upload(hostname, queued.fid, queued.file);

        if (result.success) {
          this.updateQueuedFileStatus(key, 'uploaded', 100);
          this.queuedFiles.delete(key);
          return;
        }
        lastError = new Error(result.message ?? `Upload returned unsuccessful status.`);
      } catch (err: any) {
        console.warn(
          `Upload attempt ${attempt}/${SPECIFIC_PROVIDER_ATTEMPTS} to "${hostname}" failed: ${err.message}.`,
        );
        lastError = err;
      }

      this.updateQueuedFileProgress(key, 0);
    }

    this.updateQueuedFileStatus(key, 'error');
    throw new Error(
      `Failed to upload file "${key}" to "${hostname}" after ${SPECIFIC_PROVIDER_ATTEMPTS} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Attempt uploading by trying distinct random providers until one succeeds
   * or all available options are exhausted (up to
   * {@link MAX_UPLOAD_PROVIDER_ATTEMPTS}).
   */
  private async tryRandomProviders(key: string, queued: IQueuedFile): Promise<void> {
    const tried = new Set<string>();
    let lastError: Error | null = null;

    while (tried.size < Math.min(MAX_UPLOAD_PROVIDER_ATTEMPTS, this._providers.length)) {
      const untried = this._providers.filter((p) => !tried.has(p.hostname));
      if (untried.length === 0) break;

      const provider = untried[Math.floor(Math.random() * untried.length)];
      tried.add(provider.hostname);

      try {
        const result = await UploadHelper.upload(provider.hostname, queued.fid, queued.file);

        if (result.success) {
          this.updateQueuedFileStatus(key, 'uploaded', 100);
          this.queuedFiles.delete(key);
          return;
        }
        lastError = new Error(result.message ?? `Upload returned unsuccessful status.`);
      } catch (err: any) {
        console.warn(
          `Upload to "${provider.hostname}" failed: ${err.message}. Trying next provider...`,
        );
        lastError = err;
      }

      this.updateQueuedFileProgress(key, 0);
    }

    this.updateQueuedFileStatus(key, 'error');
    throw new Error(
      `Failed to upload file "${key}" after ${tried.size} provider(s): ${lastError?.message}`,
    );
  }

  protected async processFile(fileKey: string): Promise<void> {
    const queuedFile = this.queuedFiles.get(fileKey);
    if (!queuedFile) throw new Error(`Queued file "${fileKey}" was not found.`);

    // Resolve progress scaling
    const progressBase = queuedFile.encryption ? 50 : 0;
    const progressRange = queuedFile.encryption ? 50 : 100;

    try {
      /// --- Step 1: Handle File Encryption if Needed
      if (queuedFile.encryption) {
        // Generate AES Key
        console.debug(`[ATLAS.JS] Encrypting "${fileKey}" (${queuedFile.file.size} bytes, chunkSize=${queuedFile.encryption.chunkSize ?? DEFAULT_ENCYRPTION_CHUNK_SIZE})`);
        this.updateQueuedFileStatus(fileKey, 'encrypting');
        queuedFile.encryption.aes = queuedFile.encryption.aes ?? (await generateAesKey());

        queuedFile.file = await encryptFile(queuedFile.file, queuedFile.encryption, (pct) => {
          this.updateQueuedFileProgress(fileKey, pct / 2);
        });

        console.debug(`[ATLAS.JS] Encrypted "${fileKey}" (${queuedFile.file.size} bytes)`);
        this.emit(FileProcessingEvent.ENCRYPTED, fileKey, { fileSize: queuedFile.file.size });
      }

      /// --- Step 2: Build File Merkletree
      this.updateQueuedFileStatus(fileKey, 'merkling', progressBase);
      const tree = await buildMerkleTree(queuedFile.file, undefined, { onProgress: (progress) => {
          this.updateQueuedFileProgress(fileKey, progressBase + (progress / 100) * progressRange)}
      });
      queuedFile.merkleRoot = tree.root;
      this.emit(FileProcessingEvent.MERKLE_BUILT, fileKey, { merkleRoot: bytesToHex(queuedFile.merkleRoot) });

      /// --- Step 3: Generate File ID
      queuedFile.fid = await buildFid(queuedFile.merkleRoot, this.client.address, queuedFile.nonce);
      this.queuedFiles.set(fileKey, queuedFile);

      this.updateQueuedFileStatus(fileKey, 'ready', 100);
      this.emit(FileProcessingEvent.READY, fileKey);
    } catch (error) {
      console.error(`[ATLAS.JS] Failed to process file "${fileKey}"`);
      this.handleFileProcessingError(fileKey, error);
    }
  }

  private updateQueuedFileStatus(fileKey: string, status: QueuedFileStatus, progress: number = 0): void {
    const queuedFile = this.queuedFiles.get(fileKey);
    if (queuedFile) {
      queuedFile.status = status;
      queuedFile.progress = progress;
      this.queuedFiles.set(fileKey, queuedFile);
      this.emit(FileProcessingEvent.PROGRESS, fileKey, progress);
    }
  }

  private updateQueuedFileProgress(fileKey: string, progress: number): void {
    const queuedFile = this.queuedFiles.get(fileKey);
    if (queuedFile) {
      queuedFile.progress = progress;
      this.queuedFiles.set(fileKey, queuedFile);
      this.emit(FileProcessingEvent.PROGRESS, fileKey, progress);
    }
  }

  private handleFileProcessingError(fileKey: string, error: unknown): void {
    if (!this.queuedFiles.has(fileKey)) {
      return;
    }
    this.updateQueuedFileStatus(fileKey, 'error', 0);
    this.emit(FileProcessingEvent.ERROR, fileKey, error);
  }

  private safeParseNodeContents<T>(contents: string, path: string): T {
    try {
      return JSON.parse(contents) as T;
    } catch (err: any) {
      // TODO: log warning using path
    }
  }
}

function parseNodeContents<T>(contents: string, path: string): T {
  try {
    return JSON.parse(contents) as T;
  } catch (error) {
    throw new Error(`Failed to parse filetree contents for "${path}": ${error}`);
  }
}

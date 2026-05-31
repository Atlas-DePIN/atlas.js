import { EventEmitter } from "events";
import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";
import { StorageSubscription } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/subscription";

import { TreeNode } from "@/types";
import { StorageEvents, StorageHandlerEvent, WalletEvents } from "@/types/events";
import { SubscriptionError } from "@/types/errors";
import { IAtlasDriveInfo, IAtlasDirectoryInfo, IDirectory } from "@/interfaces";
import { AtlasClient } from "./atlas-client";
import { SIGNER_SEED } from "./utils/constants";
import { PrivateKey } from "eciesjs";
import { bytesToHex } from "./utils/converters";
import { FiletreeHelper } from "./filetree-helper";

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
  /** The Atlas client used for chain queries and signing. */
  protected client: AtlasClient;

  /** ECIES private key derived from the wallet's signature. */
  protected access: PrivateKey;

  /** Helper for filetree read and write operations. */
  protected filetree: FiletreeHelper

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
  static async new(client: AtlasClient) {
    const handler = new StorageHandler(client)
    await handler.loadAccount()
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
      await this.filetree.createDrive(metadata)
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

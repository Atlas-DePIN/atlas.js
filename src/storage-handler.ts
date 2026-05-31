import { EventEmitter } from "events";
import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";
import { StorageSubscription } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/subscription";

import { TreeNode } from "@/types";
import { StorageEvents, StorageHandlerEvent, WalletEvents } from "@/types/events";
import { DirectoryLoadError, SubscriptionError } from "@/types/errors";
import { IAtlasDriveInfo, IAtlasDirectoryInfo, IDirectory } from "@/interfaces";
import { AtlasClient } from "./atlas-client";
import { SIGNER_SEED } from "./utils/constants";
import { PrivateKey } from "eciesjs";
import { bytesToHex } from "./utils/converters";
import { FiletreeHelper } from "./filetree-helper";


export class StorageHandler extends EventEmitter {
  protected client: AtlasClient;
  protected access: PrivateKey;
  protected filetree: FiletreeHelper
  
  private _providers: Provider[] = [];
  get providers(): Provider[] {
    return this._providers
  }

  private _subscription: StorageSubscription
  get subscription(): StorageSubscription {
    return this._subscription
  }

  private _drives: IAtlasDriveInfo[] = [];
  get drives(): IAtlasDriveInfo[] {
    return this._drives
  }

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

  static async new(client: AtlasClient) {
    const handler = new StorageHandler(client)
    await handler.loadAccount()
  }

  protected async enableSigner(): Promise<void> {
    const signature = await this.client.signMessage(SIGNER_SEED);
    this.access = PrivateKey.fromHex(bytesToHex(signature.signature));
    this.filetree.useAccessKey(this.access)
  }

  public async loadProviders(): Promise<void> {
    try {
      this._providers = await this.client.query.providers();
    } catch (err: any) {
      // TODO: log error
      throw err;
    }
  }

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
      // await this.loadDirectory('home');
      return
    } else {
      const defaultDrive = this.drives.find((drive) => drive.isDefault) ?? this.drives[0];
      // await this.loadDirectory(defaultDrive.name);
    }
  }

  public async loadSubscription(id?: string): Promise<void> {
    try {
      this._subscription = await this.client.query.subscription(this.client.address, id);
      this.emit(StorageHandlerEvent.SUB_NEW, this.subscription);
    } catch (error) {
      this.emit(StorageHandlerEvent.SUB_NONE);
      throw new SubscriptionError(`Failed to load subscription "${id}" for "${this.client.address}": ${error}`);
    }
  }

  public async loadDirectory(path: string, owner: string = this.client.address): Promise<void> {
    if (!owner) {
      throw new TypeError('Unable to load directory. No owner specified and no wallet connected.');
    }
    const node = await this.filetree.getTreeNode(path, owner)
    const nextDirectory: IDirectory = {
      metadata: JSON.parse(node.contents) as IAtlasDirectoryInfo,
      path,
      files: [],
      subdirs: [],
      objects: [],
    };

    const children: TreeNode[] = await this.filetree.getTreeNodeChildren(path, owner)
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

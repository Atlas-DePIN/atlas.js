import { EventEmitter } from "events";
import { StorageSubscription } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/subscription";

import { StorageEvents, StorageHandlerEvent, WalletEvents } from "@/types/events";
import { SubscriptionError } from "@/types/errors";
import { AtlasClient } from "./atlas-client";
import { IAtlasDriveInfo } from "@/interfaces/IAtlasDriveInfo";
import { SIGNER_SEED } from "./utils/constants";
import { PrivateKey } from "eciesjs";
import { bytesToHex } from "./utils/converters";
import { FiletreeHelper } from "./filetree-helper";


export class StorageHandler extends EventEmitter {
  protected client: AtlasClient;
  protected access: PrivateKey;
  protected filetree: FiletreeHelper
  
  private _subscription: StorageSubscription
  get subscription(): StorageSubscription {
    return this._subscription
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

  /**
   * Ask the wallet to sign a stable seed and derive the local ECIES keypair.
   *
   * The derived keypair is used only to wrap and unwrap file encryption keys.
   */
  private async enableSigner(): Promise<void> {
    const signature = await this.client.signMessage(SIGNER_SEED);
    this.access = PrivateKey.fromHex(bytesToHex(signature.signature));
    this.filetree.useAccessKey(this.access)
  }

  protected async loadAccount() {
    // TODO: reset
    try {
      await this.loadSubscription();
      await this.enableSigner();
    } catch (err: any) {
      // TODO: log warning
    }
    
    const drives = await this.listDrives();
  }

  /**
   * Load a subscription for the current handler address.
   *
   * Emits `NEW_SUB` when found and `NO_SUB` when the query fails.
   */
  public async loadSubscription(id?: string): Promise<void> {
    try {
      this._subscription = await this.client.query.subscription(this.client.address, id);
      this.emit(StorageHandlerEvent.NEW_SUB, this._subscription);
    } catch (error) {
      this.emit(StorageHandlerEvent.NO_SUB);
      throw new SubscriptionError(`Failed to load subscription "${id}" for "${this.client.address}": ${error}`);
    }
  }

  /**
   * Find all drive nodes owned by the current user.
   */
  public async listDrives(): Promise<IAtlasDriveInfo[]> {
    const nodes = await this.client.query.treeNodeChildren('', this._subscription.id, this.client.address) ?? [];
    // [TODO]: logic will change once encryting node contents is implemented
    return nodes
      .filter((node) => node.nodeType === 'drive')
      .map((node) => this.parseNodeContents<IAtlasDriveInfo>(node.contents, 'drive'));
  }

  private parseNodeContents<T>(contents: string, path: string): T {
    try {
      return JSON.parse(contents) as T;
    } catch (err: any) {
      // TODO: log warning using path
    }
  }
}



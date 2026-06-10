import EventEmitter from 'events';
import { IndexedTx } from '@cosmjs/stargate';
import { atlas } from '@atlas/atlas.js-protos';

import { 
  IAtlasClient,
  AtlasConfig,
  TxOptions,
} from "./interfaces"
import { WalletType } from './types'
import { ClientEvent, WalletEvents } from './types/events';

import { WalletManager } from './wallets';
import { QueryHelper } from './query-helper';
import { StorageHandler } from './storage-handler';

/**
 * High-level client for interacting with an Atlas blockchain node.
 *
 * Wraps a {@link WalletManager} for wallet lifecycle and a {@link QueryHelper}
 * for read-only queries.  Emits wallet and lifecycle events so consumers
 * can react to connection state changes without polling.
 */
export class AtlasClient extends EventEmitter implements IAtlasClient {
  /** Client-level configuration (chain ID, RPC endpoint, gas defaults). */
  private _config: AtlasConfig;

  /** Manages the active wallet session. */
  private _walletManager: WalletManager;

  /** Whether the query client has been initialized. */
  private _isInitialized: boolean = false;

  /** Read-only query helper for chain data. */
  private _queryHelper: QueryHelper;
  get query(): QueryHelper
  {
    return this._queryHelper
  }

  /**
   * Get the on-chain address of the active wallet, or an empty string
   * if no wallet is connected.
   */
  get address(): string {
    return this._walletManager.address
  }

  declare on: (event: ClientEvent | string, listener: (...args: any[]) => void) => this;
  declare off: (event: ClientEvent | string, listener: (...args: any[]) => void) => this;
  declare emit: (event: ClientEvent | string, ...args: any[]) => boolean;

  /**
   * @param config - Client configuration (chain ID, RPC endpoint,
   *                 optional gas price and adjustment).
   *
   * @throws If `chainId` or `rpcEndpoint` are missing.
   */
  constructor(config: AtlasConfig) {
    super();
    
    // Validate and save config
    if (!config.chainId) {
      throw new Error('chainId is required in config');
    }
    if (!config.rpcEndpoint) {
      throw new Error('rpcEndpoint is required in config');
    }
    this._config = config;
    
    // Create wallet manager
    this._walletManager = new WalletManager(config);

    // Forward wallet manager events
    this.setupEventForwarding();
  }

  static async new(config: AtlasConfig): Promise<AtlasClient> {
    const client = new AtlasClient(config);
    await client.initialize()
    return client;
  }

  /**
   * Initialize the query client and helper.
   *
   * Creates the raw RPC query client from the Atlas protobuf factory and
   * wraps it in a {@link QueryHelper}.  Emits {@link ClientEvent.INITIALIZED}
   * on success.  Safe to call multiple times since subsequent calls are no-ops.
   *
   * @throws If the RPC connection or protobuf client creation fails.
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      const qclient = await atlas.ClientFactory.createRPCQueryClient({rpcEndpoint: this._config.rpcEndpoint});
      this._queryHelper = new QueryHelper(qclient);
      this._isInitialized = true;

      this.emit(ClientEvent.INITIALIZED, {
        client: this,
        timestamp: Date.now()
      });
      console.debug('[ATLAS.JS] Atlas Client initialized!');
    } catch (error: any) {
      this.emit('error', error);
      throw new Error(`Failed to initialize AtlasClient: ${error.message}`);
    }
  }

  isInitialized(): boolean {
    return this._isInitialized
  }

  // ---------------------------------------------------------------------------
  // Wallet connection
  // ---------------------------------------------------------------------------

  /**
   * `true` when a wallet is connected and ready for signing operations.
   */
  isWalletConnected(): boolean {
    return this._walletManager.isConnected();
  }

  /**
   * Return the wallet type for the active session, or `null` if no wallet
   * is connected.
   */
  getWalletType(): WalletType | null {
    return this._walletManager.getWalletType();
  }

  /**
   * Connect a wallet of the specified type.
   *
   * Disconnects any existing wallet first.  Ensures the query client is
   * initialized before resolving.  Emits an `error` event on failure.
   *
   * @param type    - The wallet type (Keplr, Leap, Mnemonic, etc.).
   * @param options - Optional parameters forwarded to the wallet adapter.
   *
   * @throws If the wallet type is unavailable or connection fails.
   */
  async connectWallet(type: WalletType,  options?: any): Promise<void> {
    if (!this._isInitialized) await this.initialize();
    return await this._walletManager.connect(type, options);
  }

  /**
   * Disconnect the active wallet.
   */
  async disconnectWallet(): Promise<void> {
    await this._walletManager.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Wallet actions
  // ---------------------------------------------------------------------------

  /**
   * Sign an arbitrary message using the active wallet's key.
   *
   * @param message - The data to sign (plain string or raw bytes).
   * @returns An object containing the raw `signature` and the original
   *          `signedMessage`.
   *
   * @throws If no wallet is connected.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    if (!this.isWalletConnected()) {
      throw new Error('Wallet not connected. Connect a wallet first.');
    }

    const signature = await this._walletManager.signArbitrary(message);
    
    this.emit('messageSigned', {
      message,
      signature: signature
    });
    
    return signature
  }

  /**
   * Sign and broadcast a set of messages, then wait for
   * on-chain inclusion.
   *
   * When `options` is a plain string it is treated as the transaction
   * memo.  Polls for the transaction result until a timeout is reached.
   *
   * @param messages - Array of messages to include in the tx.
   * @param options  - Optional fee/gas/memo overrides.
   * @returns The indexed transaction once it appears on chain.
   *
   * @throws If no wallet is connected, broadcasting fails, or the
   *         transaction does not confirm within the timeout.
   */
  async signAndBroadcast(messages: any[], options?: TxOptions): Promise<IndexedTx> { 
    if (!this.isWalletConnected()) {
      throw new Error('Wallet not connected. Connect a wallet first.');
    }

    const txHash = await this._walletManager.signAndBroadcast(messages, options);
    const result = await this.waitForTransaction(txHash)
    console.debug(`[ATLAS.JS] Transaction ${txHash} succeeded!`);
    return result
  }

  /**
   * Poll for a transaction by hash until it appears on chain or a timeout
   * is reached.
   *
   * @param txHash       - The transaction hash to look up.
   * @param timeout      - Maximum time to wait in milliseconds (default 12000).
   * @param pollInterval - Time between polling attempts in milliseconds
   *                       (default 2000).
   * @returns The indexed transaction once included.
   *
   * @throws If the transaction fails on chain (non-zero code) or the
   *         timeout is exceeded.
   */
  private async waitForTransaction(txHash: string, timeout: number = 12000, pollInterval: number = 2000): Promise<IndexedTx> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const txResponse = await this._walletManager.getQueryClient().getTx(txHash);
        
        // Check if transaction has been included in a block
        if (txResponse) {
          // Check transaction status (code 0 means success)
          if (txResponse.code === 0) {
            return txResponse;
          } else {
            // Transaction failed with an error code
            throw new Error(
              `Transaction ${txHash} failed with code ${txResponse.code}: ${txResponse.rawLog}`
            );
          }
        }
      } catch (error) {
        // If error is not "not found", re-throw it
        if (!error.message?.includes('not found') && 
            !error.message?.includes('404') &&
            !error.message?.includes('does not exist')) {
          throw error;
        }
        // Transaction not found yet, continue polling
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transaction ${txHash} timeout after ${timeout}ms`);
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------------

  /**
   * Forward wallet lifecycle events from the WalletManager so consumers
   * listening on the AtlasClient receive them too.
   */
  private setupEventForwarding(): void {
    this._walletManager.on(WalletEvents.CONNECT, (connection) => {
      this.emit(WalletEvents.CONNECT, connection.address);
    });

    this._walletManager.on(WalletEvents.DISCONNECT, () => {
      this.emit(WalletEvents.DISCONNECT);
    });
  }

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  /**
   * Create a new storage handler bound to this client and its connected wallet.
   *
   * The handler manages the full storage lifecycle — subscriptions, providers,
   * drives, directory trees, uploads, encryption, and access key derivation.
   *
   * @returns A fresh {@link StorageHandler} instance.
   */
  createStorageHandler(): StorageHandler {
    return new StorageHandler(this);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Tear down the client: disconnect the wallet, mark as uninitialized,
   * and remove all event listeners.
   */
  async dispose(): Promise<void> {
    await this.disconnectWallet();
    this._isInitialized = false;
    this.removeAllListeners();
  }
}

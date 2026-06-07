import { Account, StargateClient, SigningStargateClient, DeliverTxResponse, calculateFee } from '@cosmjs/stargate';
import { Coin, OfflineSigner as OfflineAminoSigner, Registry } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';
import { TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { GlobalDecoderRegistry } from '@atlas/atlas.js-protos'
import { WalletType } from '../types/wallet'
import {
  AtlasConfig,
  TxOptions,
} from '../interfaces'

/**
 * Abstract base class for wallet implementations.
 *
 * Manages the lifecycle of a Cosmos-compatible wallet connection: connecting
 * to an RPC endpoint, initialising query and signing clients, and providing
 * transaction signing, simulation, and balance-querying primitives.
 *
 * Subclasses must implement {@link connect}, {@link disconnect},
 * {@link getWalletType}, and {@link signArbitrary}.
 */
export abstract class BaseWallet {
  /** Wallet-level configuration (RPC endpoint, gas price, etc.). */
  protected config: AtlasConfig;

  /** Active wallet address */
  protected _address: string = "";
  get address(): string {
    return this._address;
  }

  /** Read-only Stargate client for queries (balance, account info). */
  protected queryClient: StargateClient | null = null;

  /** Signing Stargate client for broadcasting transactions. */
  protected signingClient: SigningStargateClient | null = null;

  private _offlineSigner: any = null;

  /**
   * @param config - Configuration object containing endpoint, gas price,
   *                 and any subclass-specific options.
   */
  constructor(config: AtlasConfig) {
    this.config = config;
  }

  /**
   * Establish a wallet connection.
   *
   * Subclasses should initialize the signer, connect to the RPC endpoint
   * (via {@link initializeClients}), and return the resulting connection
   * metadata.
   */
  abstract connect(): Promise<void>;

  /** Tear down the wallet connection and release any held resources. */
  abstract disconnect(): Promise<void>;

  /** Return the concrete wallet type for this implementation. */
  abstract getWalletType(): WalletType;

  /**
   * Sign an arbitrary piece of data (string or bytes) using the wallet's key.
   *
   * @param data - The data to sign, as a string or `Uint8Array`.
   */
  abstract signArbitrary(data: string | Uint8Array): Promise<string>;
  
  /**
   * Check whether the wallet is currently connected and ready for use.
   *
   * Returns `true` when a `wallet` handle, `signingClient`, and `queryClient` 
   * are all not null.
   */
  isConnected(): boolean {
    return !!this._offlineSigner && !!this.signingClient && !!this.queryClient;
  }

  /**
   * Return the active signing client, or `null` if not connected.
   */
  getSigningClient(): SigningStargateClient | null {
    return this.signingClient;
  }

  /**
   * Return the active query client, or `null` if not connected.
   */
  getQueryClient(): StargateClient | null {
    return this.queryClient;
  }

  /**
   * Fetch the on-chain account information for the connected wallet address.
   *
   * @throws If the wallet is not connected.
   */
  async getAccountInfo(): Promise<Account> {
    this._validateConnection()
    return await this.queryClient.getAccount(this.address);
  }

  /**
   * Fetch all non-zero balance coins for the connected wallet address.
   *
   * @throws If the wallet is not connected.
   */
  async getAccountBalance(): Promise<readonly Coin[]> {
    this._validateConnection()
    return await this.queryClient.getAllBalances(this.address);
  }

  /**
   * Sign and broadcast a transaction constructed from a `TxBody`.
   *
   * Fee resolution order:
   * 1. `options.fee` if explicitly provided.
   * 2. Auto-calculated from `options.gas` + `config.gasPrice` if both are
   *    finite.
   * 3. Fall back to `options.gasAdjustment` or `config.gasAdjustment`, or
   *    the literal string `'auto'` as a last resort.
   *
   * @param txBody  - The transaction body containing messages.
   * @param options - Optional overrides for gas, fee, memo, and gas adjustment.
   * @returns The on-chain delivery response after broadcast.
   *
   * @throws If the wallet is not connected or the transaction fails.
   */
  async signAndBroadcastTransaction(txBody: TxBody, options?: TxOptions): Promise<DeliverTxResponse> {
    this._validateConnection()
    try {
      // Set gas limit and fee based on params or wallet config defaults
      const gasLimit = Number(options?.gas);
      const fee = options?.fee ?? (
        Number.isFinite(gasLimit) && gasLimit > 0
          ? calculateFee(Math.ceil(gasLimit), this.config.gasPrice || '0.025uatl')
          : options?.gasAdjustment ?? this.config.gasAdjustment ?? 'auto'
      );
      
      // Sign & broadcast the given transaction
      const txResponse = await this.signingClient.signAndBroadcast(
        this.address,
        txBody.messages,
        fee,
        options?.memo || ''
      );

      return txResponse;
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Simulate a transaction without broadcasting it.
   *
   * Uses the signing client's `simulate` method to dry-run the given
   * messages and return the estimated gas units.
   *
   * @param messages - The array of protobuf messages to simulate.
   * @param options  - Optional overrides (currently only `memo` is used).
   * @returns The estimated gas cost in gas units.
   *
   * @throws If the wallet is not connected.
   */
  async simulateTransaction(messages: any[], options?: TxOptions): Promise<number> {
    this._validateConnection()

    return await this.signingClient.simulate(this.address, messages, options?.memo || '');
  }

  /**
   * Initialize the query and signing Stargate clients.
   *
   * Connects a read-only `StargateClient` to the configured RPC endpoint,
   * then creates a `SigningStargateClient` using the provided offline
   * signer. The Atlas protobuf type registry (from `GlobalDecoderRegistry`)
   * is registered so that the signing client can encode/decode custom
   * message types.
   *
   * @param offlineSigner - The offline signer (Amino-compatible) to attach.
   * @param address       - The on-chain address corresponding to the signer.
   *
   * @throws If either client fails to initialize.
   */
  protected async initializeClients(offlineSigner: OfflineAminoSigner, address: string): Promise<void> {
    try {
      // Initialize query client
      this.queryClient = await StargateClient.connect(this.config.rpcEndpoint);

      // Create registry with atlas typeUrls
      const registry = new Registry();
      for (const [typeUrl, decoder] of Object.entries(GlobalDecoderRegistry.registry)) {
        registry.register(typeUrl, decoder as any);  // 'as any' to satisfy types (TelescopeGeneratedCodec extends GeneratedType)
      }

      // Initialize signing client
      const gasPrice = this.config.gasPrice 
        ? GasPrice.fromString(this.config.gasPrice)
        : GasPrice.fromString('0.025uatl');

      this.signingClient = await SigningStargateClient.connectWithSigner(
        this.config.rpcEndpoint,
        offlineSigner,
        { registry, gasPrice }
      );

      // Save wallet details
      this._address = address
      this._offlineSigner = offlineSigner
    } catch (error: any) {
      throw new Error(`Failed to initialize clients: ${error.message}`);
    }
  }

  /**
   * Re-initialize the query and signing clients using the existing
   * wallet connection.
   *
   * Useful after a network interruption or endpoint rotation.
   *
   * @throws If no wallet connection has been established.
   */
  async refreshClients(): Promise<void> {
    if (!this._offlineSigner || !this.address) {
      throw new Error('Cannot refresh clients without a proper connection established');
    }
    
    // Re-initialize clients
    await this.initializeClients(this._offlineSigner, this.address);
  }

  /**
   * Guard that throws if the wallet is not currently connected.
   *
   * Called internally by every method that requires an active connection.
   */
  private _validateConnection() {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
  }
}

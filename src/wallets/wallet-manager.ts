import EventEmitter from 'events';
import { Account, Coin, SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { WalletType } from '../types/wallet'
import { WalletEvents } from '../types/events'
import { 
  AtlasConfig,
  WalletInfo,
  TxOptions,
} from '../interfaces';

import { BaseWallet } from './base-wallet';
import { KeplrWallet } from './adapters/keplr-adapter';
// import { LeapWallet } from './adapters/leap-adapter';
// import { MnemonicWallet } from './adapters/mnemonic-adapter';

/**
 * Central wallet manager that orchestrates wallet lifecycle and delegates
 * chain operations to the active {@link BaseWallet} implementation.
 *
 * Extends `EventEmitter` to emit connect/disconnect events so consumers
 * can react to wallet state changes without polling.
 */
export class WalletManager extends EventEmitter {
  /** The active wallet adapter, or `null` when no wallet is connected. */
  private wallet: BaseWallet | null = null;

  /** Configuration shared with every wallet adapter instance. */
  private config: AtlasConfig;

  /**
   * @param config - Wallet configuration (RPC endpoint, gas price, etc.).
   */
  constructor(config: AtlasConfig) {
    super();
    this.config = config;
  }

  declare on: (event: WalletEvents | string, listener: (...args: any[]) => void) => this;
  declare off: (event: WalletEvents | string, listener: (...args: any[]) => void) => this;
  declare emit: (event: WalletEvents | string, ...args: any[]) => boolean;

  public get address(): string {
    return this.wallet?.address || "";
  }

  /**
   * Check whether a wallet is currently connected and ready.
   */
  isConnected(): boolean {
    return this.wallet ? this.wallet.isConnected() : false;
  }

  /**
   * Connect a wallet of the specified type.
   *
   * If a wallet is already connected it is disconnected first, ensuring
   * only one active session at a time.
   *
   * Emits {@link WalletEvents.CONNECT} on success.
   *
   * @param type    - The wallet type (Keplr, Leap, Mnemonic, etc.).
   * @param options - Optional parameters forwarded to the adapter
   *                  constructor (e.g. `mnemonic` for mnemonic wallets).
   * @returns Connection metadata for the newly-established session.
   *
   * @throws If the wallet type is unsupported or the browser extension
   *         is unavailable.
   */
  async connect(type: WalletType, options?: any): Promise<void> {
    // Disconnect existing wallet
    await this.disconnect();

    // Create wallet based on type
    switch (type) {
      case WalletType.KEPLR:
        if (!KeplrWallet.isAvailable()) {
          throw new Error('Keplr wallet is not available');
        }
        this.wallet = new KeplrWallet(this.config);
        break;
      
    //   case WalletType.LEAP:
    //     if (!LeapWallet.isAvailable()) {
    //       throw new Error('Leap wallet is not available');
    //     }
    //     this.wallet = new LeapWallet(this.config);
    //     break;
      
    //   case WalletType.MNEMONIC:
    //     if (!options?.mnemonic) {
    //       throw new Error('Mnemonic is required for mnemonic wallet');
    //     }
    //     this.wallet = new MnemonicWallet({
    //       ...this.config,
    //       mnemonic: options.mnemonic,
    //       hdPath: options.hdPath,
    //       prefix: options.prefix
    //     });
    //     break;
      
      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }

    // Connect wallet
    await this.wallet.connect();
    
    this.emit(WalletEvents.CONNECT, this.wallet.address);
  }

  /**
   * Disconnect the active wallet.
   *
   * Delegates to the adapter's `disconnect`, clears the internal reference,
   * and emits {@link WalletEvents.DISCONNECT}.  Safe to call when no wallet
   * is connected.
   */
  async disconnect(): Promise<void> {
    if (this.wallet) {
      // Disconnect wallet
      await this.wallet.disconnect();
      this.wallet = null;

      this.emit(WalletEvents.DISCONNECT, null);
    }
  }

  /**
   * Return the read-only Stargate client from the active wallet, or `null`
   * if no wallet is connected.
   */
  getQueryClient(): StargateClient | null {
    return this.wallet?.getQueryClient() || null;
  }

  /**
   * Return the signing Stargate client from the active wallet, or `null`
   * if no wallet is connected.
   */
  getSigningClient(): SigningStargateClient | null {
    return this.wallet?.getSigningClient() || null;
  }

  /**
   * Return the wallet type, or `null` if no wallet is connected.
   */
  getWalletType(): WalletType | null {
    return this.wallet?.getWalletType() || null;
  }

  /**
   * Fetch on-chain account information for the connected wallet address.
   *
   * @throws If no wallet is connected.
   */
  async getAccountInfo(): Promise<Account> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }
    return await this.wallet.getAccountInfo();
  }

  /**
   * Fetch all non-zero balance coins for the connected wallet address.
   *
   * @throws If no wallet is connected.
   */
  async getAccountBalance(): Promise<readonly Coin[]> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }
    return await this.wallet.getAccountBalance();
  }

  /**
   * Sign arbitrary data using the active wallet's key.
   *
   * @param data - The data to sign (string or raw bytes).
   *
   * @throws If no wallet is connected.
   */
  async signArbitrary(data: string | Uint8Array): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }
    return await this.wallet.signArbitrary(data);
  }

  /**
   * Sign and broadcast a set of messages.
   *
   * Constructs a minimal `TxBody` from the message array and delegates
   * to the underlying wallet's `signAndBroadcastTransaction`.  Returns
   * only the transaction hash.
   *
   * @param messages - Array of messages to include in the tx.
   * @param options  - Optional gas, fee, and memo overrides.
   * @returns The on-chain transaction hash.
   *
   * @throws If no wallet is connected or broadcasting fails.
   */
  async signAndBroadcast(messages: any[], options?: TxOptions): Promise<string> {
    const tx: TxBody = { messages: messages } as TxBody;
    console.debug("[ATLAS.JS] Signed Tx Msgs:", tx.messages)

    const txResponse = await this.wallet.signAndBroadcastTransaction(tx, options);
    console.debug("[ATLAS.JS] Tx Result:", txResponse)
    return txResponse.transactionHash
  }

  /**
   * Dry-run a set of messages and return the estimated gas cost
   * without broadcasting.
   *
   * @param messages - Array of messages to simulate.
   * @param options  - Optional overrides (currently only memo is used).
   * @returns Estimated gas units.
   *
   * @throws If no wallet is connected.
   */
  async simulateTransaction(messages: any[], options?: TxOptions): Promise<number> {
    return await this.wallet.simulateTransaction(messages, options);
  }

  /**
   * Re-initialize the underlying query and signing clients using the
   * active wallet's existing signer and address.
   *
   * Useful after a network interruption or RPC endpoint rotation.
   *
   * @throws If no wallet is connected.
   */
  async refreshConnection(): Promise<void> {
    await this.wallet.refreshClients();
  }

  /**
   * Return metadata for all wallet types that can be used in the current
   * environment.
   *
   * Checks whether each browser extension (Keplr, etc.) is installed and
   * reports the result so the UI can show which options are available.
   */
  getAvailableWallets(): WalletInfo[] {
    const wallets: WalletInfo[] = [];

    // Check Keplr
    wallets.push({
      name: 'Keplr',
      logo: 'keplr-logo',
      isInstalled: typeof window !== 'undefined' && !!window.keplr,
      isAvailable: true
    });

    // Check Leap
    // wallets.push({
    //   name: 'Leap',
    //   logo: 'leap-logo',
    //   isInstalled: typeof window !== 'undefined' && !!window.leap,
    //   isAvailable: true
    // });

    return wallets;
  }
}

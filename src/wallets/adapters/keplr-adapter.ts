import { OfflineSigner } from '@cosmjs/proto-signing';

import { WalletType } from '@/types/wallet';
import { 
  WalletConnection, 
  SigningResult,  
} from '@/interfaces/wallet';

import { BaseWallet } from '@/wallets';
import { atlasDevnetChainConfig } from '@/defaults';

declare global {
  interface Window {
    keplr: any;
    leap: any;
  }
}

export class KeplrWallet extends BaseWallet {
  private keplr: any;

  constructor(config: any) {
    super(config);
    this.keplr = window.keplr;
  }

  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.keplr;
  }

  getWalletType(): WalletType {
    return WalletType.KEPLR;
  }

  async connect(): Promise<WalletConnection> {
    if (!this.keplr) {
      throw new Error('Keplr wallet not installed');
    }

    try {
      // Enable Keplr for the chain
      await this.keplr.experimentalSuggestChain(atlasDevnetChainConfig);
      await this.keplr.enable(this.config.chainId);
      
      // Get offline signer from Keplr
      const offlineSigner: OfflineSigner = this.keplr.getOfflineSigner(this.config.chainId);
      
      // Get accounts
      const accounts = await offlineSigner.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found in Keplr wallet');
      }

      // Initialize clients with the offline signer
      await this.initializeClients(offlineSigner, accounts[0].address);

      if (!this.wallet) {
        throw new Error('Failed to create wallet connection');
      }

      return this.wallet;
    } catch (error: any) {
      throw new Error(`Keplr connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.signingClient = null;
    this.queryClient = null;
    this.wallet = null;
  }

  async signArbitrary(data: string | Uint8Array): Promise<SigningResult> {
    if (!this.wallet) {
      throw new Error("Wallet not connected");
    }

    try {
      const signature = await this.keplr.signArbitrary(this.config.chainId, this.wallet.address, data);

      return {
        signature: Uint8Array.from(atob(signature.signature), c => c.charCodeAt(0)),
        txHash: ''
      };
    } catch (error: any) {
      throw new Error(`Signing failed: ${error.message}`);
    }
  }
}
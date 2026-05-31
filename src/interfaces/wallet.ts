import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { WalletType } from "@/types/wallet";

export interface WalletInfo {
  name: string;
  logo: string;
  isInstalled: boolean;
  isAvailable: boolean;
}

export interface WalletConfig {
  chainId: string;
  rpcEndpoint?: string;
  restEndpoint?: string;
  gasPrice?: string;
  gasAdjustment?: number;
}

export interface WalletConnection {
  address: string;
  walletType: WalletType;
  offlineSigner?: any;
}

export interface TxOptions {
  memo?: string;
  fee?: any;
  gas?: string;
  gasAdjustment?: number;
}

export interface SigningResult {
  signedTx?: TxRaw;
  txHash?: string;
  signature: Uint8Array;
}


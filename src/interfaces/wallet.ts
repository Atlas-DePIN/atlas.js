import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

export interface WalletInfo {
  name: string;
  logo: string;
  isInstalled: boolean;
  isAvailable: boolean;
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

import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";

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

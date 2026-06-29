import type { WalletType } from "../../types"
import type { QueryHelper } from "../../query-helper";
import type { StorageManager } from "../../storage-manager";
import type { TxOptions } from "../../interfaces/wallet";
import type { IndexedTx } from "@cosmjs/stargate";

export interface IAtlasClient {
  get query(): QueryHelper;
  get address(): string;

  initialize(): Promise<void>;
  isInitialized(): boolean;
  dispose(): Promise<void>;

  connectWallet(type: WalletType, options?: any): Promise<void>;
  disconnectWallet(): Promise<void>;
  isWalletConnected(): boolean;
  getWalletType(): WalletType | null;

  signMessage(message: string | Uint8Array): Promise<string>;
  signAndBroadcast(messages: any[], options?: TxOptions): Promise<IndexedTx>;
}

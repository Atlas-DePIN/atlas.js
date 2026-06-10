import { WalletType } from "../../types"
import { QueryHelper } from "../../query-helper";

export interface IAtlasClient  {
  get query(): QueryHelper
  get address(): string

  initialize(): Promise<void>
  isInitialized(): boolean

  connectWallet(type: WalletType, options?: any): Promise<void>
  disconnectWallet(): Promise<void>
  isWalletConnected(): boolean
  getWalletType(): WalletType | null

}

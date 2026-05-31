import { Query as BankQuery } from "@atlas/atlas.js-protos/dist/types/cosmos/bank/v1beta1/query.rpc.Query";
import { Query as FiletreeQuery } from "@atlas/atlas.js-protos/dist/types/atlas/filetree/v1/query.rpc.Query";
import { Query as StorageQuery } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/query.rpc.Query";

export enum WalletType {
  KEPLR = 'keplr',
  LEAP = 'leap',
  MNEMONIC = 'mnemonic',
  NONE = 'none'
}

export interface IChainConfig {
  chainId: string
  chainName: string
  rpc: string
  rest: string
  bip44: {
    coinType: number
  }
  stakeCurrency: {
    coinDenom: string
    coinMinimalDenom: string
    coinDecimals: number
  }
  bech32Config: {
    bech32PrefixAccAddr: string
    bech32PrefixAccPub: string
    bech32PrefixValAddr: string
    bech32PrefixValPub: string
    bech32PrefixConsAddr: string
    bech32PrefixConsPub: string
  }
  currencies: IChainCurrency[]
  feeCurrencies: IChainCurrency[]
  features: string[]
}

interface IChainCurrency {
  coinDenom: string
  coinMinimalDenom: string
  coinDecimals: number
  gasPriceStep?: {
    low: number
    average: number
    high: number
  }
}

export interface QueryClient {
  cosmos: {
    bank: {
      v1beta1: BankQuery
    }
  },
  atlas: {
    filetree: {
      v1: FiletreeQuery,
    },
    storage: {
      v1: StorageQuery,
    }
  }
}

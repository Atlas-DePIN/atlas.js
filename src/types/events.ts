export enum ClientEvent {
  INITIALIZED = 'initialized',
}

export enum WalletEvents {
  CONNECT = 'connected',
  DISCONNECT = 'disconnected',
}

export enum StorageEvents {
  NONE = 'none'
}

export enum StorageHandlerEvent {
  NO_SUB = 'no-subscription',
  NEW_SUB = 'new-subscription'
}

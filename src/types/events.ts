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
  SUB_NONE = 'no-subscription',
  SUB_NEW = 'new-subscription',

  DIR_NAV = 'navigate-directory'
}

export enum FileProcessingEvent {
  PROGRESS = 'file:progress',
  ENCRYPTED = 'file:encrypted',
  MERKLE_BUILT = 'file:merkle-built',
  READY = 'file:ready',
  ERROR = 'file:error',
}

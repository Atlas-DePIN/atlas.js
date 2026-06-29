// ---------------------------------------------------------------------------
// Types / interfaces
// ---------------------------------------------------------------------------

export type {
  IAtlasClient,
  IQueryHelper,
  IStorageManager,
  IStorageHandler,
  AtlasConfig,
} from './interfaces';

export type {
  FileStats,
  StorageStats,
  IChainConfig,
  TreeNode,
  QueryClient,
  WalletInfo,
  TxOptions,
} from './types';

export {
  Privacy,
} from './types';

export type {
  IAtlasDriveInfo,
  IAtlasDirectoryInfo,
  IAtlasFileInfo,
  IDirectory,
  IQueuedFile,
  IFileUploadOptions,
  IFileUploadProgress,
  IEncryptionOptions,
} from './interfaces';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export {
  SubscriptionError,
  ProviderError,
  DirectoryLoadError,
  CancellationException,
} from './types/errors';

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export { AtlasClient } from './atlas-client';
export { StorageManager } from './storage-manager';
export { StorageHandler, UploadedFile } from './storage-handler';
export { UploadHelper, UploadResult } from './upload-helper';
export { FiletreeHelper } from './filetree-helper';
export { QueryHelper } from './query-helper';
export { WalletManager } from './wallets';
export { BaseWallet } from './wallets/base-wallet';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export { WalletType } from './types/wallet';
export {
  ClientEvent,
  WalletEvents,
  StorageEvents,
  StorageHandlerEvent,
  FileProcessingEvent,
} from './types/events';

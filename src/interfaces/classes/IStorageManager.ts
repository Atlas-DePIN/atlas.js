import type { IAtlasDriveInfo, IDirectory, IFileUploadOptions } from "../../interfaces";
import type { StorageEvents } from "../../types/events";

import { Provider, StorageSubscription } from "atlas.js-protos/storage";

export interface IStorageManager {
  get providers(): Provider[];
  get subscription(): StorageSubscription;
  get drives(): IAtlasDriveInfo[];
  get directory(): IDirectory;

  on: (event: StorageEvents | string, listener: (...args: any[]) => void) => this;
  off: (event: StorageEvents | string, listener: (...args: any[]) => void) => this;
  emit: (event: StorageEvents | string, ...args: any[]) => boolean;

  loadProviders(hostnames?: string[]): Promise<void>;
  loadSubscription(id?: string): Promise<void>;
  loadDirectory(path: string, owner?: string): Promise<void>;
  listSubscriptions(): Promise<StorageSubscription[]>;
  purchaseSubscription(bytes: number, days: number, isDefault: boolean, address?: string): Promise<string>;

  queuePublicFile(file: File, options: IFileUploadOptions): Promise<void>;
  queuePrivateFile(file: File, options: IFileUploadOptions): Promise<void>;
  startUploads(provider?: string, dir?: string): Promise<void>;

  downloadFile(fid: string, basepath?: string): Promise<File>;
  deleteFile(fid: string, basepath?: string): Promise<string>;
}

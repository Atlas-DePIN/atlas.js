import type { IAesBundle, IEncryptionOptions } from "../../interfaces";
import type { Privacy } from "../../types";
import type { UploadedFile } from "../../storage-handler";

import { Provider } from "atlas.js-protos/storage";

export interface IStorageHandler {
  get providers(): Provider[];

  loadProviders(hostnames?: string[]): Promise<void>;
  purchaseSubscription(bytes: number, days: number, isDefault: boolean, address?: string): Promise<string>;

  uploadFile(
    file: File,
    subscriptionId: string,
    privacy?: Privacy,
    opts?: {
      replicas?: number;
      encryption?: IEncryptionOptions;
      provider?: string;
      maxProviderAttempts?: number;
    },
  ): Promise<UploadedFile>;

  uploadFiles(
    files: File[],
    subscriptionId: string,
    privacy?: Privacy,
    opts?: {
      replicas?: number;
      encryption?: IEncryptionOptions;
      provider?: string;
      maxProviderAttempts?: number;
    },
  ): Promise<UploadedFile[]>;

  downloadFile(fid: string, aes?: IAesBundle, provider?: string, name?: string): Promise<File>;
  downloadRaw(fid: string, provider: string, name?: string): Promise<File>;

  deleteFile(fid: string): Promise<string>;
  deleteFiles(fids: string[]): Promise<string[]>;
}

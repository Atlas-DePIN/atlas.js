import { QueuedFileStatus } from "@/types/storage"
import { IEncryptionOptions } from "./IEncryptionOptions"
import { IFileMetadata } from "./IAtlasFileInfo"

export interface IQueuedFile {
  file: File
  fid?: string
  nonce: number
  merkleRoot: Uint8Array
  replicas: number
  metadata: Partial<IFileMetadata>;
  
  encryption?: IEncryptionOptions

  status: QueuedFileStatus
  progress?: number
}

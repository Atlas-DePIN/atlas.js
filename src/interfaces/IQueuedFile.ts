import { QueuedFileStatus } from "@/types/storage"
import { IEncryptionOptions } from "./IEncryptionOptions"

export interface IQueuedFile {
  file: File
  fid?: string
  nonce: number
  merkleRoot: Uint8Array
  replicas: number

  encryption?: IEncryptionOptions

  status: QueuedFileStatus
  progress?: number
  abortController?: AbortController;
}

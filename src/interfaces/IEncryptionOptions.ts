import { IAesBundle } from "./IAesBundle";

export interface IEncryptionOptions {
  chunkSize?: number;
  aes?: IAesBundle;
}

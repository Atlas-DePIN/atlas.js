import { QueuedFileStatus } from "../types";

export interface IFileUploadProgress {
  status: QueuedFileStatus;
  progress: number;
}
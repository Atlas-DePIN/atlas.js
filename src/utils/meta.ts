import { IAtlasFileInfo, IQueuedFile } from "../interfaces";
import { bytesToHex } from "./converters";

export function parseNodeContents<T>(contents: string, path: string): T {
  try {
    return JSON.parse(contents) as T;
  } catch (error) {
    throw new Error(`Failed to parse filetree contents for "${path}": ${error}`);
  }
}

/**
 * Build the JSON contents stored in the filetree node for an uploaded file.
 */
export function buildFileNodeContents(queuedFile: IQueuedFile, dir: string): IAtlasFileInfo {
  const now = Date.now();
  const file = queuedFile.file;

  return {
    fid: queuedFile.fid,
    owner: this.client.address,
    merkleRoot: bytesToHex(queuedFile.merkleRoot),
    dateUpdated: now,
    dateCreated: now,
    encrypted: queuedFile.encryption !== undefined,
    meta: {
      ...queuedFile.metadata,
      name: queuedFile.metadata?.name ?? file.name,
      type: file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : file.type,
      mime: file.type,
      size: queuedFile.metadata?.size ?? file.size,
      lastModified: queuedFile.metadata?.lastModified ?? file.lastModified,
    },
  };
}
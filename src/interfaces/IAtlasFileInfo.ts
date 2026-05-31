import { INodeContents } from "./INodeContents"

export interface IAtlasFileInfo extends INodeContents {
  fid: string
  merkleRoot: string
  encrypted: boolean
  meta: IFileMetadata
}

interface IFileMetadataBase {
  name: string
  type: string
  size: number
  lastModified: number
}

export interface IFileMetadata extends IFileMetadataBase {
  [k: string]: any
}
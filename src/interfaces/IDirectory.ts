import { IAtlasDirectoryInfo } from "./IAtlasDirectoryInfo"
import { IAtlasFileInfo } from "./IAtlasFileInfo"

export interface IDirectory {  
  path: string
  metadata: IAtlasDirectoryInfo

  files: IAtlasFileInfo[]
  subdirs: IAtlasDirectoryInfo[]
  objects: string[]
}
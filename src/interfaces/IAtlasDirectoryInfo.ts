import { INodeContents } from "./INodeContents"

export interface IAtlasDirectoryInfo extends INodeContents {
  name: string
  itemCount: number
}

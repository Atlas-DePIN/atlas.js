import { QueryFileStatsResponse, QueryStorageStatsResponse } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/query";
import { TreeNode as AtlasTreeNode } from "@atlas/atlas.js-protos/dist/types/atlas/filetree/v1/tree";

export enum EncryptionType {
  PUBLIC,
  ENCRYPTED,
  PASSWORD_PROTECTED
}

export type FileStats = QueryFileStatsResponse
export type StorageStats = QueryStorageStatsResponse

export type TreeNode = AtlasTreeNode & {
  encryption: EncryptionType
}
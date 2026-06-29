import { QueryFileStatsResponse, QueryStorageStatsResponse } from "atlas.js-protos/storage/query";
import { TreeNode as AtlasTreeNode } from "atlas.js-protos/filetree";

export enum Privacy {
  PUBLIC,
  ENCRYPTED,
  PASSWORD_PROTECTED,
}

export type FileStats = QueryFileStatsResponse
export type StorageStats = QueryStorageStatsResponse

export type TreeNode = AtlasTreeNode & {
  encryption: Privacy
}

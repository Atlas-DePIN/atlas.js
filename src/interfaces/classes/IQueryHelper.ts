import { File, Provider, StorageSubscription } from "atlas.js-protos/storage";
import { TreeNode } from "atlas.js-protos/filetree";
import { FileStats, StorageStats } from "../../types";

export interface IQueryHelper {
  fileStats(): Promise<FileStats>;
  storageStats(): Promise<StorageStats>;

  file(fid: string): Promise<File>;
  subscription(address: string, id?: string): Promise<StorageSubscription>;
  subscriptions(address?: string): Promise<StorageSubscription[]>;
  provider(address: string): Promise<Provider>;
  providers(): Promise<Provider[]>;

  treeNode(owner: string, path: string): Promise<TreeNode>;
  treeNodeChildren(owner: string, path: string): Promise<TreeNode[]>;
}

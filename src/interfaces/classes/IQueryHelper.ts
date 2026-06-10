import { StorageSubscription } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/subscription";
import { File } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/file";
import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";
import { TreeNode } from "@atlas/atlas.js-protos/dist/types/atlas/filetree/v1/tree";
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

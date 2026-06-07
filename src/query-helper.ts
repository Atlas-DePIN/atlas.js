import { StorageSubscription } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/subscription";
import { File } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/file";
import { Provider } from "@atlas/atlas.js-protos/dist/types/atlas/storage/v1/provider";
import { TreeNode } from "@atlas/atlas.js-protos/dist/types/atlas/filetree/v1/tree";

import { IQueryHelper } from "./interfaces";

import { FileStats, StorageStats } from "./types";
import { QueryClient } from "./types/wallet";

export class QueryHelper implements IQueryHelper {
  protected client: QueryClient

  constructor(client: QueryClient) {
    this.client = client
  }

  fileStats = async (): Promise<FileStats> =>
    await this.client.atlas.storage.v1.fileStats();
  
  storageStats = async (): Promise<StorageStats> => 
    await this.client.atlas.storage.v1.storageStats();

  file = async (fid: string): Promise<File> =>
    (await this.client.atlas.storage.v1.file({ fid })).file;

  subscriptions = async (address: string): Promise<StorageSubscription[]> => 
    (await this.client.atlas.storage.v1.subscriptions({ subscriberAddress: address })).subscriptions ?? [];

  provider = async (address: string): Promise<Provider> =>
    (await this.client.atlas.storage.v1.provider({address})).provider;

  providers = async (): Promise<Provider[]> =>
    (await this.client.atlas.storage.v1.providers({})).providers ?? [];

  treeNode = async (owner: string, path: string): Promise<TreeNode> => 
    (await this.client.atlas.filetree.v1.treeNode({ path, owner })).node;

  treeNodeChildren  = async (owner: string, path: string): Promise<TreeNode[]> => 
    (await this.client.atlas.filetree.v1.treeNodeChildren({ owner, path })).nodes ?? [];


  async subscription(address: string, id: string = ""): Promise<StorageSubscription> {
    const res = await this.client.atlas.storage.v1.subscription({ 
      subscriberAddress: address,
      subscriptionId: id
    })

    res.subscription.spaceUsed /= 3
    res.subscription.spaceAvailable /= 3

    return res.subscription
  }
}

import { AtlasClient } from "@/atlas-client";
import { PrivateKey } from "eciesjs";
import { IAesBundle } from "@/interfaces";
import { aesStringCrypt, importAesBundle } from "@/utils/crypto";
import { EncryptionType, TreeNode } from "@/types"



export class FiletreeHelper {
  protected client: AtlasClient
  protected accessKey?: PrivateKey

  constructor(client: AtlasClient) {
    this.client = client
  }

  public async useAccessKey(accessKey: PrivateKey) {
    this.accessKey = accessKey
  }

  public async getTreeNodeChildren(susbcription: string): Promise<TreeNode[]> {
    const raw = await this.client.query.treeNodeChildren('', susbcription, this.client.address) as TreeNode[] ?? []
    const nodes = []

    for (const node of raw) {
      try {
        switch (node.contents.slice(1)) {
          case "1":
            const aes = await this.extractAesKey(node.viewers)
            node.contents = await aesStringCrypt(node.contents, aes, 'decrypt')
            node.encryption = EncryptionType.ENCRYPTED
            break
          case "2":
            // TODO: password-protected file
            node.encryption = EncryptionType.PASSWORD_PROTECTED
            break
          case "0":
          default:
            node.encryption = EncryptionType.PUBLIC
            break
        }
        nodes.push(node)
      } catch (err: any) {
        // TODO: log warning
      }
    }

    return nodes
  }

  /**
   * Decrypt the AES bundle granted to the connected wallet.
   */
  protected async extractAesKey(permissions: string): Promise<IAesBundle> {
    if (!this.accessKey) {
      // TODO: throw error not authorized
    }

    if (permissions.includes(this.client.address)) {
      const secret = JSON.parse(permissions)[this.client.address]
      return importAesBundle(this.accessKey, secret)
    }
    else {
      // TODO: throw error not authorized
    }
  }
}
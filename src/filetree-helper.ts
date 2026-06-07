import { AtlasClient } from "./atlas-client";
import { PrivateKey } from "eciesjs";
import { IAesBundle, IAtlasDirectoryInfo, IAtlasDriveInfo, IAtlasFileInfo, IQueuedFile, IReadAuthorityKeeper } from "./interfaces";
import { aesStringCrypt, exportAesBundle, generateAesKey, importAesBundle } from "./utils/crypto";
import { EncryptionType, TreeNode } from "./types"
import { MessageComposer } from "./utils/composer";
import { bytesToHex } from "./utils/converters";
import { EncodeObject } from "@atlas/atlas.js-protos";
import { buildFileNodeContents, parseNodeContents } from "./utils/meta";


export class FiletreeHelper {
  protected client: AtlasClient
  protected accessKey?: PrivateKey

  constructor(client: AtlasClient) {
    this.client = client
  }

  public async setAccessKey(accessKey: PrivateKey) {
    this.accessKey = accessKey
    console.debug(`[ATLAS.JS] FiletreeHelper Access Key: `, this.accessKey)
  }

  public async getTreeNodeChildren(path: string, owner: string = this.client.address): Promise<TreeNode[]> {
    const raw = await this.client.query.treeNodeChildren(owner, path) as TreeNode[]
    const nodes = []

    for (const node of raw) {
      try {
        nodes.push(await this.decryptTreeNode(node))
      } catch (err: any) {
        // TODO: log warning
      }
    }

    return nodes
  }

  public async getTreeNode(path: string, owner: string = this.client.address): Promise<TreeNode> {
    const node = await this.client.query.treeNode(owner, path) as TreeNode | null
    if (!node || !node.contents) {
      throw new Error(`Filetree node "${path}" was not found for owner "${owner}".`);
    }

    try {
      return await this.decryptTreeNode(node)
    } catch (err: any) {
      // TODO: log warning
    }
  }

  /**
   * Create a top-level drive node for the active account.
   */
  public async createDrive(metadata: IAtlasDriveInfo, encryption: EncryptionType = EncryptionType.ENCRYPTED): Promise<EncodeObject> {
    this.requireSigner();

    let contents = JSON.stringify(metadata)
    let readAuthorities = {}

    switch (encryption) {
      case EncryptionType.ENCRYPTED:
        // Create a new AES key
        const aes = await generateAesKey();
        // Encrypt the drive name and contents
        metadata.name = await aesStringCrypt(metadata.name, aes, "encrypt")
        contents = await aesStringCrypt(contents, aes, "encrypt")
        // Store AES key under viewers
        readAuthorities = await this.addReadAuthority({}, this.client.address, aes)
        break
      default:
        break
    }

    // Create & broadcast PostNode Tx message
    return MessageComposer.MsgPostNode(
      this.client.address,
      metadata.name,
      'drive',
      encryption + contents,
      readAuthorities,
      []
    );
  }

  public async createFile(file: IQueuedFile, dir: string): Promise<EncodeObject> {
    console.debug(`[ATLAS.JS] Create file ${file.fid} @ ${dir}`)
    let contents = JSON.stringify(buildFileNodeContents(file, this.client.address));
    let readAuthorities = {}

    if (file.encryption?.aes) {
      contents = await aesStringCrypt(contents, file.encryption.aes, "encrypt")
      readAuthorities = await this.addReadAuthority({}, this.client.address, file.encryption.aes)
    }

    return MessageComposer.MsgPostNode(
      this.client.address,
      `${dir.replace(/\/+$/, '')}/${file.fid.replace(/^\/+/, '')}`,
      'file',
      contents,
      readAuthorities,
      []
    )
  }

  public async createDirectory(): Promise<EncodeObject> {
    throw Error("Not Implemented")
  }

  /**
   * Build a replacement directory node with an adjusted child item count.
   */
  public async incrementDirectoryItemCount(path: string, delta: number): Promise<EncodeObject> {
    const folderNode = await this.getTreeNode(path)
    const contents = parseNodeContents<IAtlasDirectoryInfo>(folderNode.contents, path);

    contents.itemCount = Math.max(0, (contents.itemCount ?? 0) + delta);
    contents.dateUpdated = Date.now();

    return MessageComposer.MsgPostNodeRaw(
      this.client.address,
      path,
      folderNode.nodeType,
      JSON.stringify(contents),
      folderNode.viewers,
      folderNode.editors,
    );
  }

  private async decryptTreeNode(node: TreeNode): Promise<TreeNode> {
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
    return node
  }

  /**
   * Decrypt the AES bundle granted to the connected wallet.
   */
  private async extractAesKey(permissions: string): Promise<IAesBundle> {
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

  /**
   * Build viewer/editor authority bundles for encrypted files.
   *
   * Unencrypted files do not need authority bundles.
   */
  private async addReadAuthority(authorities: IReadAuthorityKeeper, address: string, aes: IAesBundle): Promise<IReadAuthorityKeeper> {
    authorities[address] = await exportAesBundle(this.accessKey.publicKey.toHex(), aes)
    return authorities
  }

  /**
   * Ensure the handler is operating on the currently connected wallet account.
   */
  private requireSigner(): void {
    if (!this.accessKey) {
      console.error(`[ATLAS.JS] FiletreeHelper cannot perform this operation without a signer.`)
      throw new Error(`Signer is not enabled.`);
    }
  }
}
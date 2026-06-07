[**atlas.js v0.2.0**](../README.md)

***

[atlas.js](../README.md) / FiletreeHelper

# Class: FiletreeHelper

Defined in: [src/filetree-helper.ts:12](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L12)

## Constructors

### Constructor

> **new FiletreeHelper**(`client`): `FiletreeHelper`

Defined in: [src/filetree-helper.ts:16](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L16)

#### Parameters

##### client

[`AtlasClient`](AtlasClient.md)

#### Returns

`FiletreeHelper`

## Properties

### accessKey?

> `protected` `optional` **accessKey?**: `PrivateKey`

Defined in: [src/filetree-helper.ts:14](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L14)

***

### client

> `protected` **client**: [`AtlasClient`](AtlasClient.md)

Defined in: [src/filetree-helper.ts:13](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L13)

## Methods

### createDirectory()

> **createDirectory**(): `Promise`\<`EncodeObject`\>

Defined in: [src/filetree-helper.ts:107](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L107)

#### Returns

`Promise`\<`EncodeObject`\>

***

### createDrive()

> **createDrive**(`metadata`, `encryption?`): `Promise`\<`EncodeObject`\>

Defined in: [src/filetree-helper.ts:56](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L56)

Create a top-level drive node for the active account.

#### Parameters

##### metadata

[`IAtlasDriveInfo`](../interfaces/IAtlasDriveInfo.md)

##### encryption?

`EncryptionType` = `EncryptionType.ENCRYPTED`

#### Returns

`Promise`\<`EncodeObject`\>

***

### createFile()

> **createFile**(`file`, `dir`): `Promise`\<`EncodeObject`\>

Defined in: [src/filetree-helper.ts:87](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L87)

#### Parameters

##### file

[`IQueuedFile`](../interfaces/IQueuedFile.md)

##### dir

`string`

#### Returns

`Promise`\<`EncodeObject`\>

***

### extractAesKey()

> **extractAesKey**(`permissions`): `Promise`\<`IAesBundle`\>

Defined in: [src/filetree-helper.ts:153](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L153)

Decrypt the AES bundle granted to the connected wallet.

#### Parameters

##### permissions

`string`

#### Returns

`Promise`\<`IAesBundle`\>

***

### getTreeNode()

> **getTreeNode**(`path`, `owner?`): `Promise`\<[`TreeNode`](../type-aliases/TreeNode.md)\>

Defined in: [src/filetree-helper.ts:40](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L40)

#### Parameters

##### path

`string`

##### owner?

`string` = `...`

#### Returns

`Promise`\<[`TreeNode`](../type-aliases/TreeNode.md)\>

***

### getTreeNodeChildren()

> **getTreeNodeChildren**(`path`, `owner?`): `Promise`\<[`TreeNode`](../type-aliases/TreeNode.md)[]\>

Defined in: [src/filetree-helper.ts:25](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L25)

#### Parameters

##### path

`string`

##### owner?

`string` = `...`

#### Returns

`Promise`\<[`TreeNode`](../type-aliases/TreeNode.md)[]\>

***

### incrementDirectoryItemCount()

> **incrementDirectoryItemCount**(`path`, `delta`): `Promise`\<`EncodeObject`\>

Defined in: [src/filetree-helper.ts:114](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L114)

Build a replacement directory node with an adjusted child item count.

#### Parameters

##### path

`string`

##### delta

`number`

#### Returns

`Promise`\<`EncodeObject`\>

***

### setAccessKey()

> **setAccessKey**(`accessKey`): `Promise`\<`void`\>

Defined in: [src/filetree-helper.ts:20](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/filetree-helper.ts#L20)

#### Parameters

##### accessKey

`PrivateKey`

#### Returns

`Promise`\<`void`\>

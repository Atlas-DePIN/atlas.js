[**atlas.js v0.1.0**](../README.md)

***

[atlas.js](../README.md) / FiletreeHelper

# Class: FiletreeHelper

Defined in: [src/filetree-helper.ts:12](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L12)

## Constructors

### Constructor

> **new FiletreeHelper**(`client`): `FiletreeHelper`

Defined in: [src/filetree-helper.ts:16](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L16)

#### Parameters

##### client

[`AtlasClient`](AtlasClient.md)

#### Returns

`FiletreeHelper`

## Properties

### accessKey?

> `protected` `optional` **accessKey?**: `PrivateKey`

Defined in: [src/filetree-helper.ts:14](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L14)

***

### client

> `protected` **client**: [`AtlasClient`](AtlasClient.md)

Defined in: [src/filetree-helper.ts:13](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L13)

## Methods

### createDirectory()

> **createDirectory**(): `Promise`\<`EncodeObject`\>

Defined in: [src/filetree-helper.ts:105](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L105)

#### Returns

`Promise`\<`EncodeObject`\>

***

### createDrive()

> **createDrive**(`metadata`, `encryption?`): `Promise`\<`EncodeObject`\>

Defined in: [src/filetree-helper.ts:55](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L55)

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

Defined in: [src/filetree-helper.ts:86](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L86)

#### Parameters

##### file

[`IQueuedFile`](../interfaces/IQueuedFile.md)

##### dir

`string`

#### Returns

`Promise`\<`EncodeObject`\>

***

### getTreeNode()

> **getTreeNode**(`path`, `owner?`): `Promise`\<[`TreeNode`](../type-aliases/TreeNode.md)\>

Defined in: [src/filetree-helper.ts:39](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L39)

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

Defined in: [src/filetree-helper.ts:24](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L24)

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

Defined in: [src/filetree-helper.ts:112](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L112)

Build a replacement directory node with an adjusted child item count.

#### Parameters

##### path

`string`

##### delta

`number`

#### Returns

`Promise`\<`EncodeObject`\>

***

### useAccessKey()

> **useAccessKey**(`accessKey`): `Promise`\<`void`\>

Defined in: [src/filetree-helper.ts:20](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/filetree-helper.ts#L20)

#### Parameters

##### accessKey

`PrivateKey`

#### Returns

`Promise`\<`void`\>

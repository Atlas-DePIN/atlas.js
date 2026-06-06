[**atlas.js v0.1.0**](../README.md)

***

[atlas.js](../README.md) / IQueryHelper

# Interface: IQueryHelper

Defined in: [src/interfaces/classes/IQueryHelper.ts:7](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L7)

## Methods

### file()

> **file**(`fid`): `Promise`\<`File`\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:11](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L11)

#### Parameters

##### fid

`string`

#### Returns

`Promise`\<`File`\>

***

### fileStats()

> **fileStats**(): `Promise`\<`QueryFileStatsResponse`\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:8](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L8)

#### Returns

`Promise`\<`QueryFileStatsResponse`\>

***

### provider()

> **provider**(`address`): `Promise`\<`Provider`\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:14](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L14)

#### Parameters

##### address

`string`

#### Returns

`Promise`\<`Provider`\>

***

### providers()

> **providers**(): `Promise`\<`Provider`[]\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:15](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L15)

#### Returns

`Promise`\<`Provider`[]\>

***

### storageStats()

> **storageStats**(): `Promise`\<`QueryStorageStatsResponse`\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:9](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L9)

#### Returns

`Promise`\<`QueryStorageStatsResponse`\>

***

### subscription()

> **subscription**(`address`, `id?`): `Promise`\<`StorageSubscription`\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:13](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L13)

#### Parameters

##### address

`string`

##### id?

`string`

#### Returns

`Promise`\<`StorageSubscription`\>

***

### subscriptions()

> **subscriptions**(`address`): `Promise`\<`StorageSubscription`[]\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:12](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L12)

#### Parameters

##### address

`string`

#### Returns

`Promise`\<`StorageSubscription`[]\>

***

### treeNode()

> **treeNode**(`path`, `subscription`, `owner`): `Promise`\<`TreeNode`\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:17](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L17)

#### Parameters

##### path

`string`

##### subscription

`string`

##### owner

`string`

#### Returns

`Promise`\<`TreeNode`\>

***

### treeNodeChildren()

> **treeNodeChildren**(`path`, `subscription`, `owner`): `Promise`\<`TreeNode`[]\>

Defined in: [src/interfaces/classes/IQueryHelper.ts:18](https://github.com/Atlas-DePIN/atlas.js/blob/d9ab24d6c846520a1837b7c412e4bbae28996536/src/interfaces/classes/IQueryHelper.ts#L18)

#### Parameters

##### path

`string`

##### subscription

`string`

##### owner

`string`

#### Returns

`Promise`\<`TreeNode`[]\>

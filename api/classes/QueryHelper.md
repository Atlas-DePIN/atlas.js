[**atlas.js v0.2.0**](../README.md)

***

[atlas.js](../README.md) / QueryHelper

# Class: QueryHelper

Defined in: [src/query-helper.ts:11](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L11)

## Implements

- [`IQueryHelper`](../interfaces/IQueryHelper.md)

## Constructors

### Constructor

> **new QueryHelper**(`client`): `QueryHelper`

Defined in: [src/query-helper.ts:14](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L14)

#### Parameters

##### client

[`QueryClient`](../interfaces/QueryClient.md)

#### Returns

`QueryHelper`

## Properties

### client

> `protected` **client**: [`QueryClient`](../interfaces/QueryClient.md)

Defined in: [src/query-helper.ts:12](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L12)

## Methods

### file()

> **file**(`fid`): `Promise`\<`File`\>

Defined in: [src/query-helper.ts:24](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L24)

#### Parameters

##### fid

`string`

#### Returns

`Promise`\<`File`\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`file`](../interfaces/IQueryHelper.md#file)

***

### fileStats()

> **fileStats**(): `Promise`\<`QueryFileStatsResponse`\>

Defined in: [src/query-helper.ts:18](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L18)

#### Returns

`Promise`\<`QueryFileStatsResponse`\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`fileStats`](../interfaces/IQueryHelper.md#filestats)

***

### provider()

> **provider**(`address`): `Promise`\<`Provider`\>

Defined in: [src/query-helper.ts:30](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L30)

#### Parameters

##### address

`string`

#### Returns

`Promise`\<`Provider`\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`provider`](../interfaces/IQueryHelper.md#provider)

***

### providers()

> **providers**(): `Promise`\<`Provider`[]\>

Defined in: [src/query-helper.ts:33](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L33)

#### Returns

`Promise`\<`Provider`[]\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`providers`](../interfaces/IQueryHelper.md#providers)

***

### storageStats()

> **storageStats**(): `Promise`\<`QueryStorageStatsResponse`\>

Defined in: [src/query-helper.ts:21](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L21)

#### Returns

`Promise`\<`QueryStorageStatsResponse`\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`storageStats`](../interfaces/IQueryHelper.md#storagestats)

***

### subscription()

> **subscription**(`address`, `id?`): `Promise`\<`StorageSubscription`\>

Defined in: [src/query-helper.ts:43](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L43)

#### Parameters

##### address

`string`

##### id?

`string` = `""`

#### Returns

`Promise`\<`StorageSubscription`\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`subscription`](../interfaces/IQueryHelper.md#subscription)

***

### subscriptions()

> **subscriptions**(`address`): `Promise`\<`StorageSubscription`[]\>

Defined in: [src/query-helper.ts:27](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L27)

#### Parameters

##### address

`string`

#### Returns

`Promise`\<`StorageSubscription`[]\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`subscriptions`](../interfaces/IQueryHelper.md#subscriptions)

***

### treeNode()

> **treeNode**(`owner`, `path`): `Promise`\<`TreeNode`\>

Defined in: [src/query-helper.ts:36](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L36)

#### Parameters

##### owner

`string`

##### path

`string`

#### Returns

`Promise`\<`TreeNode`\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`treeNode`](../interfaces/IQueryHelper.md#treenode)

***

### treeNodeChildren()

> **treeNodeChildren**(`owner`, `path`): `Promise`\<`TreeNode`[]\>

Defined in: [src/query-helper.ts:39](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/query-helper.ts#L39)

#### Parameters

##### owner

`string`

##### path

`string`

#### Returns

`Promise`\<`TreeNode`[]\>

#### Implementation of

[`IQueryHelper`](../interfaces/IQueryHelper.md).[`treeNodeChildren`](../interfaces/IQueryHelper.md#treenodechildren)

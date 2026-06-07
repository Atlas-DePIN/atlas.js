[**atlas.js v0.2.0**](../README.md)

***

[atlas.js](../README.md) / IAtlasClient

# Interface: IAtlasClient

Defined in: [src/interfaces/classes/IAtlasClient.ts:4](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L4)

## Accessors

### address

#### Get Signature

> **get** **address**(): `string`

Defined in: [src/interfaces/classes/IAtlasClient.ts:6](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L6)

##### Returns

`string`

***

### query

#### Get Signature

> **get** **query**(): [`QueryHelper`](../classes/QueryHelper.md)

Defined in: [src/interfaces/classes/IAtlasClient.ts:5](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L5)

##### Returns

[`QueryHelper`](../classes/QueryHelper.md)

## Methods

### connectWallet()

> **connectWallet**(`type`, `options?`): `Promise`\<`void`\>

Defined in: [src/interfaces/classes/IAtlasClient.ts:11](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L11)

#### Parameters

##### type

[`WalletType`](../enumerations/WalletType.md)

##### options?

`any`

#### Returns

`Promise`\<`void`\>

***

### disconnectWallet()

> **disconnectWallet**(): `Promise`\<`void`\>

Defined in: [src/interfaces/classes/IAtlasClient.ts:12](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L12)

#### Returns

`Promise`\<`void`\>

***

### getWalletType()

> **getWalletType**(): [`WalletType`](../enumerations/WalletType.md)

Defined in: [src/interfaces/classes/IAtlasClient.ts:13](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L13)

#### Returns

[`WalletType`](../enumerations/WalletType.md)

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [src/interfaces/classes/IAtlasClient.ts:8](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L8)

#### Returns

`Promise`\<`void`\>

***

### isWalletConnected()

> **isWalletConnected**(): `boolean`

Defined in: [src/interfaces/classes/IAtlasClient.ts:10](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/interfaces/classes/IAtlasClient.ts#L10)

#### Returns

`boolean`

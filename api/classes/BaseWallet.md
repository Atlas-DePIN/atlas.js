[**atlas.js v0.2.0**](../README.md)

***

[atlas.js](../README.md) / BaseWallet

# Abstract Class: BaseWallet

Defined in: [src/wallets/base-wallet.ts:23](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L23)

Abstract base class for wallet implementations.

Manages the lifecycle of a Cosmos-compatible wallet connection: connecting
to an RPC endpoint, initialising query and signing clients, and providing
transaction signing, simulation, and balance-querying primitives.

Subclasses must implement [connect](#connect), [disconnect](#disconnect),
[getWalletType](#getwallettype), and [signArbitrary](#signarbitrary).

## Constructors

### Constructor

> **new BaseWallet**(`config`): `BaseWallet`

Defined in: [src/wallets/base-wallet.ts:45](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L45)

#### Parameters

##### config

[`AtlasConfig`](../interfaces/AtlasConfig.md)

Configuration object containing endpoint, gas price,
                and any subclass-specific options.

#### Returns

`BaseWallet`

## Properties

### \_address

> `protected` **\_address**: `string` = `""`

Defined in: [src/wallets/base-wallet.ts:28](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L28)

Active wallet address

***

### config

> `protected` **config**: [`AtlasConfig`](../interfaces/AtlasConfig.md)

Defined in: [src/wallets/base-wallet.ts:25](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L25)

Wallet-level configuration (RPC endpoint, gas price, etc.).

***

### queryClient

> `protected` **queryClient**: `StargateClient` = `null`

Defined in: [src/wallets/base-wallet.ts:34](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L34)

Read-only Stargate client for queries (balance, account info).

***

### signingClient

> `protected` **signingClient**: `SigningStargateClient` = `null`

Defined in: [src/wallets/base-wallet.ts:37](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L37)

Signing Stargate client for broadcasting transactions.

## Accessors

### address

#### Get Signature

> **get** **address**(): `string`

Defined in: [src/wallets/base-wallet.ts:29](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L29)

##### Returns

`string`

## Methods

### connect()

> `abstract` **connect**(): `Promise`\<`void`\>

Defined in: [src/wallets/base-wallet.ts:56](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L56)

Establish a wallet connection.

Subclasses should initialize the signer, connect to the RPC endpoint
(via [initializeClients](#initializeclients)), and return the resulting connection
metadata.

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> `abstract` **disconnect**(): `Promise`\<`void`\>

Defined in: [src/wallets/base-wallet.ts:59](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L59)

Tear down the wallet connection and release any held resources.

#### Returns

`Promise`\<`void`\>

***

### getAccountBalance()

> **getAccountBalance**(): `Promise`\<readonly `Coin`[]\>

Defined in: [src/wallets/base-wallet.ts:110](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L110)

Fetch all non-zero balance coins for the connected wallet address.

#### Returns

`Promise`\<readonly `Coin`[]\>

#### Throws

If the wallet is not connected.

***

### getAccountInfo()

> **getAccountInfo**(): `Promise`\<`Account`\>

Defined in: [src/wallets/base-wallet.ts:100](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L100)

Fetch the on-chain account information for the connected wallet address.

#### Returns

`Promise`\<`Account`\>

#### Throws

If the wallet is not connected.

***

### getQueryClient()

> **getQueryClient**(): `StargateClient`

Defined in: [src/wallets/base-wallet.ts:91](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L91)

Return the active query client, or `null` if not connected.

#### Returns

`StargateClient`

***

### getSigningClient()

> **getSigningClient**(): `SigningStargateClient`

Defined in: [src/wallets/base-wallet.ts:84](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L84)

Return the active signing client, or `null` if not connected.

#### Returns

`SigningStargateClient`

***

### getWalletType()

> `abstract` **getWalletType**(): [`WalletType`](../enumerations/WalletType.md)

Defined in: [src/wallets/base-wallet.ts:62](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L62)

Return the concrete wallet type for this implementation.

#### Returns

[`WalletType`](../enumerations/WalletType.md)

***

### initializeClients()

> `protected` **initializeClients**(`offlineSigner`, `address`): `Promise`\<`void`\>

Defined in: [src/wallets/base-wallet.ts:188](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L188)

Initialize the query and signing Stargate clients.

Connects a read-only `StargateClient` to the configured RPC endpoint,
then creates a `SigningStargateClient` using the provided offline
signer. The Atlas protobuf type registry (from `GlobalDecoderRegistry`)
is registered so that the signing client can encode/decode custom
message types.

#### Parameters

##### offlineSigner

`OfflineSigner`

The offline signer (Amino-compatible) to attach.

##### address

`string`

The on-chain address corresponding to the signer.

#### Returns

`Promise`\<`void`\>

#### Throws

If either client fails to initialize.

***

### isConnected()

> **isConnected**(): `boolean`

Defined in: [src/wallets/base-wallet.ts:77](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L77)

Check whether the wallet is currently connected and ready for use.

Returns `true` when a `wallet` handle, `signingClient`, and `queryClient` 
are all not null.

#### Returns

`boolean`

***

### refreshClients()

> **refreshClients**(): `Promise`\<`void`\>

Defined in: [src/wallets/base-wallet.ts:226](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L226)

Re-initialize the query and signing clients using the existing
wallet connection.

Useful after a network interruption or endpoint rotation.

#### Returns

`Promise`\<`void`\>

#### Throws

If no wallet connection has been established.

***

### signAndBroadcastTransaction()

> **signAndBroadcastTransaction**(`txBody`, `options?`): `Promise`\<`DeliverTxResponse`\>

Defined in: [src/wallets/base-wallet.ts:131](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L131)

Sign and broadcast a transaction constructed from a `TxBody`.

Fee resolution order:
1. `options.fee` if explicitly provided.
2. Auto-calculated from `options.gas` + `config.gasPrice` if both are
   finite.
3. Fall back to `options.gasAdjustment` or `config.gasAdjustment`, or
   the literal string `'auto'` as a last resort.

#### Parameters

##### txBody

`TxBody`

The transaction body containing messages.

##### options?

[`TxOptions`](../interfaces/TxOptions.md)

Optional overrides for gas, fee, memo, and gas adjustment.

#### Returns

`Promise`\<`DeliverTxResponse`\>

The on-chain delivery response after broadcast.

#### Throws

If the wallet is not connected or the transaction fails.

***

### signArbitrary()

> `abstract` **signArbitrary**(`data`): `Promise`\<`string`\>

Defined in: [src/wallets/base-wallet.ts:69](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L69)

Sign an arbitrary piece of data (string or bytes) using the wallet's key.

#### Parameters

##### data

`string` \| `Uint8Array`\<`ArrayBufferLike`\>

The data to sign, as a string or `Uint8Array`.

#### Returns

`Promise`\<`string`\>

***

### simulateTransaction()

> **simulateTransaction**(`messages`, `options?`): `Promise`\<`number`\>

Defined in: [src/wallets/base-wallet.ts:168](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/wallets/base-wallet.ts#L168)

Simulate a transaction without broadcasting it.

Uses the signing client's `simulate` method to dry-run the given
messages and return the estimated gas units.

#### Parameters

##### messages

`any`[]

The array of protobuf messages to simulate.

##### options?

[`TxOptions`](../interfaces/TxOptions.md)

Optional overrides (currently only `memo` is used).

#### Returns

`Promise`\<`number`\>

The estimated gas cost in gas units.

#### Throws

If the wallet is not connected.

[**atlas.js v0.2.0**](../README.md)

***

[atlas.js](../README.md) / UploadHelper

# Class: UploadHelper

Defined in: [src/upload-helper.ts:9](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/upload-helper.ts#L9)

## Constructors

### Constructor

> **new UploadHelper**(): `UploadHelper`

#### Returns

`UploadHelper`

## Methods

### upload()

> `static` **upload**(`hostname`, `fileId`, `file`, `onProgress?`): `Promise`\<`UploadResult`\>

Defined in: [src/upload-helper.ts:16](https://github.com/Atlas-DePIN/atlas.js/blob/69650d8e09f33d42ed4e3b3886bc77ab85f5ade6/src/upload-helper.ts#L16)

Upload a file to a storage provider.

Retries are handled by the caller (StorageHandler) across providers;
this method attempts the upload exactly once.

#### Parameters

##### hostname

`string`

##### fileId

`string`

##### file

`File`

##### onProgress?

(`progress`) => `void`

#### Returns

`Promise`\<`UploadResult`\>

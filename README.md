# atlas.js

TypeScript SDK for interacting with the Atlas Protocol blockchain.

## Installation

```bash
npm install atlas.js
```

## Quick start

```ts
import { AtlasClient, WalletType } from 'atlas.js';

const client = await AtlasClient.new({
  chainId: 'atlas-1',
  rpcEndpoint: 'https://rpc.atlasprotocol.cloud',
});

await client.connectWallet(WalletType.KEPLR);

const stats = await client.query.storageStats();
console.log(stats);
```

## Overview

| Class | Purpose |
|---|---|
| `AtlasClient` | High-level client: wallet lifecycle, queries, signing, broadcasting |
| `StorageManager` | Full storage lifecycle: subscriptions, drives, directory tree, queue-based uploads with encryption, downloads |
| `StorageHandler` | Lightweight storage operations: direct upload/download/delete without filetree or queue state |
| `QueryHelper` | Typed read-only queries, accessible via `client.query` |
| `FiletreeHelper` | File tree node CRUD and access control |

## Documentation

- [atlas.js docs] https://docs.atlasprotocol.cloud/docs/atlas-js/intro
- [SDK reference] https://docs.atlasprotocol.cloud/docs/api

## License

MIT

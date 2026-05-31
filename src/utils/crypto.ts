import { decrypt, encrypt, PrivateKey } from 'eciesjs'

import { IAesBundle, IEncryptionOptions } from "@/interfaces"
import { keyAlgo } from "./constants"
import { hexToBytes, bytesToHex } from './converters'
import { DEFAULT_ENCYRPTION_CHUNK_SIZE } from './defaults';
import { CancellationException } from '@/types/errors';

export async function aesStringCrypt(
  data: string,
  aes: IAesBundle,
  mode: 'encrypt' | 'decrypt',
): Promise<string> {
  if (mode === 'encrypt') {
    const encoded = new TextEncoder().encode(data);
    const result = await aesCrypt(encoded.buffer, aes, 'encrypt');
    return bytesToHex(new Uint8Array(result));
  } else {
    const result = await aesCrypt(hexToBytes(data).buffer as ArrayBuffer, aes, 'decrypt');
    return new TextDecoder().decode(result);
  }
}

export async function aesBlobCrypt(
  data: Blob,
  aes: IAesBundle,
  mode: 'encrypt' | 'decrypt',
): Promise<Blob> {
  try {
    const workingData = await data.arrayBuffer()
    const result = await aesCrypt(workingData, aes, mode)
    return new Blob([result])
  } catch (err) {
    throw err
  }
}

export async function aesCrypt(
  data: ArrayBuffer,
  aes: IAesBundle,
  mode: 'encrypt' | 'decrypt',
): Promise<ArrayBuffer> {
  try {
    const algo = {
      name: 'AES-GCM',
      iv: aes.iv,
    }
    if (data.byteLength < 1) {
      return new ArrayBuffer(0)
    } else if (mode?.toLowerCase() === 'encrypt') {
      try {
        return await crypto.subtle.encrypt(algo, aes.key, data)
      } catch (err) {
        console.warn('encrypt')
        throw err
      }
    } else {
      try {
        return await crypto.subtle.decrypt(algo, aes.key, data)
      } catch (err) {
        console.warn('decrypt')
        throw err
      }
    }
  } catch (err) {
    throw err
  }
}

export async function generateAesKey(): Promise<IAesBundle> {
  return { key: await genKey(), iv: genIv() }
}

function genKey (): Promise<CryptoKey> {
  try {
    return crypto.subtle.generateKey(keyAlgo, true, ['encrypt', 'decrypt'])
  } catch (err) {
    throw err
  }
}

function genIv (): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

export async function exportAesBundle(eciesKey: string, aes: IAesBundle): Promise<string> {
  const key = new Uint8Array(await crypto.subtle.exportKey('raw', aes.key))
  const keyString = eciesEncrypt(eciesKey, key)
  const ivString = eciesEncrypt(eciesKey, aes.iv)
  return `${ivString}|${keyString}`
}

export async function importAesBundle(eciesKey: PrivateKey, aes: string): Promise<IAesBundle> {
  try {
    if (aes.indexOf('|') < 0) {
      throw new Error('Invalid source string')
    }
    const [iv_enc, key_enc] = aes.split('|').map(e => hexToBytes(e))
    const iv = new Uint8Array(decrypt(eciesKey.toHex(), iv_enc))
    const key_raw = new Uint8Array(decrypt(eciesKey.toHex(), key_enc))

    const key = await crypto.subtle.importKey('raw', key_raw, 'AES-GCM', true, [
      'encrypt',
      'decrypt',
    ])

    return {
      iv, key
    }
  } catch (err) {
    throw err
  }
}

export async function encryptFile(file: File, opts: IEncryptionOptions, onProgress?: (progress: number) => void): Promise<File> {
  if (!opts.aes) throw new Error('AES key and iv are required in the encryption options.');
  
  const chunkSize = opts.chunkSize ?? DEFAULT_ENCYRPTION_CHUNK_SIZE;
  const encryptedBytes: Blob[] = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    const blobChunk = file.slice(i, i + chunkSize);
    encryptedBytes.push(
      new Blob([(blobChunk.size + 16).toString().padStart(8, '0')]),
      await aesBlobCrypt(blobChunk, opts.aes, 'encrypt'),
    );

    const bytesProcessed = Math.min(file.size, i + blobChunk.size);
    onProgress?.((bytesProcessed / file.size) * 100);
  }

  return new File(encryptedBytes, file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

export async function decryptFile(file: File, fileName: string, fileMeta: FilePropertyBag, aes: IAesBundle): Promise<File> {
  const parts: Blob[] = [];
  for (let cursor = 0; cursor < file.size;) {
    const headerEnd = cursor + 8;
    const segmentSize = Number(await file.slice(cursor, headerEnd).text());
    if (!Number.isFinite(segmentSize) || segmentSize < 1) {
      throw new Error('Encrypted file is malformed.');
    }

    const segmentEnd = headerEnd + segmentSize;
    parts.push(await aesBlobCrypt(file.slice(headerEnd, segmentEnd), aes, 'decrypt'));
    cursor = segmentEnd;
  }

  return new File(parts, fileName, fileMeta);
}

export function eciesEncrypt(key: string, content: Uint8Array): string {
  return encrypt(key, content).toHex().toString()
  // Dev Note: toHex only exists on Uint8Array in NodeJS 22+/modern browser versions
}

export function eciesDecrypt(key: PrivateKey, content: string): Uint8Array {
  return new Uint8Array(decrypt(key.toHex(), hexToBytes(content)))
}
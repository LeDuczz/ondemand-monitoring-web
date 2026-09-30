// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { transferPcBackup, verifyPcBackup } from './pcMediaTransfer'

function fixture(bytes: Uint8Array) {
  return {
    size: bytes.length, type: 'image/jpeg',
    slice: (start: number, end: number) => ({ arrayBuffer: async () => bytes.slice(start, end).buffer }),
  } as unknown as File
}
const bytes = new Uint8Array([255, 216, 255, 1])
const original = { fileSize: bytes.length, contentType: 'image/jpeg', checksumSha256: bytesToHex(sha256(bytes)) }
afterEach(() => vi.unstubAllGlobals())

describe('exact PC backup transfer', () => {
  it('accepts an exact copy and rejects different bytes', async () => {
    await expect(verifyPcBackup(fixture(bytes), original)).resolves.toBe(original.checksumSha256)
    await expect(verifyPcBackup(fixture(new Uint8Array([255, 216, 255, 2])), original)).rejects.toThrow('SHA-256')
  })
  it('rejects different size before hashing', async () => {
    await expect(verifyPcBackup(fixture(new Uint8Array([1])), original)).rejects.toThrow('kích thước')
  })
  it('uploads PUT without browser-forbidden headers or auth cookies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const signPart = vi.fn()
    await transferPcBackup(fixture(bytes), { uploadMethod: 'PUT', uploadUrl: 'https://s3.test/upload',
      uploadHeaders: { Host: ['s3.test'], 'Content-Length': ['4'], 'Content-Type': ['image/jpeg'],
        'x-amz-meta-sha256': [original.checksumSha256] }, partSizeBytes: 0, partCount: 0 }, signPart)
    const options = fetchMock.mock.calls[0][1]
    expect(options.credentials).toBe('omit')
    expect(options.headers.has('Host')).toBe(false)
    expect(options.headers.has('Content-Length')).toBe(false)
    expect(options.headers.get('x-amz-meta-sha256')).toBe(original.checksumSha256)
    expect(signPart).not.toHaveBeenCalled()
  })
  it('signs multipart just in time and collects ETags', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { headers: { ETag: '"part"' } })))
    const signPart = vi.fn().mockResolvedValue({ uploadUrl: 'https://s3.test/part', uploadHeaders: {} })
    const result = await transferPcBackup(fixture(bytes), { uploadMethod: 'MULTIPART', uploadUrl: null,
      uploadHeaders: {}, partSizeBytes: 2, partCount: 2 }, signPart)
    expect(signPart.mock.calls).toEqual([[1], [2]])
    expect(result).toEqual([{ partNumber: 1, eTag: '"part"' }, { partNumber: 2, eTag: '"part"' }])
  })
  it('rejects multipart without an exposed ETag', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null)))
    await expect(transferPcBackup(fixture(bytes), { uploadMethod: 'MULTIPART', uploadUrl: null,
      uploadHeaders: {}, partSizeBytes: 4, partCount: 1 }, async () => ({ uploadUrl: 'https://s3.test', uploadHeaders: {} })))
      .rejects.toThrow('CORS')
  })
})

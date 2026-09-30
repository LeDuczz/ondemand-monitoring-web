import { describe, expect, it } from 'vitest'

import { createCollection, resetMockDb } from './db'

describe('createCollection / resetMockDb', () => {
  it('deep-clones the seed so mutating the collection does not touch it', () => {
    const seed = { orders: [{ id: '1', status: 'PENDING' }] }
    const collection = createCollection(seed)

    collection.orders[0].status = 'APPROVED'

    expect(seed.orders[0].status).toBe('PENDING')
    expect(collection.orders[0].status).toBe('APPROVED')
  })

  it('restores array collections to their seed on resetMockDb()', () => {
    const seed = [{ id: '1' }, { id: '2' }]
    const collection = createCollection(seed)

    collection.push({ id: '3' })
    collection[0].id = 'mutated'
    expect(collection).toHaveLength(3)

    resetMockDb()

    expect(collection).toEqual([{ id: '1' }, { id: '2' }])
  })

  it('restores object collections to their seed on resetMockDb()', () => {
    const seed = { count: 1, nested: { flag: false } }
    const collection = createCollection(seed)

    collection.count = 99
    collection.nested.flag = true

    resetMockDb()

    expect(collection).toEqual({ count: 1, nested: { flag: false } })
  })

  it('keeps the same object/array identity across a reset', () => {
    const collection = createCollection([{ id: '1' }])
    const originalRef = collection

    collection.push({ id: '2' })
    resetMockDb()

    expect(collection).toBe(originalRef)
  })
})

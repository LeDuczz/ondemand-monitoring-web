// Tiny in-memory store for mock route handlers. Each handler module seeds a
// collection once at import time; `resetMockDb()` restores every registered
// collection back to its seed, so tests can run in isolation.

type RegisteredCollection = {
  restore: () => void
}

const registry: RegisteredCollection[] = []

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Deep-clones `seed` into a fresh, mutable value and registers it so
 * `resetMockDb()` can restore its contents in place later. The returned
 * value keeps the same object/array identity for the lifetime of the
 * process — handlers can hold onto it and mutate it directly (push, splice,
 * assign properties, etc).
 */
export function createCollection<T extends object>(seed: T): T {
  const cloneSeed = () => deepClone(seed)
  const data = cloneSeed()

  registry.push({
    restore: () => {
      const fresh = cloneSeed()
      if (Array.isArray(data) && Array.isArray(fresh)) {
        data.length = 0
        data.push(...fresh)
        return
      }
      for (const key of Object.keys(data)) {
        delete (data as Record<string, unknown>)[key]
      }
      Object.assign(data, fresh)
    },
  })

  return data
}

/** Restores every collection created with `createCollection` to its seed. */
export function resetMockDb() {
  for (const collection of registry) collection.restore()
}

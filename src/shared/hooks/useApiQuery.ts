import { useCallback, useEffect, useRef, useState } from 'react'

export type UseApiQueryState<T> = {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

/**
 * Runs `fn(signal)` whenever `deps` change, exposing loading/data/error plus
 * a manual `reload()`. Requests are aborted on unmount / dep change (via the
 * `AbortSignal` passed to `fn`), and a stale-guard drops responses that
 * resolve after a newer request has started.
 */
export function useApiQuery<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): UseApiQueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    const id = ++requestId.current
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)

    fnRef
      .current(controller.signal)
      .then((result) => {
        if (requestId.current !== id) return
        setData(result)
        setError(undefined)
      })
      .catch((err: unknown) => {
        if (requestId.current !== id) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err)
      })
      .finally(() => {
        if (requestId.current !== id) return
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
    // deps is caller-controlled (mirrors useEffect's own contract); this
    // hook intentionally re-runs whenever any of its entries change.
  }, [...deps, reloadToken])

  return { data, error, loading, reload }
}

import { useMemo, useState } from 'react'

import type {
  PostflightItem,
  PostflightItemKey,
  PreflightItemResult,
} from '../../types/mission'
import { ALL_KEYS, type ResultsState } from './postflightHelpers'

/** Per-item PASS/FAIL assessment state and its derived values. */
export function usePostflightAssessment() {
  const [results, setResults] = useState<ResultsState>({})

  const items: PostflightItem[] = useMemo(
    () =>
      ALL_KEYS.filter((k) => results[k]).map((k) => ({
        key: k,
        result: results[k] as PreflightItemResult,
      })),
    [results],
  )
  const failItems = useMemo(
    () => ALL_KEYS.filter((k) => results[k] === 'fail'),
    [results],
  )
  const allAssessed = items.length === ALL_KEYS.length

  function handleSetResult(
    key: PostflightItemKey,
    result: PreflightItemResult,
  ) {
    setResults((prev) => ({ ...prev, [key]: result }))
  }

  function handlePassAll() {
    const next: ResultsState = {}
    for (const key of ALL_KEYS) {
      next[key] = 'ok'
    }
    setResults(next)
  }

  return {
    results,
    items,
    failItems,
    allAssessed,
    handleSetResult,
    handlePassAll,
  }
}

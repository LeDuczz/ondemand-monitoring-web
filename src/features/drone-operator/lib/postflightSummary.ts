import type { PostflightItem } from '../types/mission'

export type PostflightSummary = {
  nOk: number
  nTotal: number
  overallOk: boolean
  failKeys: string[]
}

/** Aggregates a postflight checklist into pass/fail counts. `overall_ok` is true
 * only when every seeded item is answered "ok" — used by both PostflightScreen
 * and the mock `/postflight` handler. */
export function postflightSummary(
  items: PostflightItem[],
  total: number,
): PostflightSummary {
  const nOk = items.filter((i) => i.result === 'ok').length
  const failKeys = items.filter((i) => i.result === 'fail').map((i) => i.key)
  return {
    nOk,
    nTotal: total,
    overallOk: items.length === total && failKeys.length === 0,
    failKeys,
  }
}

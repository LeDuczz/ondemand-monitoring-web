import type { PreflightItem } from '../types/mission'

export type PreflightSummary = {
  nOk: number
  nTotal: number
  nFail: number
  failKeys: string[]
  isPass: boolean
  isFail: boolean
  isProgress: boolean
}

/** Aggregates a preflight checklist into pass/fail/in-progress counts. Used by both
 * the PreflightScreen UI and the mock `/preflight` handler so the feasibility rule
 * (all 9 items OK => PASS, any FAIL => blocked) lives in one place. */
export function preflightSummary(
  items: PreflightItem[],
  total = 9,
): PreflightSummary {
  const nOk = items.filter((i) => i.result === 'ok').length
  const failKeys = items.filter((i) => i.result === 'fail').map((i) => i.key)
  const nFail = failKeys.length
  return {
    nOk,
    nTotal: total,
    nFail,
    failKeys,
    isPass: nOk === total,
    isFail: nFail > 0,
    isProgress: nFail === 0 && nOk < total,
  }
}

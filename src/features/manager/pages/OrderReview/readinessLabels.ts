import type { CriterionResult } from '../../types/readiness'

export type Answer = Exclude<CriterionResult, 'PENDING'>

export const answerOptions: Answer[] = ['PASS', 'FAIL']
export const riskLevelOptions: Answer[] = ['PASS', 'WARN', 'FAIL']

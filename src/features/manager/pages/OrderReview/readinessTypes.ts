import type { CriterionResult } from '../../types/readiness'

export type Answer = Exclude<CriterionResult, 'PENDING'>

export type FailureAction = 'NEED_INFO' | 'REJECTED'

import { ApiError } from '../../../shared/api/httpClient'
import { getLanguage } from '../../../shared/i18n'
import { planningErrorMessages } from './planningErrors.messages'

export function planningBlocker(code: string): string {
  const t = planningErrorMessages[getLanguage()]
  // The original ApiError and plan.blockers retain codes/IDs for diagnostics.
  // Unknown server text is not copied into the product UI.
  return t.advice[code.split(':', 1)[0]] ?? t.unknown
}

export function finalizeError(error: unknown): string {
  if (
    error instanceof ApiError &&
    [
      'EXECUTION_PLAN_REVISION_CONFLICT',
      'ORDER_NOT_APPROVED',
      'CHECKLIST_COVERAGE_INCOMPLETE',
    ].includes(error.code ?? '')
  )
    return planningBlocker(error.code!)
  return planningErrorMessages[getLanguage()].finalizeFailed
}

export function planningError(error: unknown): string {
  if (resourceAssignmentConflict(error))
    return planningBlocker('RESOURCE_TIME_CONFLICT')
  if (!(error instanceof ApiError))
    return planningErrorMessages[getLanguage()].offline
  return planningBlocker(error.code ?? '')
}

export function resourceAssignmentConflict(error: unknown): boolean {
  return (
    (error instanceof ApiError &&
      [
        'RESOURCE_TIME_CONFLICT',
        'RESOURCE_ALREADY_RESERVED',
        'SCHEDULE_CONFLICT',
      ].includes(error.code ?? '')) ||
    (error instanceof Error &&
      error.message === 'Resource is reserved during the requested interval')
  )
}

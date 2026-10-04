import { ApiError } from '../../../../shared/api/httpClient'
import { getLanguage } from '../../../../shared/i18n'
import { checklistMessages } from './messages'

export function isStaleChecklist(error: unknown) {
  return (
    error instanceof ApiError &&
    error.code === 'ORDER_CHECKLIST_TEMPLATE_CHANGED'
  )
}

export function checklistError(error: unknown, loading = false): string {
  const t = checklistMessages[getLanguage()]
  if (isStaleChecklist(error)) return t.stale
  if (error instanceof ApiError) {
    if (error.status === 401) return t.session
    if (error.status === 403) return t.forbidden
    if (error.status === 404) return t.missing
    if (error.code === 'SERVICE_INACTIVE') return t.inactive
    if (error.status === 400) return t.invalid
  }
  return loading ? t.loadFailed : t.failed
}

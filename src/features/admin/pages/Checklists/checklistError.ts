import { ApiError } from '../../../../shared/api/httpClient'
import { readApiError } from '../../lib/catalogMappers'

export function checklistError(
  error: unknown,
  text: {
    duplicate: string
    assignmentDuplicate: string
    stale: string
    error: string
  },
) {
  if (error instanceof ApiError) {
    if (error.code === 'CHECKLIST_ALREADY_EXISTS') return text.duplicate
    if (error.code === 'SERVICE_CHECKLIST_ALREADY_EXISTS')
      return text.assignmentDuplicate
    if (error.code === 'CONCURRENT_UPDATE') return text.stale
  }
  return readApiError(error, text.error).message
}

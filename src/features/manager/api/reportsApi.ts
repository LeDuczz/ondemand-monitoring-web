import { apiRequest } from '../../../shared/api/httpClient'
import type { ReportSummary } from '../types/reports'

export const reportsApi = {
  /** `GET /api/reports/summary` [TK MNG-12]. */
  getSummary(
    params?: { from?: string; to?: string },
    signal?: AbortSignal,
  ): Promise<ReportSummary> {
    const query: Record<string, string> = {}
    if (params?.from) query['from'] = params.from
    if (params?.to) query['to'] = params.to
    return apiRequest<ReportSummary>('/api/reports/summary', { query, signal })
  },
}

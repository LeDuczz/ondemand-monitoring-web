import { apiRequest } from '../../../shared/api/httpClient'

export const aiKnowledgeApi = {
  /** `POST /api/dev/ai/knowledge/index` [BE]. Index all knowledge. */
  indexKnowledge(): Promise<unknown> {
    return apiRequest<unknown>('/api/dev/ai/knowledge/index', { method: 'POST' })
  },
  /** `GET /api/dev/ai/knowledge/search` [BE]. Search knowledge. */
  searchKnowledge(query: string, signal?: AbortSignal): Promise<unknown> {
    return apiRequest<unknown>('/api/dev/ai/knowledge/search', {
      query: { q: query },
      signal,
    })
  },
}

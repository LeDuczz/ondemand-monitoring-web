import { apiRequest } from '../../../shared/api/httpClient'

export type ChecklistDefinition = {
  id: string
  content: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  version: number
}
export type ChecklistPage = {
  items: ChecklistDefinition[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}
export type ServiceChecklist = {
  id: string
  serviceId: string
  serviceName: string
  serviceActive: boolean
  checklistId: string
  content: string
  checklistActive: boolean
  displayOrder: number
  version: number
  checklistVersion: number
}
const enc = encodeURIComponent
const catalog = '/api/admin/checklists'
const template = (id: string) => `/api/admin/services/${enc(id)}/checklists`
export const checklistsApi = {
  list(
    search: string,
    active: boolean | undefined,
    page: number,
    signal?: AbortSignal,
  ) {
    return apiRequest<ChecklistPage>(catalog, {
      query: {
        search: search.trim() || undefined,
        active,
        page,
        size: 20,
        sort: 'createdAt,desc',
      },
      signal,
    })
  },
  create(content: string) {
    return apiRequest<ChecklistDefinition>(catalog, {
      method: 'POST',
      body: { content },
    })
  },
  update(id: string, content: string) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}`, {
      method: 'PUT',
      body: { content },
    })
  },
  status(id: string, active: boolean) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}/status`, {
      method: 'PATCH',
      body: { active },
    })
  },
  services(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceChecklist[]>(`${catalog}/${enc(id)}/services`, {
      signal,
    })
  },
  template(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceChecklist[]>(template(id), { signal })
  },
  assign(serviceId: string, checklistId: string, displayOrder: number) {
    return apiRequest<ServiceChecklist>(template(serviceId), {
      method: 'POST',
      body: { checklistId, displayOrder },
    })
  },
  remove(serviceId: string, checklistId: string) {
    return apiRequest<void>(`${template(serviceId)}/${enc(checklistId)}`, {
      method: 'DELETE',
    })
  },
  reorder(serviceId: string, rows: ServiceChecklist[]) {
    return apiRequest<ServiceChecklist[]>(`${template(serviceId)}/order`, {
      method: 'PUT',
      body: {
        items: rows.map((row) => ({
          checklistId: row.checklistId,
          expectedVersion: row.version,
        })),
      },
    })
  },
}

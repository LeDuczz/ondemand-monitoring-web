import { apiRequest } from '../../../shared/api/httpClient'
import type {
  AdminAccountDetail,
  AdminAccountItem,
  AdminDashboard,
  CreateAdminAccountPayload,
  UpdateAccountPayload,
} from '../types/accounts'

export const adminApi = {
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<AdminDashboard>('/api/admin/dashboard', { signal }),

  listAccounts: (params: { role?: string; status?: string; signal?: AbortSignal }) => {
    const qs = new URLSearchParams()
    if (params.role) qs.set('role', params.role)
    if (params.status) qs.set('status', params.status)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return apiRequest<{ items: AdminAccountItem[] }>(`/api/admin/accounts${query}`, {
      signal: params.signal,
    })
  },

  getAccount: (accountId: string, signal?: AbortSignal) =>
    apiRequest<AdminAccountDetail>(`/api/admin/accounts/${accountId}`, { signal }),

  createAccount: (payload: CreateAdminAccountPayload) =>
    apiRequest<AdminAccountDetail>('/api/admin/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAccount: (accountId: string, payload: UpdateAccountPayload) =>
    apiRequest<AdminAccountDetail>(`/api/admin/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deactivateAccount: (accountId: string) =>
    apiRequest<AdminAccountDetail>(`/api/admin/accounts/${accountId}/deactivate`, {
      method: 'POST',
    }),

  activateAccount: (accountId: string) =>
    apiRequest<AdminAccountDetail>(`/api/admin/accounts/${accountId}/activate`, {
      method: 'POST',
    }),
}

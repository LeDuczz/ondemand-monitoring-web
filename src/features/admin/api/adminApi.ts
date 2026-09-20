import { apiRequest } from '../../../shared/api/httpClient'
import type {
  AdminAccountDetail,
  AdminAccountItem,
  AdminDashboard,
  CreateAdminAccountPayload,
  UpdateAccountPayload,
} from '../types/accounts'
import type { AdminRole, CreateRolePayload, UpdateRolePayload } from '../types/roles'
import type {
  AdminService,
  AdminStation,
  CreateStationPayload,
  CreateTimeslotPayload,
  TimeslotVersion,
  UpdateServicePayload,
  UpdateStationPayload,
} from '../types/catalog'
import type {
  CreateNoFlyZonePayload,
  DispatchWeight,
  NoFlyZone,
  OperatingPolicy,
  UpdateNoFlyZonePayload,
  UpdatePolicyPayload,
  UpdateWeightsPayload,
} from '../types/operatingConfig'
import type {
  CreateDocPayload,
  FeasibilityRule,
  KnowledgeDoc,
  UpdateRulePayload,
} from '../types/aiKnowledge'
import type { AuditLogFilters, AuditLogPage } from '../types/auditLog'

export const adminApi = {
  // Dashboard
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<AdminDashboard>('/api/admin/dashboard', { signal }),

  // Accounts
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

  resetPassword: (accountId: string) =>
    apiRequest<{ sent: boolean; email: string }>(
      `/api/admin/accounts/${accountId}/reset-password`,
      { method: 'POST' },
    ),

  // Roles
  listRoles: (signal?: AbortSignal) =>
    apiRequest<{ items: AdminRole[] }>('/api/admin/roles', { signal }),

  createRole: (payload: CreateRolePayload) =>
    apiRequest<AdminRole>('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRole: (roleId: string, payload: UpdateRolePayload) =>
    apiRequest<AdminRole>(`/api/admin/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteRole: (roleId: string) =>
    apiRequest<{ deleted: boolean }>(`/api/admin/roles/${roleId}`, {
      method: 'DELETE',
    }),

  // Catalog — Services
  listServices: (signal?: AbortSignal) =>
    apiRequest<{ items: AdminService[] }>('/api/admin/catalog/services', { signal }),

  updateService: (serviceId: string, payload: UpdateServicePayload) =>
    apiRequest<AdminService>(`/api/admin/catalog/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Catalog — Timeslots
  listTimeslots: (signal?: AbortSignal) =>
    apiRequest<{ items: TimeslotVersion[] }>('/api/admin/catalog/timeslots', { signal }),

  createTimeslot: (payload: CreateTimeslotPayload) =>
    apiRequest<TimeslotVersion>('/api/admin/catalog/timeslots', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Catalog — Stations
  listStations: (signal?: AbortSignal) =>
    apiRequest<{ items: AdminStation[] }>('/api/admin/catalog/stations', { signal }),

  createStation: (payload: CreateStationPayload) =>
    apiRequest<AdminStation>('/api/admin/catalog/stations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStation: (stationId: string, payload: UpdateStationPayload) =>
    apiRequest<AdminStation>(`/api/admin/catalog/stations/${stationId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Operating Config — Policies
  listPolicies: (signal?: AbortSignal) =>
    apiRequest<{ items: OperatingPolicy[] }>('/api/admin/config/policies', { signal }),

  updatePolicy: (policyId: string, payload: UpdatePolicyPayload) =>
    apiRequest<OperatingPolicy>(`/api/admin/config/policies/${policyId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Operating Config — Dispatch Weights
  listWeights: (signal?: AbortSignal) =>
    apiRequest<{ items: DispatchWeight[] }>('/api/admin/config/weights', { signal }),

  updateWeights: (payload: UpdateWeightsPayload) =>
    apiRequest<{ items: DispatchWeight[] }>('/api/admin/config/weights', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Operating Config — No-fly Zones
  listNoFlyZones: (signal?: AbortSignal) =>
    apiRequest<{ items: NoFlyZone[] }>('/api/admin/config/no-fly-zones', { signal }),

  createNoFlyZone: (payload: CreateNoFlyZonePayload) =>
    apiRequest<NoFlyZone>('/api/admin/config/no-fly-zones', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateNoFlyZone: (zoneId: string, payload: UpdateNoFlyZonePayload) =>
    apiRequest<NoFlyZone>(`/api/admin/config/no-fly-zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // AI Knowledge — Docs
  listDocs: (signal?: AbortSignal) =>
    apiRequest<{ items: KnowledgeDoc[] }>('/api/admin/ai-knowledge/docs', { signal }),

  createDoc: (payload: CreateDocPayload) =>
    apiRequest<KnowledgeDoc>('/api/admin/ai-knowledge/docs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reindexDoc: (docId: string) =>
    apiRequest<KnowledgeDoc>(`/api/admin/ai-knowledge/docs/${docId}/reindex`, {
      method: 'POST',
    }),

  // AI Knowledge — Rules
  listRules: (signal?: AbortSignal) =>
    apiRequest<{ items: FeasibilityRule[] }>('/api/admin/ai-knowledge/rules', { signal }),

  updateRule: (ruleId: string, payload: UpdateRulePayload) =>
    apiRequest<FeasibilityRule>(`/api/admin/ai-knowledge/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Audit Log
  listAuditLog: (filters: AuditLogFilters = {}, signal?: AbortSignal) => {
    const qs = new URLSearchParams()
    if (filters.actorId) qs.set('actorId', filters.actorId)
    if (filters.action) qs.set('action', filters.action)
    if (filters.entityType) qs.set('entityType', filters.entityType)
    if (filters.from) qs.set('from', filters.from)
    if (filters.to) qs.set('to', filters.to)
    if (filters.page) qs.set('page', String(filters.page))
    if (filters.limit) qs.set('limit', String(filters.limit))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return apiRequest<AuditLogPage>(`/api/admin/audit-log${query}`, { signal })
  },
}

import { apiRequest } from '../../../shared/api/httpClient'
import type { AdminDashboard } from '../types/accounts'
import type {
  AdminStation,
  CreateStationPayload,
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
  AnalysisLog,
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
  // Account list/detail/create/status/update use `adminUsersApi` (real BE endpoints).
  // Catalog — Stations
  listStations: (signal?: AbortSignal) =>
    apiRequest<{ items: AdminStation[] }>('/api/admin/catalog/stations', {
      signal,
    }),

  createStation: (payload: CreateStationPayload) =>
    apiRequest<AdminStation>('/api/admin/catalog/stations', {
      method: 'POST',
      body: payload,
    }),

  updateStation: (stationId: string, payload: UpdateStationPayload) =>
    apiRequest<AdminStation>(`/api/admin/catalog/stations/${stationId}`, {
      method: 'PATCH',
      body: payload,
    }),

  toggleStationActive: (stationId: string, isActive: boolean) =>
    apiRequest<AdminStation>(`/api/admin/catalog/stations/${stationId}`, {
      method: 'PATCH',
      body: { isActive },
    }),

  // Operating Config — Policies
  listPolicies: (signal?: AbortSignal) =>
    apiRequest<{ items: OperatingPolicy[] }>('/api/admin/config/policies', {
      signal,
    }),

  updatePolicy: (policyId: string, payload: UpdatePolicyPayload) =>
    apiRequest<OperatingPolicy>(`/api/admin/config/policies/${policyId}`, {
      method: 'PATCH',
      body: payload,
    }),

  // Operating Config — Dispatch Weights
  listWeights: (signal?: AbortSignal) =>
    apiRequest<{ items: DispatchWeight[] }>('/api/admin/config/weights', {
      signal,
    }),

  updateWeights: (payload: UpdateWeightsPayload) =>
    apiRequest<{ items: DispatchWeight[] }>('/api/admin/config/weights', {
      method: 'PUT',
      body: payload,
    }),

  // Operating Config — No-fly Zones
  listNoFlyZones: (signal?: AbortSignal) =>
    apiRequest<{ items: NoFlyZone[] }>('/api/admin/config/no-fly-zones', {
      signal,
    }),

  createNoFlyZone: (payload: CreateNoFlyZonePayload) =>
    apiRequest<NoFlyZone>('/api/admin/config/no-fly-zones', {
      method: 'POST',
      body: payload,
    }),

  updateNoFlyZone: (zoneId: string, payload: UpdateNoFlyZonePayload) =>
    apiRequest<NoFlyZone>(`/api/admin/config/no-fly-zones/${zoneId}`, {
      method: 'PATCH',
      body: payload,
    }),

  // AI Knowledge — Docs
  listDocs: (signal?: AbortSignal) =>
    apiRequest<{ items: KnowledgeDoc[] }>('/api/admin/ai-knowledge/docs', {
      signal,
    }),

  createDoc: (payload: CreateDocPayload) =>
    apiRequest<KnowledgeDoc>('/api/admin/ai-knowledge/docs', {
      method: 'POST',
      body: payload,
    }),

  reindexDoc: (docId: string) =>
    apiRequest<KnowledgeDoc>(`/api/admin/ai-knowledge/docs/${docId}/reindex`, {
      method: 'POST',
    }),

  // AI Knowledge — Rules
  listRules: (signal?: AbortSignal) =>
    apiRequest<{ items: FeasibilityRule[] }>('/api/admin/ai-knowledge/rules', {
      signal,
    }),

  updateRule: (ruleId: string, payload: UpdateRulePayload) =>
    apiRequest<FeasibilityRule>(`/api/admin/ai-knowledge/rules/${ruleId}`, {
      method: 'PATCH',
      body: payload,
    }),

  // AI Knowledge — Analysis logs
  listAnalysisLogs: (signal?: AbortSignal) =>
    apiRequest<{ items: AnalysisLog[] }>(
      '/api/admin/ai-knowledge/analysis-logs',
      { signal },
    ),

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

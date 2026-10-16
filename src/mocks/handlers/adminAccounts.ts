// Mock handlers for Admin account management APIs:
//   GET  /api/admin/dashboard
// (users / accounts / users-me are served by the real backend.)
import type { UserRole } from '../../features/auth/types'
import type {
  AccountStatus,
  AdminAccountItem,
  AdminDashboard,
} from '../../features/admin/types/accounts'
import { createCollection } from '../db'
import { ok, registerMockRoutes } from '../mockServer'
import seed from '../data/admin-accounts.json'

type SeedAccount = (typeof seed.accounts)[number]

const accounts = createCollection(
  seed.accounts as SeedAccount[],
) as unknown as SeedAccount[]

function toItem(a: SeedAccount): AdminAccountItem {
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    role: a.role as UserRole,
    status: a.status as AccountStatus,
    emailVerified: a.emailVerified,
    createdAt: a.createdAt,
    lastLoginAt: a.lastLoginAt,
  }
}

function buildDashboard(): AdminDashboard {
  const total = accounts.length
  const active = accounts.filter((a) => a.status === 'ACTIVE').length
  const pending = accounts.filter((a) => a.status === 'PENDING').length
  const inactive = accounts.filter((a) => a.status === 'INACTIVE').length

  const byRole: Record<string, number> = {}
  for (const a of accounts) {
    byRole[a.role] = (byRole[a.role] ?? 0) + 1
  }

  const recent = [...accounts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(toItem)

  return { totalAccounts: total, activeAccounts: active, pendingAccounts: pending, inactiveAccounts: inactive, byRole, recentAccounts: recent }
}

registerMockRoutes([
  // ADM-01 dashboard
  {
    method: 'GET',
    path: '/api/admin/dashboard',
    handler: () => ok(buildDashboard()),
  },

])

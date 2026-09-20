// Mock handlers for Admin account management APIs:
//   GET  /api/admin/dashboard
//   GET  /api/admin/accounts[?role=&status=]
//   GET  /api/admin/accounts/:id
//   POST /api/admin/accounts
//   PATCH /api/admin/accounts/:id
//   POST /api/admin/accounts/:id/deactivate
//   POST /api/admin/accounts/:id/activate
import type { UserRole } from '../../features/auth/types'
import type {
  AccountStatus,
  AdminAccountDetail,
  AdminAccountItem,
  AdminDashboard,
} from '../../features/admin/types/accounts'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
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
    certExpiry: (a as unknown as { certExpiry?: string | null }).certExpiry ?? null,
  }
}

function toDetail(a: SeedAccount): AdminAccountDetail {
  return {
    ...toItem(a),
    linkedProviders: a.linkedProviders,
    avatarUrl: a.avatarUrl,
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

  // ADM-02 list accounts
  {
    method: 'GET',
    path: '/api/admin/accounts',
    handler: ({ query }) => {
      const role = query.get('role')
      const status = query.get('status')
      let filtered = accounts as SeedAccount[]
      if (role) filtered = filtered.filter((a) => a.role === role)
      if (status) filtered = filtered.filter((a) => a.status === status)
      const items = [...filtered]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(toItem)
      return ok({ items })
    },
  },

  // ADM-04 account detail
  {
    method: 'GET',
    path: '/api/admin/accounts/:id',
    handler: ({ params }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      return ok(toDetail(acc))
    },
  },

  // ADM-03 create account
  {
    method: 'POST',
    path: '/api/admin/accounts',
    handler: ({ body }) => {
      const payload = body as { fullName?: string; email?: string; role?: string }
      if (!payload.fullName?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Họ tên là bắt buộc.', { fullName: 'Bắt buộc' })
      if (!payload.email?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Email là bắt buộc.', { email: 'Bắt buộc' })
      if (accounts.find((a) => a.email === payload.email?.trim().toLowerCase()))
        return fail(409, 'EMAIL_EXISTS', 'Email đã tồn tại trong hệ thống.')
      if (!payload.role)
        return fail(400, 'VALIDATION_ERROR', 'Vai trò là bắt buộc.', { role: 'Bắt buộc' })

      const now = new Date().toISOString()
      const newAcc = {
        id: `acc-new-${Date.now()}`,
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        status: 'PENDING',
        emailVerified: false,
        createdAt: now,
        lastLoginAt: null,
        linkedProviders: [],
        avatarUrl: null,
      } as unknown as SeedAccount
      accounts.push(newAcc)
      return ok(toDetail(newAcc))
    },
  },

  // ADM-04 update account
  {
    method: 'PATCH',
    path: '/api/admin/accounts/:id',
    handler: ({ params, body }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      const payload = body as { fullName?: string; role?: string }
      if (payload.fullName !== undefined) acc.fullName = payload.fullName.trim()
      if (payload.role !== undefined) acc.role = payload.role
      return ok(toDetail(acc))
    },
  },

  // Deactivate
  {
    method: 'POST',
    path: '/api/admin/accounts/:id/deactivate',
    handler: ({ params }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      if (acc.status === 'INACTIVE')
        return fail(409, 'ALREADY_INACTIVE', 'Tài khoản đã không hoạt động.')
      acc.status = 'INACTIVE'
      return ok(toDetail(acc))
    },
  },

  // Activate
  {
    method: 'POST',
    path: '/api/admin/accounts/:id/activate',
    handler: ({ params }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      if (acc.status === 'ACTIVE')
        return fail(409, 'ALREADY_ACTIVE', 'Tài khoản đã đang hoạt động.')
      acc.status = 'ACTIVE'
      return ok(toDetail(acc))
    },
  },

  // Reset password (sends email, returns success)
  {
    method: 'POST',
    path: '/api/admin/accounts/:id/reset-password',
    handler: ({ params }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      return ok({ sent: true, email: acc.email })
    },
  },
])

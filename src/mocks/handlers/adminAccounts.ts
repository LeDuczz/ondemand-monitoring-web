// Mock handlers for Admin account management APIs:
//   GET  /api/admin/dashboard
//   GET   /api/admin/users            [BE shape]
//   GET   /api/admin/users/:id        [BE shape]
//   PATCH /api/admin/users/:id/status [BE shape]
//   POST  /api/admin/accounts         [BE shape]
//   GET/PATCH /api/users/me           [BE shape]
//   PATCH /api/admin/accounts/:id     [mock only]
//   POST  /api/admin/accounts/:id/reset-password [mock only]
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

// Backend DTO shapes (UserManagementSummaryResponse / DetailResponse).
function toActive(a: SeedAccount): boolean {
  return a.status !== 'INACTIVE'
}

function toSummaryDto(a: SeedAccount) {
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    role: a.role,
    active: toActive(a),
    emailVerified: a.emailVerified,
    createdAt: a.createdAt,
    ...(a.lastLoginAt ? { lastLoginAt: a.lastLoginAt } : {}),
  }
}

function toCustomerProfile(a: SeedAccount) {
  return a.role === 'CUSTOMER'
    ? {
        customerProfile: {
          phoneNumber: '0901 234 567',
          address: '12 Nguyễn Huệ, Quận 1, TP.HCM',
          companyName: 'Công ty ' + a.fullName,
        },
      }
    : {}
}

function toDetailDto(a: SeedAccount) {
  return {
    ...toSummaryDto(a),
    updatedAt: a.createdAt,
    linkedProviders: a.linkedProviders,
    ...toCustomerProfile(a),
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

  // [BE] GET /api/admin/users
  {
    method: 'GET',
    path: '/api/admin/users',
    handler: ({ query }) => {
      const page = Math.max(0, Number(query.get('page') ?? 0) || 0)
      const size = Math.max(1, Number(query.get('size') ?? 20) || 20)
      const search = query.get('search')?.trim().toLowerCase()
      const role = query.get('role')
      const active = query.get('active')
      const emailVerified = query.get('emailVerified')
      const sorted = [...accounts]
        .filter((a) => !role || a.role === role)
        .filter((a) => active === null || toActive(a) === (active === 'true'))
        .filter(
          (a) =>
            emailVerified === null ||
            a.emailVerified === (emailVerified === 'true'),
        )
        .filter(
          (a) =>
            !search ||
            a.fullName.toLowerCase().includes(search) ||
            a.email.toLowerCase().includes(search),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      const totalPages = Math.ceil(sorted.length / size)
      return ok({
        items: sorted.slice(page * size, (page + 1) * size).map(toSummaryDto),
        page,
        size,
        totalItems: sorted.length,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      })
    },
  },

  // [BE] GET /api/admin/users/{userId}
  {
    method: 'GET',
    path: '/api/admin/users/:id',
    handler: ({ params }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      return ok(toDetailDto(acc))
    },
  },

  // [BE] PATCH /api/admin/users/{userId}/status
  {
    method: 'PATCH',
    path: '/api/admin/users/:id/status',
    handler: ({ params, body }) => {
      const acc = accounts.find((a) => a.id === params.id)
      if (!acc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
      const { active } = (body ?? {}) as { active?: unknown }
      if (typeof active !== 'boolean')
        return fail(400, 'VALIDATION_ERROR', 'Trạng thái là bắt buộc.', {
          active: 'Bắt buộc',
        })
      acc.status = active ? 'ACTIVE' : 'INACTIVE'
      return ok(toDetailDto(acc))
    },
  },

  // [BE] POST /api/admin/accounts
  {
    method: 'POST',
    path: '/api/admin/accounts',
    handler: ({ body }) => {
      const payload = (body ?? {}) as {
        fullName?: string
        email?: string
        role?: string
      }
      if (!payload.fullName?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Họ tên là bắt buộc.', { fullName: 'Bắt buộc' })
      if (!payload.email?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Email là bắt buộc.', { email: 'Bắt buộc' })
      if (!payload.role)
        return fail(400, 'VALIDATION_ERROR', 'Vai trò là bắt buộc.', { role: 'Bắt buộc' })
      const email = payload.email.trim().toLowerCase()
      if (accounts.find((a) => a.email.toLowerCase() === email))
        return fail(409, 'EMAIL_EXISTS', 'Email đã tồn tại trong hệ thống.')

      accounts.push({
        id: `acc-new-${Date.now()}`,
        fullName: payload.fullName.trim(),
        email,
        role: payload.role,
        status: 'PENDING',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        linkedProviders: [],
        avatarUrl: null,
      } as unknown as SeedAccount)
      return ok({
        email,
        role: payload.role,
        invitationSent: true,
        passwordChangeRequired: true,
      })
    },
  },

  // [BE] GET /api/users/me (mock: first seeded account = signed-in admin)
  {
    method: 'GET',
    path: '/api/users/me',
    handler: () => {
      const me = accounts[0]
      return ok({
        id: me.id,
        fullName: me.fullName,
        email: me.email,
        role: me.role,
        ...toCustomerProfile(me),
      })
    },
  },

  // [BE] PATCH /api/users/me
  {
    method: 'PATCH',
    path: '/api/users/me',
    handler: ({ body }) => {
      const me = accounts[0]
      const payload = (body ?? {}) as { fullName?: string }
      if (payload.fullName !== undefined) {
        if (!payload.fullName.trim())
          return fail(400, 'VALIDATION_ERROR', 'Họ tên là bắt buộc.', {
            fullName: 'Bắt buộc',
          })
        me.fullName = payload.fullName.trim()
      }
      return ok({
        id: me.id,
        fullName: me.fullName,
        email: me.email,
        role: me.role,
        ...toCustomerProfile(me),
      })
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

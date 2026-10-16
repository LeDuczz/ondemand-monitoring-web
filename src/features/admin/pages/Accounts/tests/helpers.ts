import { afterEach, beforeEach } from 'vitest'

import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { resetMockDb } from '../../../../../mocks/db'
import seed from '../../../../../mocks/data/admin-accounts.json'
import { stubApi, stubError } from '../../../../../test/stubApi'

// `/api/admin/users*` and `POST /api/admin/accounts` are served by the real
// backend, so they have no mock route. These tests stub them over a copy of
// the admin-accounts seed; everything still mocked falls through to mockFetch.

type SeedAccount = (typeof seed.accounts)[number]

const active = (a: SeedAccount) => a.status !== 'INACTIVE'

function summary(a: SeedAccount) {
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    role: a.role,
    active: active(a),
    emailVerified: a.emailVerified,
    createdAt: a.createdAt,
    ...(a.lastLoginAt ? { lastLoginAt: a.lastLoginAt } : {}),
  }
}

function detail(a: SeedAccount) {
  return {
    ...summary(a),
    updatedAt: a.createdAt,
    linkedProviders: a.linkedProviders,
    ...(a.role === 'CUSTOMER'
      ? {
          customerProfile: {
            phoneNumber: '0901 234 567',
            address: '12 Nguyễn Huệ, Quận 1, TP.HCM',
            companyName: 'Công ty ' + a.fullName,
          },
        }
      : {}),
  }
}

export function stubAdminUsersApi() {
  const accounts: SeedAccount[] = structuredClone(seed.accounts)
  return stubApi(
    [
      {
        path: '/api/admin/users',
        respond: ({ query }) => {
          const page = Math.max(0, Number(query.get('page') ?? 0) || 0)
          const size = Math.max(1, Number(query.get('size') ?? 20) || 20)
          const search = query.get('search')?.trim().toLowerCase()
          const role = query.get('role')
          const act = query.get('active')
          const verified = query.get('emailVerified')
          const sorted = accounts
            .filter((a) => !role || a.role === role)
            .filter((a) => act === null || active(a) === (act === 'true'))
            .filter(
              (a) =>
                verified === null || a.emailVerified === (verified === 'true'),
            )
            .filter(
              (a) =>
                !search ||
                a.fullName.toLowerCase().includes(search) ||
                a.email.toLowerCase().includes(search),
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
          const totalPages = Math.ceil(sorted.length / size)
          return {
            items: sorted.slice(page * size, (page + 1) * size).map(summary),
            page,
            size,
            totalItems: sorted.length,
            totalPages,
            first: page === 0,
            last: page >= totalPages - 1,
          }
        },
      },
      {
        path: '/api/admin/users/:id',
        respond: ({ params }) => {
          const acc = accounts.find((a) => a.id === params.id)
          return acc
            ? detail(acc)
            : stubError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
        },
      },
      {
        method: 'PATCH',
        path: '/api/admin/users/:id/status',
        respond: ({ params, body }) => {
          const acc = accounts.find((a) => a.id === params.id)
          if (!acc) return stubError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.')
          const flag = (body as { active?: unknown } | undefined)?.active
          if (typeof flag !== 'boolean')
            return stubError(400, 'VALIDATION_ERROR', 'Trạng thái là bắt buộc.')
          acc.status = flag ? 'ACTIVE' : 'INACTIVE'
          return detail(acc)
        },
      },
      {
        method: 'POST',
        path: '/api/admin/accounts',
        respond: ({ body }) => {
          const p = (body ?? {}) as {
            fullName?: string
            email?: string
            role?: string
          }
          if (!p.fullName?.trim())
            return stubError(400, 'VALIDATION_ERROR', 'Họ tên là bắt buộc.')
          if (!p.email?.trim())
            return stubError(400, 'VALIDATION_ERROR', 'Email là bắt buộc.')
          const email = p.email.trim().toLowerCase()
          if (accounts.some((a) => a.email.toLowerCase() === email))
            return stubError(409, 'EMAIL_EXISTS', 'Email đã tồn tại trong hệ thống.')
          return {
            email,
            role: p.role,
            invitationSent: true,
            passwordChangeRequired: true,
          }
        },
      },
    ],
    { fallback: mockFetch },
  )
}

export const requestedUrls: string[] = []

/** Installs the admin-users stub (recording request URLs) for each test. */
export function useAdminUsersStub() {
  let stub: ReturnType<typeof stubAdminUsersApi> | undefined
  beforeEach(() => {
    resetMockDb()
    requestedUrls.length = 0
    stub = stubAdminUsersApi()
    const push = stub.calls.push.bind(stub.calls)
    stub.calls.push = (...items) => {
      requestedUrls.push(...items.map((c) => c.url))
      return push(...items)
    }
  })
  afterEach(() => {
    resetMockDb()
    stub?.restore()
  })
}

// Mock handlers for POST /api/v1/auth/login, /logout and /refresh.
//
// Only the demo emails listed in `src/mocks/data/auth-users.json` are
// intercepted — everything else (unknown email, or any request once the
// matching account can't be resolved) falls through to the real backend via
// `passThrough()`, per PLAN §6 ("Login mock: chỉ chặn khi email thuộc
// auth-users.json; email khác → backend thật").

import { createCollection } from '../db'
import { fail, ok, passThrough, registerMockRoutes } from '../mockServer'
import seed from '../data/auth-users.json'

type MockUser = {
  id: string
  email: string
  password: string
  fullName: string
  role: 'CUSTOMER' | 'STAFF' | 'DRONE_OPERATOR' | 'SYSTEM_OPERATOR' | 'ADMIN'
  emailVerified: boolean
  isActive: boolean
  accessToken: string
}

const users = createCollection(seed).users as MockUser[]

const REFRESH_COOKIE = 'odm_mock_refresh'

function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

function findUserByToken(token: string) {
  return users.find((user) => user.accessToken === token)
}

function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function setRefreshCookie(userId: string) {
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(userId)}; path=/`
}

function clearRefreshCookie() {
  document.cookie = `${REFRESH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

function toAuthResponse(user: MockUser) {
  return {
    accessToken: user.accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      isActive: user.isActive,
      linkedProviders: ['LOCAL'],
    },
  }
}

function bearerToken(headers: Headers) {
  const header = headers.get('Authorization') ?? headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return undefined
  return header.slice('Bearer '.length)
}

registerMockRoutes([
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    handler: ({ body }) => {
      const { email, password } = (body ?? {}) as {
        email?: string
        password?: string
      }
      if (!email) return passThrough()

      const user = findUserByEmail(email)
      if (!user) return passThrough()

      if (password !== user.password) {
        // Message copied verbatim from backend ErrorCode.INVALID_CREDENTIALS.
        return fail(
          401,
          'INVALID_CREDENTIALS',
          'Email hoặc mật khẩu không đúng',
        )
      }

      if (!user.isActive) {
        // Message copied verbatim from backend ErrorCode.ACCOUNT_DISABLED.
        return fail(403, 'ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa')
      }

      setRefreshCookie(user.id)
      return ok(toAuthResponse(user))
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/logout',
    handler: ({ headers }) => {
      const token = bearerToken(headers)
      if (!token) return passThrough()
      const user = findUserByToken(token)
      if (!user) return passThrough()

      clearRefreshCookie()
      return ok(undefined, 'Đăng xuất thành công')
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/refresh',
    handler: () => {
      const userId = readCookie(REFRESH_COOKIE)
      if (!userId) return passThrough()
      const user = users.find((candidate) => candidate.id === userId)
      if (!user) return passThrough()

      return ok(toAuthResponse(user))
    },
  },
])

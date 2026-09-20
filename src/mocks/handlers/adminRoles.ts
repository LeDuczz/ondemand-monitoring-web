// Mock handlers for Admin roles APIs:
//   GET    /api/admin/roles
//   GET    /api/admin/roles/:id
//   POST   /api/admin/roles
//   PATCH  /api/admin/roles/:id
//   DELETE /api/admin/roles/:id
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seedData from '../data/admin-roles.json'

type RoleSeed = (typeof seedData.roles)[number]

const roles = createCollection(seedData.roles as RoleSeed[]) as unknown as RoleSeed[]

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/admin/roles',
    handler: () => ok({ items: [...roles] }),
  },

  {
    method: 'GET',
    path: '/api/admin/roles/:id',
    handler: ({ params }) => {
      const role = roles.find((r) => r.id === params.id)
      if (!role) return fail(404, 'NOT_FOUND', 'Không tìm thấy vai trò.')
      return ok(role)
    },
  },

  {
    method: 'POST',
    path: '/api/admin/roles',
    handler: ({ body }) => {
      const payload = body as { code?: string; name?: string; description?: string; isActive?: boolean }
      if (!payload.code?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Mã vai trò là bắt buộc.', { code: 'Bắt buộc' })
      if (!payload.name?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Tên vai trò là bắt buộc.', { name: 'Bắt buộc' })
      const code = payload.code.trim().toUpperCase()
      if (roles.find((r) => r.code === code))
        return fail(409, 'CODE_EXISTS', 'Mã vai trò đã tồn tại.')
      const newRole = {
        id: `role-custom-${Date.now()}`,
        code,
        name: payload.name.trim(),
        description: payload.description?.trim() ?? '',
        type: 'CUSTOM' as const,
        isSystemRole: false,
        isActive: payload.isActive ?? true,
        userCount: 0,
      }
      roles.push(newRole as RoleSeed)
      return ok(newRole)
    },
  },

  {
    method: 'PATCH',
    path: '/api/admin/roles/:id',
    handler: ({ params, body }) => {
      const role = roles.find((r) => r.id === params.id)
      if (!role) return fail(404, 'NOT_FOUND', 'Không tìm thấy vai trò.')
      if (role.isSystemRole) return fail(403, 'SYSTEM_ROLE', 'Không thể sửa vai trò hệ thống.')
      const payload = body as { name?: string; description?: string; isActive?: boolean }
      if (payload.name !== undefined) role.name = payload.name.trim()
      if (payload.description !== undefined) role.description = payload.description.trim()
      if (payload.isActive !== undefined) role.isActive = payload.isActive
      return ok(role)
    },
  },

  {
    method: 'DELETE',
    path: '/api/admin/roles/:id',
    handler: ({ params }) => {
      const idx = roles.findIndex((r) => r.id === params.id)
      if (idx === -1) return fail(404, 'NOT_FOUND', 'Không tìm thấy vai trò.')
      const role = roles[idx]
      if (role.isSystemRole) return fail(403, 'SYSTEM_ROLE', 'Không thể xóa vai trò hệ thống.')
      if (role.userCount > 0) return fail(409, 'ROLE_IN_USE', `Vai trò đang được ${role.userCount} người dùng sử dụng.`)
      roles.splice(idx, 1)
      return ok({ deleted: true })
    },
  },
])

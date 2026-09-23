export type RoleType = 'SYSTEM' | 'CUSTOM'

export type AdminRole = {
  id: string
  code: string
  name: string
  description: string
  type: RoleType
  isSystemRole: boolean
  isActive: boolean
  userCount: number
}

export type CreateRolePayload = {
  code: string
  name: string
  description: string
  isActive: boolean
}

export type UpdateRolePayload = {
  name: string
  description: string
  isActive: boolean
}

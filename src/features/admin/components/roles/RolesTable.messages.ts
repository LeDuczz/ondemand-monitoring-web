import { defineMessages } from '../../../../shared/i18n'

export const rolesTableMessages = defineMessages({
  vi: {
    role: 'Vai trò',
    description: 'Mô tả',
    type: 'Loại',
    userCount: 'Số user',
    system: 'Hệ thống',
    custom: 'Tuỳ chỉnh',
    edit: 'Sửa',
    delete: 'Xoá',
    systemNoEdit: 'Vai trò hệ thống, không thể sửa hoặc xoá',
    systemRoleTitle: 'Vai trò hệ thống',
    systemRoleBanner: (codes: string) =>
      `${codes} được hệ thống dùng trực tiếp trong phân quyền nên không thể sửa hay xoá (is_system_role = true). Bạn chỉ có thể xem số người dùng đang dùng.`,
  },
  en: {
    role: 'Role',
    description: 'Description',
    type: 'Type',
    userCount: 'Users',
    system: 'System',
    custom: 'Custom',
    edit: 'Edit',
    delete: 'Delete',
    systemNoEdit: 'System role, cannot be edited or deleted',
    systemRoleTitle: 'System roles',
    systemRoleBanner: (codes: string) =>
      `${codes} are used directly by the system for authorization, so they cannot be edited or deleted (is_system_role = true). You can only view how many users have them.`,
  },
})

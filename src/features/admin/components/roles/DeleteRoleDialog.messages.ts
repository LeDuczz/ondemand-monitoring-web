import { defineMessages } from '../../../../shared/i18n'

export const deleteRoleDialogMessages = defineMessages({
  vi: {
    cannotDeleteTitle: (code: string) => `Không thể xoá vai trò ${code}`,
    deleteTitle: 'Xoá vai trò',
    stillInUse: (count: number) =>
      `Còn ${count} người dùng đang dùng vai trò này.`,
    changeFirst: 'Đổi vai trò của người dùng trước, sau đó mới xoá được.',
    confirmPrefix: 'Xác nhận xoá vai trò',
    close: 'Đóng',
    deleting: 'Đang xoá...',
    delete: 'Xoá',
    genericError: 'Lỗi khi xoá vai trò.',
  },
  en: {
    cannotDeleteTitle: (code: string) => `Cannot delete role ${code}`,
    deleteTitle: 'Delete role',
    stillInUse: (count: number) =>
      `${count} user(s) are still using this role.`,
    changeFirst: 'Change those users’ role first, then you can delete it.',
    confirmPrefix: 'Confirm delete role',
    close: 'Close',
    deleting: 'Deleting...',
    delete: 'Delete',
    genericError: 'Failed to delete the role.',
  },
})

import { defineMessages } from '../../../../shared/i18n'

export const roleDialogMessages = defineMessages({
  vi: {
    editTitle: (code: string) => `Sửa vai trò ${code}`,
    createTitle: 'Tạo vai trò',
    codeReadonlyHint: 'Không đổi được sau khi tạo',
    codeCreateHint: 'Chữ in hoa, không dấu, duy nhất',
    activateNow: 'Kích hoạt ngay (is_active)',
    cancel: 'Huỷ',
    saving: 'Đang lưu...',
    save: 'Lưu',
    create: 'Tạo vai trò',
    genericError: 'Lỗi khi lưu vai trò.',
  },
  en: {
    editTitle: (code: string) => `Edit role ${code}`,
    createTitle: 'Create role',
    codeReadonlyHint: 'Cannot be changed after creation',
    codeCreateHint: 'Uppercase, no accents, unique',
    activateNow: 'Activate now (is_active)',
    cancel: 'Cancel',
    saving: 'Saving...',
    save: 'Save',
    create: 'Create role',
    genericError: 'Failed to save the role.',
  },
})

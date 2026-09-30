import { defineMessages } from '../../../../../shared/i18n'

export const timeslotModalMessages = defineMessages({
  vi: {
    createTitle: 'Thêm khung giờ',
    editTitle: 'Sửa khung giờ',
    createSubtitle: 'Khung giờ ưu tiên khách hàng có thể chọn',
    editSubtitle: 'Cập nhật khung giờ ưu tiên',
    code: 'Mã khung giờ',
    name: 'Tên hiển thị',
    namePlaceholder: 'VD: Buổi sáng',
    startTime: 'Bắt đầu',
    endTime: 'Kết thúc',
    required: 'Bắt buộc',
    genericError: 'Không lưu được khung giờ.',
  },
  en: {
    createTitle: 'Add timeslot',
    editTitle: 'Edit timeslot',
    createSubtitle: 'A preferred time window customers can pick',
    editSubtitle: 'Update the preferred timeslot',
    code: 'Timeslot code',
    name: 'Display name',
    namePlaceholder: 'e.g. Morning',
    startTime: 'Start',
    endTime: 'End',
    required: 'Required',
    genericError: 'Could not save the timeslot.',
  },
})

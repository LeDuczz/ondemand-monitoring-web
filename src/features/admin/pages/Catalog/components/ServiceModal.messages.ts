import { defineMessages } from '../../../../../shared/i18n'

export const serviceModalMessages = defineMessages({
  vi: {
    createTitle: 'Thêm dịch vụ',
    editTitle: 'Sửa dịch vụ',
    createSubtitle: 'Tạo dịch vụ mới trong danh mục',
    editSubtitle: 'Cập nhật thông tin dịch vụ',
    name: 'Tên dịch vụ',
    namePlaceholder: 'VD: Kiểm tra mái nhà',
    description: 'Mô tả',
    isActive: 'Đang hoạt động',
    isActiveHint: 'Dịch vụ tắt sẽ không hiển thị cho khách hàng.',
    required: 'Bắt buộc',
    genericError: 'Không lưu được dịch vụ.',
  },
  en: {
    createTitle: 'Add service',
    editTitle: 'Edit service',
    createSubtitle: 'Create a new service in the catalog',
    editSubtitle: 'Update the service details',
    name: 'Service name',
    namePlaceholder: 'e.g. Roof inspection',
    description: 'Description',
    isActive: 'Active',
    isActiveHint: 'Inactive services are hidden from customers.',
    required: 'Required',
    genericError: 'Could not save the service.',
  },
})

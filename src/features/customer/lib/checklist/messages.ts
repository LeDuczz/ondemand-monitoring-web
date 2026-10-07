import { defineMessages } from '../../../../shared/i18n'

export const checklistMessages = defineMessages({
  vi: {
    title: 'Nội dung giám sát',
    hint: 'Danh sách mặc định của dịch vụ được hiển thị bên dưới. Bạn có thể chỉnh sửa, bỏ mục không cần thiết hoặc thêm nội dung riêng; danh sách được chốt khi gửi yêu cầu.',
    pricingNotice:
      'Thay đổi danh sách này có thể làm thay đổi chi phí. Manager sẽ review từng nội dung và gửi báo giá cuối cùng để bạn xác nhận.',
    choose: 'Chọn dịch vụ để xem nội dung giám sát.',
    loading: 'Đang tải nội dung giám sát…',
    empty:
      'Dịch vụ chưa có nội dung giám sát mặc định. Bạn có thể bổ sung bên dưới.',
    none: 'Bạn chưa chọn nội dung nào. Yêu cầu sẽ được gửi với danh sách rỗng.',
    add: 'Thêm nội dung',
    remove: 'Xóa nội dung bổ sung',
    removeDefault: 'Bỏ khỏi yêu cầu',
    restoreDefault: 'Thêm lại',
    select: (n: number) => `Chọn nội dung ${n}`,
    content: (n: number) => `Nội dung giám sát ${n}`,
    custom: 'Bổ sung của bạn',
    defaultItem: 'Mặc định của dịch vụ',
    count: (n: number) => `${n}/100 nội dung được chọn`,
    length: 'Mỗi nội dung cần từ 1 đến 500 ký tự sau khi bỏ khoảng trắng thừa.',
    duplicate: 'Các nội dung được chọn không được trùng nhau.',
    limit: 'Chỉ được chọn tối đa 100 nội dung.',
    loadFailed:
      'Không thể tải nội dung giám sát. Vui lòng thử lại trước khi gửi.',
    stale:
      'Nội dung giám sát của dịch vụ đã thay đổi. Vui lòng tải lại và kiểm tra trước khi gửi.',
    discard: 'Tải lại sẽ bỏ toàn bộ chỉnh sửa và nội dung bổ sung hiện tại.',
    reload: 'Tải lại danh sách (bỏ chỉnh sửa)',
    retry: 'Thử lại',
    invalid: 'Vui lòng kiểm tra lại thông tin yêu cầu và nội dung giám sát.',
    session: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    missing: 'Dịch vụ hoặc yêu cầu không còn tồn tại. Vui lòng kiểm tra lại.',
    inactive: 'Dịch vụ không còn hoạt động. Vui lòng chọn dịch vụ khác.',
    failed: 'Không thể gửi yêu cầu. Vui lòng thử lại.',
    locked: 'Đã chốt khi gửi yêu cầu · Chỉ xem',
    history:
      'Đây là nội dung đã lưu của yêu cầu, không thay đổi theo danh mục dịch vụ.',
    legacy: 'Yêu cầu này chưa lưu danh sách nội dung giám sát.',
    emptySnapshot: 'Yêu cầu được gửi không kèm nội dung giám sát.',
  },
  en: {
    title: 'Monitoring requirements',
    hint: 'The service defaults are listed below. You can edit them, remove anything you do not need, or add your own; the list is locked when submitted.',
    pricingNotice:
      'Changing this list may change the cost. A manager will review each requirement and send the final quote for your confirmation.',
    choose: 'Select a service to view monitoring requirements.',
    loading: 'Loading monitoring requirements…',
    empty:
      'This service has no default requirements. You can add your own below.',
    none: 'No requirements selected. This request will be sent with an empty list.',
    add: 'Add requirement',
    remove: 'Remove custom requirement',
    removeDefault: 'Remove from request',
    restoreDefault: 'Add back',
    select: (n: number) => `Select requirement ${n}`,
    content: (n: number) => `Monitoring requirement ${n}`,
    custom: 'Your addition',
    defaultItem: 'Service default',
    count: (n: number) => `${n}/100 requirements selected`,
    length:
      'Each requirement must contain 1–500 characters after whitespace normalization.',
    duplicate: 'Selected requirements must not have duplicate content.',
    limit: 'Select at most 100 requirements.',
    loadFailed: 'Unable to load requirements. Please retry before submitting.',
    stale:
      'The service requirements have changed. Reload and review them before submitting.',
    discard: 'Reloading discards all current edits and custom requirements.',
    reload: 'Reload requirements (discard edits)',
    retry: 'Retry',
    invalid:
      'Please review the request information and monitoring requirements.',
    session: 'Your session has expired. Please sign in again.',
    forbidden: 'You are not allowed to perform this action.',
    missing:
      'The service or request no longer exists. Please review your selection.',
    inactive: 'The service is no longer active. Please select another service.',
    failed: 'Unable to submit the request. Please try again.',
    locked: 'Locked on submission · Read only',
    history:
      'These are the saved requirements, independent of the current service catalog.',
    legacy: 'This request has no saved monitoring requirements.',
    emptySnapshot:
      'This request was submitted with no monitoring requirements.',
  },
})

import { defineMessages } from '../../../../../shared/i18n'

export const areaReviewDialogMessages = defineMessages({
  vi: {
    title: 'Đánh giá điều kiện khu vực bay',
    hint: 'Kết quả bản đồ cần được Manager xác nhận trước khi tiếp tục.',
    close: 'Đóng',
    defaultContext: 'Yêu cầu giám sát',
    zonesToCheck: (n: number) => `${n} vùng cần đối chiếu`,
    options: {
      NOT_REQUIRED: {
        label: 'Khu vực phù hợp sơ bộ',
        hint: 'Có thể tiếp tục duyệt đơn và phân nguồn lực. Hồ sơ xin phép bay được thực hiện ở bước sau.',
      },
      CHANGE_LOCATION: {
        label: 'Yêu cầu khách đổi khu vực',
        hint: 'Trả đơn về cho khách chọn lại vị trí giám sát.',
      },
      REJECTED: {
        label: 'Khu vực không khả thi',
        hint: 'Khu vực hiện tại không thể triển khai theo yêu cầu.',
      },
    } as Record<string, { label: string; hint: string }>,
    reasonLabel: 'Lý do',
    reasonPlaceholderOption: 'Chọn lý do',
    unsuitableReasons: [
      'Khu vực cấm/hạn chế không đáp ứng điều kiện',
      'Không thể bảo đảm phạm vi hoạt động',
      'Không thể xác minh điều kiện khu vực',
      'Lý do khác',
    ],
    noteLabel: 'Ghi chú của Manager',
    notePlaceholder:
      'Ghi lại nội dung đã đối chiếu hoặc lưu ý cho bước tiếp theo…',
    pickStatus: 'Chọn một kết quả đánh giá.',
    pickReason: 'Chọn lý do khu vực không phù hợp.',
    saveFailed: 'Không thể lưu đánh giá. Vui lòng thử lại.',
    cancel: 'Hủy',
    saving: 'Đang lưu…',
    confirm: 'Xác nhận đánh giá',
  },
  en: {
    title: 'Review flight-area conditions',
    hint: 'The Manager must confirm the map result before continuing.',
    close: 'Close',
    defaultContext: 'Monitoring request',
    zonesToCheck: (n: number) => `${n} zones to cross-check`,
    options: {
      NOT_REQUIRED: {
        label: 'Area preliminarily suitable',
        hint: 'The order can continue to approval and resource assignment. The flight permit file is handled at a later step.',
      },
      CHANGE_LOCATION: {
        label: 'Ask the customer to change the area',
        hint: 'Send the order back so the customer picks the monitoring location again.',
      },
      REJECTED: {
        label: 'Area not feasible',
        hint: 'The current area cannot be served as requested.',
      },
    } as Record<string, { label: string; hint: string }>,
    reasonLabel: 'Reason',
    reasonPlaceholderOption: 'Select a reason',
    unsuitableReasons: [
      'Restricted/no-fly area does not meet the conditions',
      'The operating range cannot be guaranteed',
      'The area conditions cannot be verified',
      'Other reason',
    ],
    noteLabel: 'Manager note',
    notePlaceholder:
      'Record what was cross-checked or notes for the next step…',
    pickStatus: 'Select a review result.',
    pickReason: 'Select why the area is unsuitable.',
    saveFailed: 'Could not save the review. Please try again.',
    cancel: 'Cancel',
    saving: 'Saving…',
    confirm: 'Confirm review',
  },
})

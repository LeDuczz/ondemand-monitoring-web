import { defineMessages } from '../../../../../shared/i18n'

export const areaReviewDialogMessages = defineMessages({
  vi: {
    title: 'Đánh giá điều kiện khu vực bay',
    hint: 'Kết quả bản đồ cần được Manager xác nhận trước khi tiếp tục.',
    close: 'Đóng',
    defaultContext: 'Yêu cầu giám sát',
    zonesToCheck: (n: number) => `${n} vùng cần đối chiếu`,
    options: {
      PRELIMINARY_PASS: {
        label: 'Đạt sơ bộ',
        hint: 'Không phát hiện vấn đề cần chặn.',
      },
      RESTRICTED: {
        label: 'Cần xử lý/giấy phép',
        hint: 'Có điều kiện nhưng có thể tiếp tục chuẩn bị Mission.',
      },
      UNSUITABLE: {
        label: 'Không phù hợp',
        hint: 'Khu vực hiện tại không thể thực hiện theo yêu cầu.',
      },
    } as Record<string, { label: string; hint: string }>,
    restrictedNote:
      'Đơn có thể tiếp tục. Điều kiện giấy phép sẽ được xử lý sau khi Mission và kế hoạch bay được xác định.',
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
      'Ghi lại nội dung đã đối chiếu hoặc thông tin cần xác minh…',
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
      PRELIMINARY_PASS: {
        label: 'Preliminary pass',
        hint: 'No blocking issue found.',
      },
      RESTRICTED: {
        label: 'Needs handling/permit',
        hint: 'Conditional, but Mission preparation can continue.',
      },
      UNSUITABLE: {
        label: 'Unsuitable',
        hint: 'The current area cannot be served as requested.',
      },
    },
    restrictedNote:
      'The order can continue. Permit conditions are handled once the Mission and flight plan are defined.',
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
      'Record what was cross-checked or what needs verification…',
    pickStatus: 'Select a review result.',
    pickReason: 'Select why the area is unsuitable.',
    saveFailed: 'Could not save the review. Please try again.',
    cancel: 'Cancel',
    saving: 'Saving…',
    confirm: 'Confirm review',
  },
})

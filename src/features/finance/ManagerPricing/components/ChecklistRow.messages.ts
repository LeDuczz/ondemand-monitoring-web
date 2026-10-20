import { defineMessages } from '../../../../shared/i18n'

export const checklistRowMessages = defineMessages({
  vi: {
    classify: 'Phân loại',
    notReviewed: 'Chưa xem xét',
    reviewed: 'Đã xem xét',
    autoPriced: 'Tự động tính giá',
    awaitingPrice: 'Chờ duyệt giá',
    includedInPackage: 'Đã gồm trong gói',
    additional: 'Tính phí bổ sung',
    duplicate: 'Trùng lặp',
    rejected: 'Từ chối',
    templateSource: 'Yêu cầu mặc định của gói',
    customSource: 'Yêu cầu thêm của khách hàng',
    requestedMedia: (images: number, videos: number) =>
      `Khách yêu cầu: ${images} ảnh · ${videos} video`,
    noteAria: (content: string) => `Ghi chú: ${content}`,
    managerNote: 'Ghi chú của quản lý',
    classifyFirst: 'Phân loại nội dung trước',
    notePlaceholder: 'Lý do hoặc phạm vi xử lý',
  },
  en: {
    classify: 'Classification',
    notReviewed: 'Not reviewed',
    reviewed: 'Reviewed',
    autoPriced: 'Priced automatically',
    awaitingPrice: 'Awaiting price approval',
    includedInPackage: 'Included in package',
    additional: 'Additional charge',
    duplicate: 'Duplicate',
    rejected: 'Rejected',
    templateSource: 'Default package requirement',
    customSource: 'Customer-added requirement',
    requestedMedia: (images: number, videos: number) =>
      `Customer requested: ${images} photo(s) · ${videos} video(s)`,
    noteAria: (content: string) => `Note: ${content}`,
    managerNote: 'Manager note',
    classifyFirst: 'Classify the item first',
    notePlaceholder: 'Reason or handling scope',
  },
})

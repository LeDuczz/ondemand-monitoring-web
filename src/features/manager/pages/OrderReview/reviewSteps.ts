export type ReviewStep = 1 | 2 | 3 | 4

export const REVIEW_STEPS: Array<{
  number: number
  label: string
  hint: string
  reviewStep?: ReviewStep
}> = [
  { number: 1, label: 'Thông tin đơn', hint: 'Hồ sơ và vị trí', reviewStep: 1 },
  {
    number: 2,
    label: 'Kiểm tra vùng',
    hint: 'Bản đồ và cảnh báo',
    reviewStep: 2,
  },
  {
    number: 3,
    label: 'Điều kiện duyệt',
    hint: 'Kiểm tra và xác nhận',
    reviewStep: 3,
  },
  {
    number: 4,
    label: 'Checklist & báo giá',
    hint: 'Phân loại và quyết định',
    reviewStep: 4,
  },
  { number: 5, label: 'Lên lịch', hint: 'Thời gian thực hiện' },
  { number: 6, label: 'Gán nguồn lực', hint: 'Thiết bị và nhân sự' },
  { number: 7, label: 'Xác nhận', hint: 'Hoàn tất kế hoạch' },
]

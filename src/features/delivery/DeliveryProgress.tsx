import type { DeliveryStatus } from './types'

const STEPS = [
  { label: 'Kiểm tra kết quả', shortLabel: 'Kiểm tra' },
  { label: 'Customer duyệt', shortLabel: 'Duyệt' },
  { label: 'Thanh toán cuối', shortLabel: 'Thanh toán' },
  { label: 'Bàn giao dữ liệu', shortLabel: 'Bàn giao' },
] as const

const STATUS_META: Record<
  DeliveryStatus,
  { label: string; tone: string; step: number }
> = {
  PROCESSING: { label: 'Đang xử lý kết quả', tone: 'neutral', step: 0 },
  READY_FOR_MANAGER_REVIEW: {
    label: 'Chờ Manager kiểm tra',
    tone: 'warning',
    step: 0,
  },
  CUSTOMER_REVIEW: { label: 'Chờ Customer duyệt', tone: 'info', step: 1 },
  REVISION_REQUESTED: { label: 'Đang chỉnh sửa', tone: 'warning', step: 1 },
  FINAL_PAYMENT_PENDING: {
    label: 'Chờ thanh toán cuối',
    tone: 'warning',
    step: 2,
  },
  PAYMENT_CONFIRMED: {
    label: 'Đã xác nhận thanh toán',
    tone: 'success',
    step: 3,
  },
  READY_FOR_DELIVERY: { label: 'Sẵn sàng bàn giao', tone: 'info', step: 3 },
  DELIVERED: { label: 'Đã bàn giao', tone: 'success', step: 4 },
}

export function DeliveryStatusPill({ status }: { status: DeliveryStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`delivery-status delivery-status--${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export function DeliveryProgress({ status }: { status: DeliveryStatus }) {
  const currentStep = STATUS_META[status].step
  return (
    <ol className="delivery-progress" aria-label="Tiến trình bàn giao">
      {STEPS.map((step, index) => {
        const completed = currentStep > index
        const current = currentStep === index
        return (
          <li
            key={step.label}
            className={
              completed ? 'is-complete' : current ? 'is-current' : undefined
            }
            aria-current={current ? 'step' : undefined}
          >
            <span className="delivery-progress__marker" aria-hidden="true">
              {completed ? '✓' : index + 1}
            </span>
            <span className="delivery-progress__label">
              <span className="delivery-progress__full">{step.label}</span>
              <span className="delivery-progress__short">
                {step.shortLabel}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

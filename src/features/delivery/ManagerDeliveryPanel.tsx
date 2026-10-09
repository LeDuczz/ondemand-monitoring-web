import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/httpClient'
import { deliveryApi } from './api'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { Delivery } from './types'
import './delivery.css'

export function ManagerDeliveryPanel({
  orderId,
  refreshKey = 0,
}: {
  orderId: string
  refreshKey?: number
}) {
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const value = await deliveryApi.managerGet(orderId)
      setDelivery(value)
      setSelected(value.assets.map((asset) => asset.id))
      setError(null)
    } catch (cause) {
      if (!(
        cause instanceof ApiError && [404, 409].includes(cause.status ?? 0)
      ))
        setError(
          cause instanceof Error
            ? cause.message
            : 'Không tải được thông tin bàn giao.',
        )
    }
  }, [orderId, refreshKey])

  useEffect(() => void load(), [load])
  if (!delivery)
    return error ? (
      <p className="delivery-error" role="alert">
        {error}
      </p>
    ) : null

  async function run(action: () => Promise<Delivery>) {
    setBusy(true)
    setError(null)
    try {
      setDelivery(await action())
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Thao tác thất bại.')
    } finally {
      setBusy(false)
    }
  }

  const canReleasePreview = [
    'READY_FOR_MANAGER_REVIEW',
    'REVISION_REQUESTED',
  ].includes(delivery.deliveryStatus)
  const allSelected =
    delivery.assets.length > 0 && selected.length === delivery.assets.length

  return (
    <section
      className="odm-or-card delivery-shell delivery-manager"
      aria-labelledby="manager-delivery-title"
    >
      <header className="delivery-hero">
        <div className="delivery-hero__copy">
          <span className="delivery-eyebrow">Quy trình bàn giao</span>
          <h2 id="manager-delivery-title">Kiểm duyệt &amp; bàn giao kết quả</h2>
          <p>
            Chọn dữ liệu gửi xem trước, theo dõi thanh toán và phát hành bản gốc
            cho khách hàng.
          </p>
        </div>
        <DeliveryStatusPill status={delivery.deliveryStatus} />
      </header>
      <DeliveryProgress status={delivery.deliveryStatus} />
      <div className="delivery-content">
        {delivery.revisionReason ? (
          <StatusBanner
            tone="warning"
            title="Customer yêu cầu chỉnh sửa"
            text={delivery.revisionReason}
          />
        ) : null}
        {delivery.deliveryStatus === 'PROCESSING' ? (
          <StatusBanner
            title="Chưa thể gửi bản xem trước"
            text="Hãy duyệt kết quả nhiệm vụ và toàn bộ media bắt buộc trước."
          />
        ) : null}
        {canReleasePreview && delivery.assets.length === 0 ? (
          <StatusBanner
            tone="warning"
            title="Chưa có media được duyệt"
            text="Duyệt media cho khách hàng trong thư viện phía trên. Các tệp hợp lệ sẽ xuất hiện tại đây để lựa chọn."
          />
        ) : null}

        {delivery.assets.length > 0 ? (
          <section
            className="delivery-section"
            aria-labelledby="manager-assets-title"
          >
            <div className="delivery-section__head">
              <div>
                <h3 id="manager-assets-title">Media gửi cho Customer</h3>
                <p>
                  {selected.length}/{delivery.assets.length} tệp đang được chọn
                </p>
              </div>
              {canReleasePreview ? (
                <button
                  type="button"
                  className="delivery-text-button"
                  onClick={() =>
                    setSelected(
                      allSelected
                        ? []
                        : delivery.assets.map((asset) => asset.id),
                    )
                  }
                >
                  {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              ) : null}
            </div>
            <div className="delivery-grid">
              {delivery.assets.map((asset, index) => {
                const checked = selected.includes(asset.id)
                return (
                  <label
                    key={asset.id}
                    className={`delivery-asset delivery-select${checked ? ' is-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canReleasePreview}
                      onChange={(event) =>
                        setSelected((ids) =>
                          event.target.checked
                            ? [...ids, asset.id]
                            : ids.filter((id) => id !== asset.id),
                        )
                      }
                    />
                    <span className="delivery-asset__check" aria-hidden="true">
                      ✓
                    </span>
                    <MediaPreview asset={asset} />
                    <span className="delivery-asset__meta">
                      <strong title={asset.fileName}>{asset.fileName}</strong>
                      <small>
                        {asset.type.toUpperCase().includes('VIDEO')
                          ? 'Video'
                          : 'Hình ảnh'}{' '}
                        · Tệp #{index + 1}
                      </small>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        ) : null}

        {canReleasePreview && delivery.assets.length > 0 ? (
          <section
            className="delivery-composer"
            aria-labelledby="delivery-note-title"
          >
            <div className="delivery-field-head">
              <label id="delivery-note-title" htmlFor="delivery-notes">
                Ghi chú bàn giao
              </label>
              <span>{notes.length}/1000</span>
            </div>
            <textarea
              id="delivery-notes"
              placeholder="Ví dụ: Đã cân chỉnh màu và chọn các góc quay rõ nhất…"
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
            />
            <div className="delivery-action-bar">
              <div>
                <b>{selected.length} tệp</b>
                <span>sẽ được gửi dưới dạng bản xem trước</span>
              </div>
              <button
                type="button"
                className="odm-btn odm-btn-p delivery-primary-action"
                disabled={busy || selected.length === 0}
                title={
                  selected.length === 0
                    ? 'Hãy chọn ít nhất một media'
                    : undefined
                }
                onClick={() =>
                  void run(() =>
                    deliveryApi.releasePreview(orderId, selected, notes),
                  )
                }
              >
                {busy ? 'Đang gửi…' : `Gửi preview (${selected.length})`}
              </button>
            </div>
          </section>
        ) : null}

        {delivery.deliveryStatus === 'CUSTOMER_REVIEW' ? (
          <StatusBanner
            title="Đã gửi bản xem trước"
            text="Đang chờ Customer xem và phản hồi kết quả."
          />
        ) : null}
        {delivery.deliveryStatus === 'FINAL_PAYMENT_PENDING' ? (
          <StatusBanner
            tone="warning"
            title="Customer đã chấp nhận kết quả"
            text="Đang chờ khách hàng hoàn tất khoản thanh toán còn lại."
          />
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_DELIVERY' ||
        delivery.deliveryStatus === 'PAYMENT_CONFIRMED' ? (
          <div className="delivery-next-action">
            <div>
              <span className="delivery-next-action__icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <b>Thanh toán đã được xác nhận</b>
                <span>Bản gốc đã sẵn sàng để phát hành cho Customer.</span>
              </div>
            </div>
            <button
              type="button"
              className="odm-btn odm-btn-p delivery-primary-action"
              disabled={busy}
              onClick={() =>
                void run(() => deliveryApi.releaseOriginals(orderId))
              }
            >
              {busy ? 'Đang bàn giao…' : 'Bàn giao bản gốc'}
            </button>
          </div>
        ) : null}
        {delivery.deliveryStatus === 'DELIVERED' ? (
          <StatusBanner
            tone="success"
            title="Bàn giao hoàn tất"
            text={`${delivery.assets.length} tệp gốc đã sẵn sàng cho Customer tải xuống.`}
          />
        ) : null}
        {error ? (
          <p className="delivery-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function MediaPreview({ asset }: { asset: Delivery['assets'][number] }) {
  return asset.type.toUpperCase().includes('VIDEO') ? (
    <video controls preload="metadata" src={asset.url} />
  ) : (
    <img src={asset.url} alt={asset.fileName} loading="lazy" />
  )
}

function StatusBanner({
  title,
  text,
  tone = 'info',
}: {
  title: string
  text: string
  tone?: 'info' | 'warning' | 'success'
}) {
  return (
    <div className={`delivery-banner delivery-banner--${tone}`} role="status">
      <span className="delivery-banner__icon" aria-hidden="true">
        {tone === 'success' ? '✓' : tone === 'warning' ? '!' : 'i'}
      </span>
      <div>
        <b>{title}</b>
        <span>{text}</span>
      </div>
    </div>
  )
}

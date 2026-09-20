import { useState } from 'react'

import { ErrorState, LoadingState } from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerApi } from '../api/customerApi'
import {
  fmtDate,
  fmtDateTime,
  MISSION_STATUS_META,
  ORDER_STATUS_META,
} from '../lib/orderStatus'
import { customerHref } from '../routes'

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getOrder(orderId, signal),
    [orderId],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const statusMeta = ORDER_STATUS_META[data.status]
  const canCancel = data.status === 'PENDING' || data.status === 'APPROVED'

  async function handleCancel() {
    if (!confirm('Bạn có chắc muốn huỷ đơn hàng này?')) return
    setCancelling(true)
    setCancelError(null)
    try {
      await customerApi.cancelOrder(orderId)
      reload()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra.'
      setCancelError(msg)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={customerHref({ screen: 'orders' })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          Đơn của tôi
        </a>{' '}
        / <span style={{ color: 'var(--tx)' }}>{data.orderCode}</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, flex: 1 }}>
          {data.title}
        </h1>
        <StatusBadge tone={statusMeta.tone} size="lg">
          {statusMeta.label}
        </StatusBadge>
      </div>

      {/* Rejection notice */}
      {data.approvalDecision === 'REJECTED' && data.approvalReason && (
        <div
          role="alert"
          style={{
            background: 'var(--red-muted, #fee2e2)',
            border: '1px solid var(--red-solid)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <strong>Lý do từ chối:</strong> {data.approvalReason}
        </div>
      )}

      {/* Detail card */}
      <div
        style={{
          background: 'var(--sf)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
          Thông tin đơn hàng
        </h2>
        <div className="odm-cus-detail-grid">
          <div>
            <div className="odm-cus-detail-label">Mã đơn</div>
            <div className="odm-cus-detail-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {data.orderCode}
            </div>
          </div>
          <div>
            <div className="odm-cus-detail-label">Ngày nộp</div>
            <div className="odm-cus-detail-value">{fmtDateTime(data.submittedAt)}</div>
          </div>
          <div>
            <div className="odm-cus-detail-label">Địa điểm</div>
            <div className="odm-cus-detail-value">{data.addressText ?? '—'}</div>
          </div>
          <div>
            <div className="odm-cus-detail-label">Ngày bay mong muốn</div>
            <div className="odm-cus-detail-value">
              {fmtDate(data.preferredDate)}
              {data.preferredTimeName ? ` · ${data.preferredTimeName}` : ''}
            </div>
          </div>
          {data.purpose && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="odm-cus-detail-label">Mục đích</div>
              <div className="odm-cus-detail-value">{data.purpose}</div>
            </div>
          )}
          {data.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="odm-cus-detail-label">Mô tả chi tiết</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{data.description}</div>
            </div>
          )}
          {data.serviceNames.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="odm-cus-detail-label">Dịch vụ</div>
              <div className="odm-cus-detail-value">{data.serviceNames.join(', ')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Missions */}
      {data.missions.length > 0 && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
            Các lần bay ({data.missions.length})
          </h2>
          <div className="odm-cus-timeline">
            {data.missions.map((m) => {
              const mMeta = MISSION_STATUS_META[m.status]
              const dotClass =
                m.status === 'COMPLETED'
                  ? 'done'
                  : m.status === 'FAILED' || m.status === 'CANCELLED'
                    ? 'error'
                    : m.status === 'IN_FLIGHT' || m.status === 'IN_PROGRESS'
                      ? 'active'
                      : ''
              return (
                <div key={m.id} className="odm-cus-timeline-item">
                  <div className={`odm-cus-timeline-dot ${dotClass}`} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        Lần {m.attemptNumber} · {m.missionCode}
                      </span>
                      <StatusBadge tone={mMeta.tone}>{mMeta.label}</StatusBadge>
                      {m.hasLive && (
                        <a
                          href={customerHref({ screen: 'live', orderId })}
                          style={{ fontSize: 11, color: 'var(--blue-solid)', textDecoration: 'none' }}
                        >
                          📡 Live
                        </a>
                      )}
                      {m.mediaCount > 0 && (
                        <a
                          href={customerHref({ screen: 'media', orderId })}
                          style={{ fontSize: 11, color: 'var(--blue-solid)', textDecoration: 'none' }}
                        >
                          📷 {m.mediaCount} file
                        </a>
                      )}
                    </div>
                    {m.scheduledStartAt && (
                      <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                        {fmtDateTime(m.scheduledStartAt)}
                        {m.scheduledEndAt ? ` → ${fmtDateTime(m.scheduledEndAt)}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {canCancel && (
          <button
            type="button"
            className="odm-btn odm-btn-de"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
          </button>
        )}
        <a
          href={customerHref({ screen: 'orders' })}
          className="odm-btn odm-btn-gh"
        >
          ← Quay lại
        </a>
      </div>

      {cancelError && (
        <div
          role="alert"
          style={{ marginTop: 10, fontSize: 13, color: 'var(--red-solid)' }}
        >
          {cancelError}
        </div>
      )}
    </div>
  )
}

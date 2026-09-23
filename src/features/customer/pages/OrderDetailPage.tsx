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

const VERDICT_TONE = { FEASIBLE: 'green', RISKY: 'yellow', INFEASIBLE: 'red' } as const
const VERDICT_LABEL = { FEASIBLE: 'Khả thi', RISKY: 'Có rủi ro', INFEASIBLE: 'Không khả thi' } as const

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAi, setShowAi] = useState(false)

  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getOrder(orderId, signal),
    [orderId],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const statusMeta = ORDER_STATUS_META[data.status]
  const canCancel = data.canCancel

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
            <div className="odm-cus-detail-value">
              {data.submittedAt ? fmtDateTime(data.submittedAt) : '—'}
            </div>
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

      {/* Approval card */}
      {data.approvalDecision === 'APPROVED' && (
        <div
          style={{
            background: 'var(--green-muted, #dcfce7)',
            border: '1px solid var(--green-solid)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            ✓ Đã được duyệt
            {data.approvalActorName ? ` bởi ${data.approvalActorName}` : ''}
            {data.approvalAt ? ` · ${fmtDateTime(data.approvalAt)}` : ''}
          </div>
          {data.approvalReason && (
            <div style={{ color: 'var(--tx2)' }}>{data.approvalReason}</div>
          )}
        </div>
      )}

      {/* AI summary collapsible */}
      {data.aiSummary && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--tx)',
              textAlign: 'left',
            }}
            onClick={() => setShowAi((v) => !v)}
          >
            <span>{showAi ? '▾' : '▸'}</span>
            <span>Kết quả phân tích AI</span>
            <StatusBadge tone={VERDICT_TONE[data.aiSummary.verdict]}>
              {VERDICT_LABEL[data.aiSummary.verdict]}
            </StatusBadge>
            <a
              href={customerHref({ screen: 'analysis', orderId })}
              style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--blue-solid)', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              Chi tiết →
            </a>
          </button>
          {showAi && (
            <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--tx2)' }}>
              {data.aiSummary.blockerCount > 0 && (
                <span style={{ marginRight: 12 }}>🚫 {data.aiSummary.blockerCount} blocker</span>
              )}
              {data.aiSummary.warningCount > 0 && (
                <span style={{ marginRight: 12 }}>⚠ {data.aiSummary.warningCount} cảnh báo</span>
              )}
              {data.aiSummary.blockerCount === 0 && data.aiSummary.warningCount === 0 && (
                <span>Không có vấn đề.</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status history collapsible */}
      {data.statusHistory.length > 0 && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--tx)',
              textAlign: 'left',
            }}
            onClick={() => setShowHistory((v) => !v)}
          >
            <span>{showHistory ? '▾' : '▸'}</span>
            <span>Lịch sử trạng thái</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--tx3)', marginLeft: 4 }}>
              {data.statusHistory.length} sự kiện
            </span>
          </button>
          {showHistory && (
            <div style={{ padding: '0 16px 16px' }}>
              <div className="odm-cus-timeline">
                {[...data.statusHistory].reverse().map((evt, i) => {
                  const meta = ORDER_STATUS_META[evt.status]
                  return (
                    <div key={i} className="odm-cus-timeline-item">
                      <div className="odm-cus-timeline-dot" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          {evt.actorName && (
                            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
                              bởi {evt.actorName}
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx3)', marginLeft: 'auto' }}>
                            {fmtDateTime(evt.at)}
                          </span>
                        </div>
                        {evt.note && (
                          <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>
                            {evt.note}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
                    {m.failureReason && (
                      <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                        ⚠ {m.failureReason}
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

import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import type { AiVerdict, FindingSeverity } from '../../../shared/types/domain'
import { customerApi } from '../api/customerApi'
import { customerHref } from '../routes'

const SEVERITY_TONE: Record<FindingSeverity, 'red' | 'yellow' | 'blue'> = {
  BLOCKER: 'red',
  WARNING: 'yellow',
  INFO: 'blue',
}

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  BLOCKER: 'Chặn',
  WARNING: 'Cảnh báo',
  INFO: 'Thông tin',
}

const VERDICT_TONE: Record<AiVerdict, 'green' | 'yellow' | 'red'> = {
  FEASIBLE: 'green',
  RISKY: 'yellow',
  INFEASIBLE: 'red',
}

const VERDICT_LABEL: Record<AiVerdict, string> = {
  FEASIBLE: 'Khả thi',
  RISKY: 'Có rủi ro',
  INFEASIBLE: 'Không khả thi',
}

export function AnalysisPage({ orderId }: { orderId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getAnalysis(orderId, signal),
    [orderId],
  )

  if (loading) return <LoadingState />
  if (error || !data)
    return (
      <div>
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
          <a
            href={customerHref({ screen: 'orderDetail', orderId })}
            style={{ color: 'var(--tx3)', textDecoration: 'none' }}
          >
            ← Quay lại đơn hàng
          </a>
        </div>
        <ErrorState error={error} onRetry={reload} />
      </div>
    )

  async function handleApply(findingId: string) {
    try {
      await customerApi.applyFindingSuggestion(orderId, findingId)
      reload()
    } catch (e) {
      console.error('apply finding error', e)
    }
  }

  async function handleIgnore(findingId: string) {
    try {
      await customerApi.ignoreFinding(orderId, findingId)
      reload()
    } catch (e) {
      console.error('ignore finding error', e)
    }
  }

  async function handleSubmit() {
    if (!confirm('Gửi đơn để quản lý duyệt?')) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await customerApi.submitOrder(orderId)
      window.location.hash = customerHref({ screen: 'orderDetail', orderId })
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Có lỗi xảy ra.')
      setSubmitting(false)
    }
  }

  const blockers = data.findings.filter((f) => f.severity === 'BLOCKER')
  const warnings = data.findings.filter((f) => f.severity === 'WARNING')
  const infos = data.findings.filter((f) => f.severity === 'INFO')
  const canSubmit = blockers.length === 0

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={customerHref({ screen: 'orderDetail', orderId })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          ← Quay lại đơn hàng
        </a>
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
          Phân tích AI
        </h1>
        <StatusBadge tone={VERDICT_TONE[data.verdict]} size="lg">
          {VERDICT_LABEL[data.verdict]}
        </StatusBadge>
      </div>

      {/* Summary row */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {data.blockerCount > 0 && (
          <div
            style={{
              background: 'var(--red-muted, #fee2e2)',
              border: '1px solid var(--red-solid)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--red-solid)',
            }}
          >
            🚫 {data.blockerCount} BLOCKER — không thể gửi duyệt
          </div>
        )}
        {data.warningCount > 0 && (
          <div
            style={{
              background: 'var(--yellow-muted, #fef9c3)',
              border: '1px solid var(--yellow-solid)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--yellow-solid)',
            }}
          >
            ⚠ {data.warningCount} Cảnh báo
          </div>
        )}
        {data.infoCount > 0 && (
          <div
            style={{
              background: 'var(--blue-muted, #eff6ff)',
              border: '1px solid var(--blue-solid)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--blue-solid)',
            }}
          >
            ℹ {data.infoCount} Thông tin
          </div>
        )}
      </div>

      {/* Findings list */}
      {data.findings.length === 0 ? (
        <EmptyState title="Không có điểm cần lưu ý" description="AI đánh giá yêu cầu hoàn toàn khả thi." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[...blockers, ...warnings, ...infos].map((f) => (
            <div
              key={f.id}
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--bd)',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  marginBottom: 8,
                }}
              >
                <StatusBadge tone={SEVERITY_TONE[f.severity]}>
                  {SEVERITY_LABEL[f.severity]}
                </StatusBadge>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--tx3)',
                    alignSelf: 'center',
                  }}
                >
                  {f.ruleCode}
                </span>
                {f.fieldRef && (
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--tx3)',
                      alignSelf: 'center',
                    }}
                  >
                    · {f.fieldRef}
                  </span>
                )}
              </div>

              <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.5 }}>{f.message}</p>

              {/* Evidence */}
              {Object.keys(f.evidence).length > 0 && (
                <div
                  style={{
                    background: 'var(--bg)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px 16px',
                  }}
                >
                  {Object.entries(f.evidence).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--tx3)' }}>{k}:</span>{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggestion actions */}
              {f.suggestionLabel && f.suggestionState === 'PENDING' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Gợi ý: {f.suggestionLabel}</span>
                  <button
                    type="button"
                    className="odm-btn odm-btn-p"
                    style={{ fontSize: 12, padding: '3px 10px' }}
                    onClick={() => handleApply(f.id)}
                  >
                    Áp dụng
                  </button>
                  <button
                    type="button"
                    className="odm-btn odm-btn-gh"
                    style={{ fontSize: 12, padding: '3px 10px' }}
                    onClick={() => handleIgnore(f.id)}
                  >
                    Bỏ qua
                  </button>
                </div>
              )}
              {f.suggestionState === 'ACCEPTED' && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--green-solid)',
                    fontWeight: 600,
                  }}
                >
                  ✓ Đã áp dụng gợi ý
                </span>
              )}
              {f.suggestionState === 'IGNORED' && (
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>— Bỏ qua</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit action */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {canSubmit ? (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang gửi...' : 'Gửi duyệt'}
          </button>
        ) : (
          <button type="button" className="odm-btn odm-btn-p" disabled>
            Gửi duyệt (cần giải quyết {data.blockerCount} BLOCKER)
          </button>
        )}
        <a
          href={customerHref({ screen: 'orderDetail', orderId })}
          className="odm-btn odm-btn-gh"
        >
          ← Quay lại
        </a>
      </div>

      {submitError && (
        <div role="alert" style={{ marginTop: 10, fontSize: 13, color: 'var(--red-solid)' }}>
          {submitError}
        </div>
      )}
    </div>
  )
}

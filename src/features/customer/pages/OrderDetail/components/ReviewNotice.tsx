import { useState } from 'react'

import { apiRequest } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { OrderDetailView } from '../../../lib/orders/types'
import { reviewNoticeMessages } from './ReviewNotice.messages'
import { LocationCorrectionForm } from './LocationCorrectionForm'

/** Result of the staff review (BE `rejectReason`, `reviewByName`, `reviewAt`). */
export function ReviewNotice({
  order,
  onInformationSubmitted,
}: {
  order: OrderDetailView
  onInformationSubmitted?: () => void
}) {
  const { t, locale } = useI18n(reviewNoticeMessages)
  const [information, setInformation] = useState('')
  const [siteContactName, setSiteContactName] = useState(order.siteContactName ?? '')
  const [siteContactPhone, setSiteContactPhone] = useState(order.siteContactPhone ?? '')
  const [accessNotes, setAccessNotes] = useState(order.accessNotes ?? '')
  const [monitoringRelationship, setMonitoringRelationship] = useState(order.monitoringRelationship ?? '')
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(Boolean(order.monitoringAuthorizationConfirmed))
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rejected = order.status === 'REJECTED'
  const needsInfo = order.status === 'NEEDS_INFO'
  const needsLocation = needsInfo && order.requestedUpdateScope === 'LOCATION'
  const reviewed = rejected || needsInfo || (order.status === 'APPROVED' && order.reviewAt)
  if (!reviewed) return null

  async function submitInformation() {
    if (!information.trim()) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(order.id)}/additional-information`, {
        method: 'POST',
        body: {
          information: information.trim(),
          siteContactName: siteContactName.trim(),
          siteContactPhone: siteContactPhone.trim(),
          accessNotes: accessNotes.trim(),
          monitoringRelationship: monitoringRelationship || null,
          monitoringAuthorizationConfirmed: authorizationConfirmed,
        },
      })
      setSent(true)
      onInformationSubmitted?.()
    } catch {
      setError(t.sendFailed)
      setBusy(false)
    }
  }

  const meta = [
    order.reviewByName ? t.by(order.reviewByName) : null,
    order.reviewAt ? fmtDateTime(order.reviewAt, locale) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={`od-notice ${rejected ? 'is-danger' : needsInfo ? 'is-warning' : 'is-success'}`} role={rejected ? 'alert' : 'status'}>
      <strong>{rejected ? t.rejected : needsInfo ? t.needsInfo : t.approved}</strong>
      {meta && <span className="od-notice-meta">{meta}</span>}
      {(rejected || needsInfo) && (
        <p>
          {t.reason}: {order.rejectReason || t.noReason}
        </p>
      )}
      {needsLocation && !sent ? (
        <LocationCorrectionForm
          order={order}
          onSaved={() => {
            setSent(true)
            onInformationSubmitted?.()
          }}
        />
      ) : needsInfo && !sent ? (
        <div className="od-additional-info-form">
          <strong>{t.supplementTitle}</strong>
          <div className="od-additional-info-grid">
            <label>
              <span>{t.contactName}</span>
              <input value={siteContactName} onChange={(event) => setSiteContactName(event.target.value)} />
            </label>
            <label>
              <span>{t.contactPhone}</span>
              <input value={siteContactPhone} onChange={(event) => setSiteContactPhone(event.target.value)} />
            </label>
            <label className="is-wide">
              <span>{t.accessNotes}</span>
              <input value={accessNotes} onChange={(event) => setAccessNotes(event.target.value)} />
            </label>
            <label className="is-wide">
              <span>{t.relationship}</span>
              <select value={monitoringRelationship} onChange={(event) => setMonitoringRelationship(event.target.value as typeof monitoringRelationship)}>
                <option value="">—</option>
                <option value="OWNER">Chủ sở hữu / Chủ đầu tư</option>
                <option value="AUTHORIZED_PERSON">Người được ủy quyền</option>
                <option value="CONTRACTOR">Nhà thầu / Đơn vị thi công</option>
                <option value="MANAGER_OR_SUPERVISOR">Đơn vị quản lý / Tư vấn giám sát</option>
                <option value="OTHER">Khác</option>
              </select>
            </label>
          </div>
          <label className="od-additional-info-confirm">
            <input type="checkbox" checked={authorizationConfirmed} onChange={(event) => setAuthorizationConfirmed(event.target.checked)} />
            <span>{t.authorization}</span>
          </label>
          <textarea
            rows={3}
            aria-label={t.informationPlaceholder}
            value={information}
            placeholder={t.informationPlaceholder}
            onChange={(event) => setInformation(event.target.value)}
          />
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            disabled={busy || !information.trim()}
            onClick={() => void submitInformation()}
          >
            {busy ? t.sending : t.sendInformation}
          </button>
          {error ? <span role="alert">{error}</span> : null}
        </div>
      ) : null}
      {needsInfo && sent ? <p>{t.sent}</p> : null}
    </div>
  )
}

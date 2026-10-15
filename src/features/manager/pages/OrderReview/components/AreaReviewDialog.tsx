import { useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import type { FlightAreaReviewStatus, OrderDetail } from '../../../types/orders'
import { AREA_REVIEW_STATUSES, type SavedAreaReview } from './areaReview'
import { areaReviewDialogMessages } from './AreaReviewDialog.messages'

export function AreaReviewDialog({
  order,
  initial,
  zoneCount,
  onClose,
  onSaved,
}: {
  order: OrderDetail
  initial: SavedAreaReview | null
  zoneCount: number
  onClose: () => void
  onSaved: (review: SavedAreaReview) => void
}) {
  const { t } = useI18n(areaReviewDialogMessages)
  const [status, setStatus] = useState<FlightAreaReviewStatus | null>(
    initial?.status === 'UNDETERMINED' ? null : (initial?.status ?? null),
  )
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const reasonRequired = status === 'UNSUITABLE'

  useEffect(() => {
    dialogRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function save() {
    if (!status) return setError(t.pickStatus)
    if (reasonRequired && !reason.trim()) return setError(t.pickReason)
    setSaving(true)
    setError('')
    try {
      const result = await ordersApi.saveFlightAreaReview(order.id, {
        status,
        reason: reason.trim() || null,
        note: note.trim() || null,
      })
      onSaved({
        status: result.flightAreaReviewStatus ?? status,
        requestedScopeFeasible: result.requestedScopeFeasible ?? null,
        reason: result.flightAreaReviewReason ?? (reason.trim() || null),
        note: result.flightAreaReviewNote ?? (note.trim() || null),
        reviewer: result.flightAreaReviewedByName ?? null,
        reviewedAt: result.flightAreaReviewedAt ?? new Date().toISOString(),
      })
    } catch {
      setError(t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="odm-mgr-modal-overlay">
      <div
        className="odm-mgr-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="area-review-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="odm-mgr-modal-head">
          <div>
            <div id="area-review-title" className="odm-mgr-modal-title">
              {t.title}
            </div>
            <div className="odm-mgr-review-hint">{t.hint}</div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            aria-label={t.close}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <div className="odm-or-area-modal-context">
            <b>{order.title || t.defaultContext}</b>
            <span>{t.zonesToCheck(zoneCount)}</span>
          </div>
          <div className="odm-or-area-review-options">
            {AREA_REVIEW_STATUSES.map((value) => (
              <label
                key={value}
                className={status === value ? 'is-selected' : ''}
              >
                <input
                  type="radio"
                  name="area-review"
                  checked={status === value}
                  onChange={() => {
                    setStatus(value)
                    setError('')
                  }}
                />
                <span>
                  <b>{t.options[value].label}</b>
                  <small>{t.options[value].hint}</small>
                </span>
              </label>
            ))}
          </div>
          {status === 'RESTRICTED' ? (
            <p className="odm-or-area-permission-note">{t.restrictedNote}</p>
          ) : null}
          {reasonRequired ? (
            <label className="odm-or-area-field">
              {t.reasonLabel}
              <select
                className="odm-inp"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                <option value="">{t.reasonPlaceholderOption}</option>
                {t.unsuitableReasons.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="odm-or-area-field">
            {t.noteLabel}
            <textarea
              className="odm-inp"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.notePlaceholder}
            />
          </label>
          {error ? (
            <p className="odm-or-area-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={saving}
            onClick={save}
          >
            {saving ? t.saving : t.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

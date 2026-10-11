import { useEffect, useRef, useState } from 'react'

import { env } from '../../../../config/env'
import { ordersApi } from '../../api/ordersApi'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import type { ApprovalDecision } from '../../types/orders'
import { OrderIcon } from './OrderIcon'

type ModalKind = 'reject' | 'info' | null
type ApproveResult = Awaited<ReturnType<typeof ordersApi.approve>>

/**
 * Sticky bottom action bar for the order review step: request more info,
 * reject, or approve & continue to scheduling. Owns the approve-confirm and
 * reject/need-info dialogs; the parent decides where to go afterwards.
 */
export function OrderApprovalActions({
  orderId,
  orderCode,
  t,
  onApproved,
  onDecisionDone,
  showApprove = true,
}: {
  orderId: string
  orderCode: string
  t: OrderReviewMessages
  onApproved: (result: ApproveResult) => void
  onDecisionDone: () => void
  showApprove?: boolean
}) {
  const [modal, setModal] = useState<ModalKind>(null)
  const infoDisabled = !env.useMockApi && import.meta.env.MODE !== 'test'

  return (
    <>
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">
          <span className="odm-or-actionbar-hint-icon">
            <OrderIcon name="info" size={18} />
          </span>
          <span>{t.actionHintNext}</span>
        </div>
        <div className="odm-or-actionbar-actions">
          <button
            type="button"
            className="odm-or-btn odm-or-btn-amber"
            disabled={infoDisabled}
            title={infoDisabled ? t.requestInfoDisabled : undefined}
            onClick={() => setModal('info')}
          >
            <OrderIcon name="alert" size={16} />
            {t.requestInfo}
          </button>
          <button
            type="button"
            className="odm-or-btn odm-or-btn-red"
            onClick={() => setModal('reject')}
          >
            <OrderIcon name="x" size={16} />
            {t.reject}
          </button>
          {showApprove ? (
            <ApproveButton orderId={orderId} t={t} onApproved={onApproved} />
          ) : null}
        </div>
      </div>

      {modal ? (
        <DecisionModal
          kind={modal}
          orderCode={orderCode}
          orderId={orderId}
          onClose={() => setModal(null)}
          onDone={onDecisionDone}
          t={t}
        />
      ) : null}
    </>
  )
}

function ApproveButton({
  orderId,
  t,
  onApproved,
}: {
  orderId: string
  t: OrderReviewMessages
  onApproved: (result: ApproveResult) => void
}) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const approveInFlightRef = useRef(false)

  async function handleApprove() {
    if (approveInFlightRef.current) return
    approveInFlightRef.current = true
    setBusy(true)
    setError(null)
    try {
      const result = await ordersApi.approve(orderId)
      onApproved(result)
    } catch {
      setError(t.approveFailed)
      setBusy(false)
      approveInFlightRef.current = false
    }
  }

  return (
    <>
      <button
        type="button"
        className="odm-or-btn odm-or-btn-primary"
        onClick={() => setConfirming(true)}
        disabled={busy}
      >
        <OrderIcon name="check" size={16} />
        {t.approveAndCreateMission}
        <OrderIcon name="chevron-right" size={16} />
      </button>
      {confirming ? (
        <div className="odm-mgr-modal-overlay">
          <div className="odm-mgr-modal-dialog" role="dialog" aria-modal="true">
            <div className="odm-mgr-modal-head">
              <div>
                <div className="odm-mgr-modal-title">{t.approveTitle}</div>
                <div className="odm-mgr-review-hint">{t.approveHint}</div>
              </div>
            </div>
            <div className="odm-mgr-modal-body">
              {t.approveChecklist.map((item) => (
                <div key={item} style={{ fontSize: 13, lineHeight: 1.7 }}>
                  ✓ {item}
                </div>
              ))}
            </div>
            <div className="odm-mgr-modal-footer">
              <button
                type="button"
                className="odm-btn"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                {t.approveCancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-ok"
                onClick={handleApprove}
                disabled={busy}
              >
                {busy ? t.approving : t.approveContinue}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {error ? <span className="odm-or-note-error">{error}</span> : null}
    </>
  )
}

function DecisionModal({
  kind,
  orderCode,
  orderId,
  onClose,
  onDone,
  t,
}: {
  kind: 'reject' | 'info'
  orderCode: string
  orderId: string
  onClose: () => void
  onDone: () => void
  t: OrderReviewMessages
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const chips = kind === 'reject' ? t.rejectReasonChips : t.infoReasonChips
  const decision: ApprovalDecision =
    kind === 'reject' ? 'REJECTED' : 'NEED_INFO'

  async function handleConfirm() {
    if (!reason.trim()) {
      setError(t.reasonRequired)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await ordersApi.submitApproval(orderId, { decision, reason })
      onDone()
    } catch {
      setError(t.submitFailed)
      setBusy(false)
    }
  }

  return (
    <div className="odm-mgr-modal-overlay">
      <div
        className="odm-mgr-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="odm-mgr-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="odm-mgr-modal-head">
          <div>
            <div id="odm-mgr-modal-title" className="odm-mgr-modal-title">
              {kind === 'reject'
                ? t.rejectModalTitle(orderCode)
                : t.infoModalTitle}
            </div>
            <div className="odm-mgr-review-hint">
              {kind === 'reject' ? t.rejectModalHint : t.infoModalHint}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label={t.close}
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <div className="odm-mgr-modal-chips">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="odm-mgr-modal-chip"
                onClick={() => setReason(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <label>
            <span className="odm-mgr-modal-label">
              {t.reasonLabel} <span style={{ color: 'var(--red-fg)' }}>*</span>
            </span>
            <textarea
              className="odm-inp"
              rows={4}
              placeholder={t.reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
            <div className="odm-mgr-review-hint">{t.reasonSavedHint}</div>
            {error ? <div className="odm-mgr-modal-error">{error}</div> : null}
          </label>
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className={
              kind === 'reject' ? 'odm-btn odm-btn-rd' : 'odm-btn odm-btn-yl'
            }
            onClick={handleConfirm}
            disabled={busy}
          >
            {kind === 'reject' ? t.confirmReject : t.sendRequest}
          </button>
        </div>
      </div>
    </div>
  )
}

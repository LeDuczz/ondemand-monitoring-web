import { useState } from 'react'

import { env } from '../../../../../config/env'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { ApproveButton, type ApproveResult } from './ApproveButton'
import { DecisionModal } from './DecisionModal'
import { useI18n } from '../../../../../shared/i18n'
import { orderApprovalActionsMessages } from './OrderApprovalActions.messages'

type ModalKind = 'reject' | 'info' | null

/**
 * Sticky bottom action bar for the order review step: request more info,
 * reject, or approve & continue to scheduling. Owns the approve-confirm and
 * reject/need-info dialogs; the parent decides where to go afterwards.
 */
export function OrderApprovalActions({
  orderId,
  orderCode,
  onApproved,
  onDecisionDone,
  showApprove = true,
}: {
  orderId: string
  orderCode: string
  onApproved: (result: ApproveResult) => void
  onDecisionDone: () => void
  showApprove?: boolean
}) {
  const { t } = useI18n(orderApprovalActionsMessages)

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
            <ApproveButton orderId={orderId} onApproved={onApproved} />
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
        />
      ) : null}
    </>
  )
}

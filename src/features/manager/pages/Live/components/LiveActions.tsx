import type { Dispatch, SetStateAction } from 'react'
import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { liveActionsMessages } from './LiveActions.messages'

/** Incident and emergency-cancel actions, kept apart with a danger tone. */
export function LiveActions({
  setShowIncidentModal,
  setShowCancelModal,
}: {
  setShowIncidentModal: Dispatch<SetStateAction<boolean>>
  setShowCancelModal: Dispatch<SetStateAction<boolean>>
}) {
  const { t } = useI18n(liveActionsMessages)
  return (
    <Card className="odm-live-actions" title={t.title}>
      <div className="odm-live-actions-body">
        <p className="odm-live-actions-help">{t.help}</p>
        <div className="odm-live-actions-buttons">
          <button
            type="button"
            className="odm-btn"
            onClick={() => setShowIncidentModal(true)}
          >
            {t.recordIncident}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            onClick={() => setShowCancelModal(true)}
          >
            {t.urgentCancel}
          </button>
        </div>
      </div>
    </Card>
  )
}

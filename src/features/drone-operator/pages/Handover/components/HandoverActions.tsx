import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import { handoverActionsMessages } from './HandoverActions.messages'

export function HandoverActions({
  missionId,
  canConfirm,
  submitting,
  onConfirm,
}: {
  missionId?: string
  canConfirm: boolean
  submitting: boolean
  onConfirm: () => void
}) {
  const { t } = useI18n(handoverActionsMessages)

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <a
          className="odm-btn"
          href={operatorHref({
            screen: 'preflight',
            missionId: missionId,
          })}
          style={{ minWidth: 150 }}
        >
          {t.back}
        </a>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          disabled={!canConfirm}
          onClick={onConfirm}
          style={{ flex: 1 }}
        >
          {submitting ? t.processing : t.confirmHandover}
        </button>
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--tx3)',
          textAlign: 'center',
        }}
      >
        {t.confirmLockedNote}
      </div>
    </>
  )
}

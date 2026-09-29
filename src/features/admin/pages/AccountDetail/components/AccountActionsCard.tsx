import { useI18n } from '../../../../../shared/i18n'
import { Card } from '../../../components/common/Card'
import { accountActionsCardMessages } from './AccountActionsCard.messages'

export function AccountActionsCard({
  inactive,
  loading,
  error,
  onDeactivate,
  onActivate,
}: {
  inactive: boolean
  loading: boolean
  error: string | null
  onDeactivate: () => void
  onActivate: () => void
}) {
  const { t } = useI18n(accountActionsCardMessages)

  return (
    <Card title={t.actions}>
      <p className="adm-card-hint">{t.deactivateHint}</p>

      {error && (
        <div role="alert" className="adm-alert is-danger">
          {error}
        </div>
      )}

      <div className="adm-row">
        {!inactive && (
          <button
            type="button"
            className="odm-btn is-danger"
            disabled={loading}
            onClick={onDeactivate}
          >
            {loading ? t.processing : t.deactivate}
          </button>
        )}
        {inactive && (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={loading}
            onClick={onActivate}
          >
            {loading ? t.processing : t.reactivate}
          </button>
        )}
      </div>
    </Card>
  )
}

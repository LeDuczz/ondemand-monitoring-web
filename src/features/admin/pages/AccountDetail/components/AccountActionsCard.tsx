import { useI18n } from '../../../../../shared/i18n'
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
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
        {t.actions}
      </h2>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--tx3)' }}>
        {t.deactivateHint}
      </p>

      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--red-muted, #fee2e2)',
            border: '1px solid var(--red-solid)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--red-solid)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!inactive && (
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            style={{
              borderColor: 'var(--red-solid)',
              color: 'var(--red-solid)',
              whiteSpace: 'normal',
            }}
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
            style={{ whiteSpace: 'normal' }}
            disabled={loading}
            onClick={onActivate}
          >
            {loading ? t.processing : t.reactivate}
          </button>
        )}
      </div>
    </div>
  )
}

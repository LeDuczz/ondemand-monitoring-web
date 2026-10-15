import { useI18n } from '../../../../../shared/i18n'
import { postflightSubmitButtonMessages } from './PostflightSubmitButton.messages'

export function PostflightSubmitButton({
  saving,
  allAssessed,
  failCount,
  onSubmit,
}: {
  saving: boolean
  allAssessed: boolean
  failCount: number
  onSubmit: () => void
}) {
  const { t } = useI18n(postflightSubmitButtonMessages)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 8,
      }}
    >
      <button
        type="button"
        className="odm-btn odm-btn-ok"
        disabled={saving || !allAssessed}
        onClick={onSubmit}
        style={{
          minWidth: 240,
          height: 46,
          fontSize: 15,
          fontWeight: 800,
          borderRadius: 10,
          background: !allAssessed
            ? '#94a3b8'
            : failCount > 0
              ? '#f59e0b'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          cursor: !allAssessed || saving ? 'not-allowed' : 'pointer',
          boxShadow: allAssessed
            ? '0 4px 14px rgba(16, 185, 129, 0.35)'
            : 'none',
          border: 'none',
        }}
      >
        {saving
          ? t.submitting
          : failCount > 0
            ? t.submitAndCreateTicket
            : t.completeFlight}
      </button>
    </div>
  )
}

import { useI18n } from '../../../../../shared/i18n'
import { successBannerMessages } from './SuccessBanner.messages'

export function SuccessBanner({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  const { t } = useI18n(successBannerMessages)

  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        fontSize: 13.5,
        fontWeight: 600,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        className="odm-btn"
        style={{ padding: '2px 8px', fontSize: 12 }}
        onClick={onClose}
      >
        {t.close}
      </button>
    </div>
  )
}

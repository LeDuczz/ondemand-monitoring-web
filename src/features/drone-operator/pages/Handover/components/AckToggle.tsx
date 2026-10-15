import { useI18n } from '../../../../../shared/i18n'
import { ackToggleMessages } from './AckToggle.messages'

export function AckToggle({
  ack,
  onToggle,
}: {
  ack: boolean
  onToggle: () => void
}) {
  const { t } = useI18n(ackToggleMessages)

  return (
    <button
      type="button"
      onClick={() => onToggle()}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 12,
        border: `2px solid ${ack ? 'var(--green-dot)' : 'var(--bd2)'}`,
        background: ack ? 'var(--green-bg)' : 'var(--sf)',
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: ack ? 'none' : '3px solid var(--bd2)',
          background: ack ? 'var(--green-solid)' : 'transparent',
          color: 'var(--green-on)',
        }}
      >
        {ack ? '✓' : null}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{t.ackLabel}</span>
    </button>
  )
}

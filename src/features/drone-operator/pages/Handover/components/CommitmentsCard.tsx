import { useI18n } from '../../../../../shared/i18n'
import { commitmentsCardMessages } from './CommitmentsCard.messages'

export function CommitmentsCard({
  checked,
  onToggle,
}: {
  checked: boolean[]
  onToggle: (index: number, value: boolean) => void
}) {
  const { t } = useI18n(commitmentsCardMessages)
  const COMMITMENTS = t.commitments

  return (
    <div className="odm-card">
      <div className="odm-card-body" style={{ padding: '18px 22px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
          {t.commitmentTitle}
        </div>
        <div
          className="odm-mono"
          style={{
            fontSize: 11.5,
            color: 'var(--tx3)',
            marginBottom: 12,
          }}
        >
          control_handover.acknowledgement_text
        </div>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {COMMITMENTS.map((text, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                fontSize: 13.5,
                lineHeight: 1.5,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  gap: 12,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={(e) => onToggle(i, e.target.checked)}
                  style={{ marginTop: 2, flex: 'none' }}
                />
                <span>{text}</span>
              </label>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

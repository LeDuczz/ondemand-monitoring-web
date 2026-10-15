import { useI18n } from '../../../../../shared/i18n'
import type { AvailabilityStatus } from '../../../lib/availabilitySlots'
import { modeSelectorMessages } from './ModeSelector.messages'

const MODE_CLASS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'odm-btn-ok',
  BUSY: '',
  OFF: 'odm-btn-rd',
}

export function ModeSelector({
  mode,
  selectionCount,
  onModeChange,
  onDeselect,
  onApply,
}: {
  mode: AvailabilityStatus
  selectionCount: number
  onModeChange: (mode: AvailabilityStatus) => void
  onDeselect: () => void
  onApply: () => void
}) {
  const { t } = useI18n(modeSelectorMessages)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--tx3)' }}>
        {t.declarePrefix}
      </span>
      {(['AVAILABLE', 'BUSY', 'OFF'] as AvailabilityStatus[]).map((m) => (
        <button
          key={m}
          type="button"
          className={`odm-btn odm-btn-sm ${mode === m ? MODE_CLASS[m] : ''}`}
          aria-pressed={mode === m}
          onClick={() => onModeChange(m)}
        >
          {t.modeLabel[m]}
        </button>
      ))}
      {selectionCount > 0 ? (
        <>
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
            {t.selectionCount(selectionCount)}
          </span>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={onDeselect}
          >
            {t.deselect}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-sm odm-btn-p"
            onClick={onApply}
          >
            {t.apply}
          </button>
        </>
      ) : null}
    </div>
  )
}

import { useI18n } from '../../../../../shared/i18n'
import { weekToolbarMessages } from './WeekToolbar.messages'

export function WeekToolbar({
  saving,
  dirty,
  onSave,
}: {
  saving: boolean
  dirty: boolean
  onSave: () => void
}) {
  const { t } = useI18n(weekToolbarMessages)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          aria-label={t.prevWeek}
        >
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t.weekLabel}</span>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          aria-label={t.nextWeek}
        >
          ›
        </button>
      </div>
      <button
        type="button"
        className="odm-btn odm-btn-p"
        onClick={onSave}
        disabled={saving || !dirty}
      >
        {saving ? t.saving : t.saveChanges}
      </button>
    </div>
  )
}

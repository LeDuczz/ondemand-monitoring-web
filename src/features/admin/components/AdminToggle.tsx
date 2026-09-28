import { useI18n } from '../../../shared/i18n'
import { adminToggleMessages } from './AdminToggle.messages'

export function AdminToggle({
  active,
  label,
  onToggle,
  disabled,
}: {
  active: boolean
  label: string
  onToggle: () => void
  disabled?: boolean
}) {
  const { t } = useI18n(adminToggleMessages)
  return (
    <button
      type="button"
      className={`odm-adm-toggle${active ? ' is-on' : ''}`}
      aria-label={`${active ? t.on : t.off} ${label}`}
      aria-pressed={active}
      onClick={onToggle}
      disabled={disabled}
    >
      <i />
    </button>
  )
}

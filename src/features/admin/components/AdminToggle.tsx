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
  return (
    <button
      type="button"
      className={`odm-adm-toggle${active ? ' is-on' : ''}`}
      aria-label={`${active ? 'Tắt' : 'Kích hoạt'} ${label}`}
      aria-pressed={active}
      onClick={onToggle}
      disabled={disabled}
    >
      <i />
    </button>
  )
}

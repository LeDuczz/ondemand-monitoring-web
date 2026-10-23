import { useI18n } from '../../../../shared/i18n'
import { commonMiscMessages } from './commonMisc.messages'

export function StaffStatusBadge() {
  const { t } = useI18n(commonMiscMessages)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: '#15803d',
        fontSize: 12,
        fontWeight: 650,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: '#16a34a',
        }}
      />
      {t.ready}
    </span>
  )
}

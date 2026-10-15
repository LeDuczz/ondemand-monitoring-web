import { useI18n } from '../../../../../shared/i18n'
import { flightOpeningShellMessages } from './FlightOpeningShell.messages'

export function FlightOpeningShell() {
  const { t } = useI18n(flightOpeningShellMessages)
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#020617',
        color: '#dbeafe',
      }}
    >
      <div style={{ textAlign: 'center', fontWeight: 800 }}>{t.opening}</div>
    </main>
  )
}

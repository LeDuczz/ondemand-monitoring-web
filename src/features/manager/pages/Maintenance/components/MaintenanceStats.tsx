import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function MaintenanceStats({
  unassignedCount,
  urgentCount,
  resolvedCount,
}: {
  unassignedCount: number
  urgentCount: number
  resolvedCount: number
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div
      style={{
        padding: '20px 24px',
        borderRadius: 14,
        background: '#0f172a',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#f8fafc',
          }}
        >
          {t.page.title}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
          {t.page.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {t.page.unassignedStat}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: unassignedCount > 0 ? '#f87171' : '#f8fafc',
            }}
          >
            {unassignedCount}
          </div>
        </div>

        <div
          style={{
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {t.page.urgentStat}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
            {urgentCount}
          </div>
        </div>

        <div
          style={{
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {t.page.resolvedStat}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>
            {resolvedCount}
          </div>
        </div>
      </div>
    </div>
  )
}

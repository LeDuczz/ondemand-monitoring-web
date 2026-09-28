import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import { PolicyTable } from '../components/operatingConfig/PolicyTable'
import { WeightsPanel } from '../components/operatingConfig/WeightsPanel'
import { NoFlyZonesTable } from '../components/operatingConfig/NoFlyZonesTable'
import { operatingConfigPageMessages } from './OperatingConfigPage.messages'

type Tab = 'policy' | 'nfz'

export function OperatingConfigPage() {
  const { t } = useI18n(operatingConfigPageMessages)
  const [tab, setTab] = useState<Tab>('policy')
  const { data: policyData } = useApiQuery(
    (signal) => adminApi.listPolicies(signal),
    [],
  )
  const { data: weightsData } = useApiQuery(
    (signal) => adminApi.listWeights(signal),
    [],
  )
  const { data: nfzData } = useApiQuery(
    (signal) => adminApi.listNoFlyZones(signal),
    [],
  )

  const policyCount =
    (policyData?.items.length ?? 0) + (weightsData?.items.length ?? 0)
  const nfzCount = nfzData?.items.length ?? 0

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.title}</h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
          {t.subtitle}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--bd)',
          marginBottom: 20,
        }}
      >
        {(['policy', 'nfz'] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: tab === tabKey ? 600 : 400,
              color: tab === tabKey ? 'var(--blue-solid)' : 'var(--tx2)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === tabKey ? 'var(--blue-solid)' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tabKey === 'policy' ? t.policyTab : t.nfzTab}
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9,
                background: 'var(--sf3)',
                color: 'var(--tx2)',
              }}
            >
              {tabKey === 'policy' ? policyCount : nfzCount}
            </span>
          </button>
        ))}
      </div>

      {tab === 'policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
              {t.operatingParams}
            </h2>
            <PolicyTable />
          </section>

          <section>
            <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
              {t.dispatchWeights}
            </h2>
            <WeightsPanel />
          </section>
        </div>
      )}

      {tab === 'nfz' && <NoFlyZonesTable />}
    </div>
  )
}

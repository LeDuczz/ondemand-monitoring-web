import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import { PolicyTable } from '../components/operatingConfig/PolicyTable'
import { WeightsPanel } from '../components/operatingConfig/WeightsPanel'
import { NoFlyZonesTable } from '../components/operatingConfig/NoFlyZonesTable'

type Tab = 'policy' | 'nfz'

export function OperatingConfigPage() {
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          Cấu hình vận hành
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
          Chính sách, trọng số gợi ý và vùng cấm bay
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
        {(['policy', 'nfz'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--blue-solid)' : 'var(--tx2)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--blue-solid)' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t === 'policy' ? 'Chính sách' : 'Vùng cấm bay'}
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9,
                background: 'var(--sf3)',
                color: 'var(--tx2)',
              }}
            >
              {t === 'policy' ? policyCount : nfzCount}
            </span>
          </button>
        ))}
      </div>

      {tab === 'policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
              Tham số vận hành
            </h2>
            <PolicyTable />
          </section>

          <section>
            <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
              Trọng số gợi ý nguồn lực
            </h2>
            <WeightsPanel />
          </section>
        </div>
      )}

      {tab === 'nfz' && <NoFlyZonesTable />}
    </div>
  )
}

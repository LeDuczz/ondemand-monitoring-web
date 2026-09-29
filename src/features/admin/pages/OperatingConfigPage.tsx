import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import { PolicyTable } from '../components/operatingConfig/PolicyTable'
import { WeightsPanel } from '../components/operatingConfig/WeightsPanel'
import { NoFlyZonesTable } from '../components/operatingConfig/NoFlyZonesTable'
import { operatingConfigPageMessages } from './OperatingConfigPage.messages'
import { PageHeader } from '../components/common/PageHeader'

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
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="odm-adm-tabs" role="tablist">
        {(['policy', 'nfz'] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={tab === tabKey}
            onClick={() => setTab(tabKey)}
            className={`odm-adm-tab${tab === tabKey ? ' is-active' : ''}`}
          >
            {tabKey === 'policy' ? t.policyTab : t.nfzTab}
            <span className="odm-adm-tab-count odm-mono">{tabKey === 'policy' ? policyCount : nfzCount}</span>
          </button>
        ))}
      </div>

      {tab === 'policy' && (
        <div className="adm-stack">
          <section>
            <h2 className="adm-section-title">{t.operatingParams}</h2>
            <PolicyTable />
          </section>

          <section>
            <h2 className="adm-section-title">{t.dispatchWeights}</h2>
            <WeightsPanel />
          </section>
        </div>
      )}

      {tab === 'nfz' && <NoFlyZonesTable />}
    </div>
  )
}

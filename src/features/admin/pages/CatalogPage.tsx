import { useState } from 'react'

import { ServicesTab } from '../components/catalog/ServicesTab'
import { TimeslotsTab } from '../components/catalog/TimeslotsTab'
import { StationsTab } from '../components/catalog/StationsTab'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import { catalogPageMessages } from './CatalogPage.messages'
import { PageHeader } from '../components/common/PageHeader'

type Tab = 'services' | 'timeslots' | 'stations'

export function CatalogPage() {
  const { t } = useI18n(catalogPageMessages)
  const [tab, setTab] = useState<Tab>('services')
  const [createSignal, setCreateSignal] = useState(0)
  const { data: services } = useApiQuery(
    (signal) => adminApi.listServices(signal),
    [],
  )
  const { data: timeslots } = useApiQuery(
    (signal) => adminApi.listTimeslots(signal),
    [],
  )
  const { data: stations } = useApiQuery(
    (signal) => adminApi.listStations(signal),
    [],
  )

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'services', label: t.services, count: services?.items.length ?? 0 },
    {
      key: 'timeslots',
      label: t.timeslots,
      count: timeslots?.items.length ?? 0,
    },
    { key: 'stations', label: t.stations, count: stations?.items.length ?? 0 },
  ]

  return (
    <div>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          tab !== 'services' ? (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={() => setCreateSignal((v) => v + 1)}
            >
              {t.addNew}
            </button>
          ) : undefined
        }
      />

      <div className="odm-adm-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`odm-adm-tab${tab === t.key ? ' is-active' : ''}`}
          >
            {t.label}
            <span className="odm-adm-tab-count odm-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'services' && <ServicesTab />}
      {tab === 'timeslots' && <TimeslotsTab createSignal={createSignal} />}
      {tab === 'stations' && <StationsTab createSignal={createSignal} />}
    </div>
  )
}

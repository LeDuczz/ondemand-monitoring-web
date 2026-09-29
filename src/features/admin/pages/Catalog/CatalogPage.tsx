import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { PageHeader } from '../../../../shared/components/ui'
import { catalogPageMessages } from './CatalogPage.messages'
import { ServicesTab } from './components/ServicesTab'
import { StationsTab } from './components/StationsTab'
import { TimeslotsTab } from './components/TimeslotsTab'

type Tab = 'services' | 'timeslots' | 'stations'

export function CatalogPage() {
  const { t } = useI18n(catalogPageMessages)
  const [tab, setTab] = useState<Tab>('services')

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'services', label: t.services },
    { key: 'timeslots', label: t.timeslots },
    { key: 'stations', label: t.stations },
  ]

  return (
    <div>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <div className="adm-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`adm-tab${tab === item.key ? ' is-active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'services' && <ServicesTab />}
      {tab === 'timeslots' && <TimeslotsTab />}
      {tab === 'stations' && <StationsTab />}
    </div>
  )
}

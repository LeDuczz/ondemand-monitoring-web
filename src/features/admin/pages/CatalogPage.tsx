import { useState } from 'react'

import { ServicesTab } from '../components/catalog/ServicesTab'
import { TimeslotsTab } from '../components/catalog/TimeslotsTab'
import { StationsTab } from '../components/catalog/StationsTab'

type Tab = 'services' | 'timeslots' | 'stations'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'services', label: 'Dich vu' },
  { key: 'timeslots', label: 'Khung gio' },
  { key: 'stations', label: 'Tram' },
]

export function CatalogPage() {
  const [tab, setTab] = useState<Tab>('services')

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Danh muc</h1>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--bd)', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--blue-solid)' : 'var(--tx2)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t.key ? 'var(--blue-solid)' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'services' && <ServicesTab />}
      {tab === 'timeslots' && <TimeslotsTab />}
      {tab === 'stations' && <StationsTab />}
    </div>
  )
}

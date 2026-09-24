import { useState } from 'react'

import { ServicesTab } from '../components/catalog/ServicesTab'
import { TimeslotsTab } from '../components/catalog/TimeslotsTab'
import { StationsTab } from '../components/catalog/StationsTab'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'

type Tab = 'services' | 'timeslots' | 'stations'

export function CatalogPage() {
  const [tab, setTab] = useState<Tab>('services')
  const [createSignal, setCreateSignal] = useState(0)
  const { data: services } = useApiQuery((signal) => adminApi.listServices(signal), [])
  const { data: timeslots } = useApiQuery((signal) => adminApi.listTimeslots(signal), [])
  const { data: stations } = useApiQuery((signal) => adminApi.listStations(signal), [])

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'services', label: 'Dịch vụ', count: services?.items.length ?? 0 },
    { key: 'timeslots', label: 'Khung giờ', count: timeslots?.items.length ?? 0 },
    { key: 'stations', label: 'Trạm', count: stations?.items.length ?? 0 },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Danh mục</h1>
          <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
            Dịch vụ, khung giờ ưu tiên và trạm xuất phát
          </div>
        </div>
        {tab !== 'services' && (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setCreateSignal((v) => v + 1)}
          >
            + Thêm mới
          </button>
        )}
      </div>

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

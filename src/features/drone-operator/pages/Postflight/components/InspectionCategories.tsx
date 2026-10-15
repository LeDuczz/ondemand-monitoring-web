import { useI18n } from '../../../../../shared/i18n'
import type {
  PostflightItemKey,
  PreflightItemResult,
} from '../../../types/mission'
import type { ResultsState } from '../postflightHelpers'
import { inspectionCategoriesMessages } from './InspectionCategories.messages'
import { InspectionItemRow } from './InspectionItemRow'

type PostflightCategoryDef = {
  title: string
  icon: string
  items: {
    key: PostflightItemKey
    label: string
    detail: string
    backendKeys: string[]
  }[]
}

export function InspectionCategories({
  results,
  onSetResult,
}: {
  results: ResultsState
  onSetResult: (key: PostflightItemKey, result: PreflightItemResult) => void
}) {
  const { t: messages } = useI18n(inspectionCategoriesMessages)
  const t = messages.categories
  /** Bilingual postflight categories. `key`/`backendKeys`/`icon` stay stable across languages. */
  const categories: PostflightCategoryDef[] = [
    {
      title: t.structure.title,
      icon: '🛡️',
      items: [
        {
          key: 'physical_condition_ok',
          ...t.structure.items.physical_condition_ok,
          backendKeys: ['a1', 'a2'],
        },
      ],
    },
    {
      title: t.power.title,
      icon: '⚡',
      items: [
        {
          key: 'motor_ok',
          ...t.power.items.motor_ok,
          backendKeys: ['p1', 'p2'],
        },
        { key: 'battery_ok', ...t.power.items.battery_ok, backendKeys: ['e1'] },
      ],
    },
    {
      title: t.sensors.title,
      icon: '📷',
      items: [
        { key: 'camera_ok', ...t.sensors.items.camera_ok, backendKeys: ['e2'] },
      ],
    },
    {
      title: t.gcs.title,
      icon: '📡',
      items: [
        { key: 'gps_ok', ...t.gcs.items.gps_ok, backendKeys: ['e3'] },
        {
          key: 'communication_ok',
          ...t.gcs.items.communication_ok,
          backendKeys: ['d1'],
        },
      ],
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {categories.map((cat) => (
        <div
          key={cat.title}
          style={{
            background: 'var(--sf, #fff)',
            border: '1.5px solid var(--bd, #e2e8f0)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--sf2, #f8fafc)',
              borderBottom: '1px solid var(--bd, #e2e8f0)',
              fontWeight: 700,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--tx, #1e293b)',
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.title}</span>
          </div>

          <div
            style={{
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {cat.items.map((item) => (
              <InspectionItemRow
                key={item.key}
                itemKey={item.key}
                label={item.label}
                detail={item.detail}
                status={results[item.key] ?? null}
                onSetResult={onSetResult}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

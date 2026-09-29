import { useEffect, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import type { DispatchWeight } from '../../types/operatingConfig'
import { weightsPanelMessages } from './WeightsPanel.messages'
import { Card } from '../common/Card'

function WeightGroup({
  group,
  label,
  items,
  onSave,
}: {
  group: 'DRONE' | 'OPERATOR'
  label: string
  items: DispatchWeight[]
  onSave: (weights: Array<{ key: string; value: number }>) => Promise<void>
}) {
  const { t } = useI18n(weightsPanelMessages)
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(items.map((w) => [w.key, w.value])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues(Object.fromEntries(items.map((w) => [w.key, w.value])))
  }, [items])

  const sum = Object.values(values).reduce((a, b) => a + b, 0)
  const isValid = sum === 100

  function handleReset() {
    setValues(Object.fromEntries(items.map((w) => [w.key, w.value])))
    setError(null)
  }

  async function handleSave() {
    if (!isValid) {
      setError(t.sumInvalid(sum))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const weights = Object.entries(values).map(([key, value]) => ({
        key,
        value,
      }))
      await onSave(weights)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title={t.groupTitle(label, group === 'DRONE' ? t.droneGroup : t.pilotGroup)}
    >
      {items.map((w) => (
        <div
          key={w.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, minWidth: 160, color: 'var(--tx)' }}>
            {w.label}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={values[w.key] ?? w.value}
            onChange={(e) =>
              setValues({ ...values, [w.key]: Number(e.target.value) })
            }
            style={{ flex: 1 }}
          />
          <span
            style={{
              minWidth: 36,
              textAlign: 'right',
              fontSize: 13,
              fontWeight: 600,
              color: isValid ? 'var(--green-solid)' : 'var(--red-solid)',
            }}
          >
            {values[w.key] ?? w.value}%
          </span>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: isValid ? 'var(--green-solid)' : 'var(--red-solid)',
            fontWeight: 600,
          }}
        >
          {t.total(sum, isValid)}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={handleReset}
          >
            {t.resetDefault}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={!isValid || saving}
            onClick={handleSave}
          >
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
      {error && (
        <p
          style={{ color: 'var(--red-solid)', fontSize: 12, margin: '8px 0 0' }}
        >
          {error}
        </p>
      )}
    </Card>
  )
}

export function WeightsPanel() {
  const { t } = useI18n(weightsPanelMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listWeights(signal),
    [],
  )

  if (loading) return <LoadingState />
  if (!loading && (error || !data))
    return <ErrorState error={error} onRetry={reload} />
  if (!data) return null

  const droneWeights = data.items.filter((w) => w.group === 'DRONE')
  const operatorWeights = data.items.filter((w) => w.group === 'OPERATOR')

  async function saveGroup(
    group: 'DRONE' | 'OPERATOR',
    weights: Array<{ key: string; value: number }>,
  ) {
    await adminApi.updateWeights({ group, weights })
    reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <WeightGroup
        group="DRONE"
        label={t.droneSuggestion}
        items={droneWeights}
        onSave={(w) => saveGroup('DRONE', w)}
      />
      <WeightGroup
        group="OPERATOR"
        label={t.pilotSuggestion}
        items={operatorWeights}
        onSave={(w) => saveGroup('OPERATOR', w)}
      />
    </div>
  )
}

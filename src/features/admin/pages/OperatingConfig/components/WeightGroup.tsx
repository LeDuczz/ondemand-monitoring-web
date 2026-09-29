import { useEffect, useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { Card } from '../../../../../shared/components/ui'
import type { DispatchWeight } from '../../../types/operatingConfig'
import { weightGroupMessages } from './WeightGroup.messages'

type Weights = Array<{ key: string; value: number }>

type Props = {
  group: 'DRONE' | 'OPERATOR'
  label: string
  items: DispatchWeight[]
  onSave: (weights: Weights) => Promise<void>
}

const toValues = (items: DispatchWeight[]) =>
  Object.fromEntries(items.map((w) => [w.key, w.value]))

export function WeightGroup({ group, label, items, onSave }: Props) {
  const { t } = useI18n(weightGroupMessages)
  const [values, setValues] = useState<Record<string, number>>(toValues(items))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setValues(toValues(items)), [items])

  const sum = Object.values(values).reduce((a, b) => a + b, 0)
  const isValid = sum === 100
  const tone = isValid ? 'is-ok' : 'is-bad'

  async function handleSave() {
    if (!isValid) {
      setError(t.sumInvalid(sum))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(Object.entries(values).map(([key, value]) => ({ key, value })))
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
        <div key={w.key} className="adm-weight-row">
          <span className="adm-weight-label adm-wrap">{w.label}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            aria-label={w.label}
            value={values[w.key] ?? w.value}
            onChange={(e) =>
              setValues({ ...values, [w.key]: Number(e.target.value) })
            }
          />
          <span className={`adm-weight-value ${tone}`}>
            {values[w.key] ?? w.value}%
          </span>
        </div>
      ))}
      <div className="adm-weight-footer">
        <span className={`adm-weight-total ${tone}`}>{t.total(sum, isValid)}</span>
        <div className="adm-row-actions">
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={() => {
              setValues(toValues(items))
              setError(null)
            }}
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
        <div role="alert" className="adm-alert is-danger">
          {error}
        </div>
      )}
    </Card>
  )
}

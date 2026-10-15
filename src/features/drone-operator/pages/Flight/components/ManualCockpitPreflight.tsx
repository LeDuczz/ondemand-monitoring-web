import { useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { manualCockpitPreflightMessages } from './ManualCockpitPreflight.messages'

const manualPreflightItems = [
  { key: 'drone' },
  { key: 'gps' },
  { key: 'battery' },
  { key: 'propeller' },
  { key: 'area' },
] as const

export function ManualCockpitPreflight({
  missionLabel,
  deviceLabel,
  onReady,
}: {
  missionLabel: string
  deviceLabel: string
  onReady: () => void | Promise<void>
}) {
  const { t } = useI18n(manualCockpitPreflightMessages)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const doneCount = manualPreflightItems.filter(
    (item) => checked[item.key],
  ).length
  const allDone = doneCount === manualPreflightItems.length

  async function handleContinue() {
    if (!allDone || submitting) return
    setSubmitting(true)
    try {
      await onReady()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="satellite-manual-preflight">
      <div className="satellite-manual-preflight__header">
        <div>
          <p>{t.title}</p>
          <h2>{missionLabel}</h2>
          <span>{deviceLabel}</span>
        </div>
        <strong>
          {doneCount}/{manualPreflightItems.length}
        </strong>
      </div>
      <div className="satellite-manual-preflight__list">
        {manualPreflightItems.map((item) => (
          <label key={item.key} className="satellite-manual-preflight__item">
            <input
              type="checkbox"
              checked={checked[item.key] === true}
              onChange={(event) =>
                setChecked((current) => ({
                  ...current,
                  [item.key]: event.target.checked,
                }))
              }
            />
            <span>{t.items[item.key]}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="satellite-manual-preflight__button"
        disabled={!allDone || submitting}
        onClick={handleContinue}
      >
        {submitting ? t.continuing : t.skip}
      </button>
    </div>
  )
}

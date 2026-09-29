import { useEffect, useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import type { StatusTone } from '../../../../shared/types/domain'
import { timeslotsTabMessages } from './TimeslotsTab.messages'
import { TableCard } from '../common/TableCard'

function timeslotStatus(
  effectiveFrom: string,
  effectiveTo: string | null,
  t: (typeof timeslotsTabMessages)['vi'],
): { label: string; tone: StatusTone } {
  const now = new Date()
  const from = new Date(effectiveFrom)
  if (effectiveTo && new Date(effectiveTo) < now)
    return { label: t.expired, tone: 'gray' }
  if (from > now) return { label: t.upcoming, tone: 'blue' }
  return { label: t.inEffect, tone: 'green' }
}

export function TimeslotsTab({ createSignal }: { createSignal: number }) {
  const { t } = useI18n(timeslotsTabMessages)
  const [showCreate, setShowCreate] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('06:00')
  const [endTime, setEndTime] = useState('18:00')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    data,
    loading: fetching,
    error: fetchError,
    reload,
  } = useApiQuery((signal) => adminApi.listTimeslots(signal), [])

  useEffect(() => {
    if (createSignal > 0) setShowCreate(true)
  }, [createSignal])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminApi.createTimeslot({
        code,
        name,
        startTime,
        endTime,
        effectiveFrom,
      })
      setShowCreate(false)
      setCode('')
      setName('')
      setEffectiveFrom('')
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {showCreate && (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'var(--sf2)',
            border: '1px solid var(--bd)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {t.createTitle}
          </h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                code *
              </label>
              <input
                className="odm-input odm-mono"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MORNING"
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                {t.name}
              </label>
              <input
                className="odm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                {t.start}
              </label>
              <input
                className="odm-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                {t.end}
              </label>
              <input
                className="odm-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                effective_from *
              </label>
              <input
                className="odm-input"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
              />
            </div>
          </div>
          {error && (
            <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              onClick={() => setShowCreate(false)}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="odm-btn odm-btn-p"
              disabled={loading}
            >
              {loading ? t.creating : t.create}
            </button>
          </div>
        </form>
      )}

      {fetching && <LoadingState />}
      {!fetching && (fetchError || !data) && (
        <ErrorState error={fetchError} onRetry={reload} />
      )}
      {!fetching && data && (
        <TableCard>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>code</th>
                <th>{t.timeslot}</th>
                <th>version</th>
                <th>effective_from</th>
                <th>effective_to</th>
                <th>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ts) => {
                const st = timeslotStatus(ts.effectiveFrom, ts.effectiveTo, t)
                return (
                  <tr key={ts.id}>
                    <td className="odm-mono" style={{ fontWeight: 700 }}>
                      {ts.code}
                    </td>
                    <td className="odm-mono">
                      {ts.startTime}–{ts.endTime}
                    </td>
                    <td>
                      <span className="odm-adm-chip">v{ts.version}</span>
                    </td>
                    <td className="odm-mono">{ts.effectiveFrom}</td>
                    <td className="odm-mono">{ts.effectiveTo ?? '—'}</td>
                    <td>
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  )
}

import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { StatusTone } from '../../../../shared/types/domain'

function timeslotStatus(effectiveFrom: string, effectiveTo: string | null): { label: string; tone: StatusTone } {
  const now = new Date()
  const from = new Date(effectiveFrom)
  if (effectiveTo && new Date(effectiveTo) < now) return { label: 'Da het', tone: 'gray' }
  if (from > now) return { label: 'Sap toi', tone: 'blue' }
  return { label: 'Dang hieu luc', tone: 'green' }
}

export function TimeslotsTab() {
  const [showCreate, setShowCreate] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('06:00')
  const [endTime, setEndTime] = useState('18:00')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data, loading: fetching, error: fetchError, reload } = useApiQuery(
    (signal) => adminApi.listTimeslots(signal),
    [],
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminApi.createTimeslot({ code, name, startTime, endTime, effectiveFrom })
      setShowCreate(false)
      setCode('')
      setName('')
      setEffectiveFrom('')
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loi khi tao khung gio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={() => setShowCreate((v) => !v)}
        >
          + Tao phien ban moi
        </button>
      </div>

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
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Tao phien ban khung gio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ma code *</label>
              <input className="odm-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MORNING" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ten *</label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Khung sang" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Bat dau</label>
              <input className="odm-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ket thuc</label>
              <input className="odm-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Hieu luc tu *</label>
              <input className="odm-input" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
            </div>
          </div>
          {error && <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="odm-btn odm-btn-gh" onClick={() => setShowCreate(false)}>Huy</button>
            <button type="submit" className="odm-btn odm-btn-p" disabled={loading}>
              {loading ? 'Dang tao...' : 'Tao phien ban'}
            </button>
          </div>
        </form>
      )}

      {fetching && <LoadingState />}
      {!fetching && (fetchError || !data) && <ErrorState error={fetchError} onRetry={reload} />}
      {!fetching && data && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Ten</th>
                <th>Version</th>
                <th>Khung gio</th>
                <th>Hieu luc tu</th>
                <th>Hieu luc den</th>
                <th>Trang thai</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ts) => {
                const st = timeslotStatus(ts.effectiveFrom, ts.effectiveTo)
                return (
                  <tr key={ts.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{ts.code}</td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{ts.name}</td>
                    <td style={{ fontSize: 12 }}>v{ts.version}</td>
                    <td style={{ fontSize: 12 }}>{ts.startTime} – {ts.endTime}</td>
                    <td style={{ fontSize: 12 }}>{ts.effectiveFrom}</td>
                    <td style={{ fontSize: 12 }}>{ts.effectiveTo ?? '—'}</td>
                    <td><StatusBadge tone={st.tone}>{st.label}</StatusBadge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

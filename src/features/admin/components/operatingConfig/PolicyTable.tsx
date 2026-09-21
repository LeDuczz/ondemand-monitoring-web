import { useState } from 'react'

import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { OperatingPolicy } from '../../types/operatingConfig'

export function PolicyTable() {
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listPolicies(signal),
    [],
  )
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function handleSave(policy: OperatingPolicy) {
    const newVal = editing[policy.id]
    if (newVal === undefined || newVal === policy.value) {
      const next = { ...editing }
      delete next[policy.id]
      setEditing(next)
      return
    }
    setSaving(policy.id)
    try {
      await adminApi.updatePolicy(policy.id, { value: newVal })
      const next = { ...editing }
      delete next[policy.id]
      setEditing(next)
      reload()
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <LoadingState />
  if (!loading && (error || !data)) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null

  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
      <table className="odm-adm-table">
        <thead>
          <tr>
            <th>Tham số</th>
            <th>Mô tả</th>
            <th>Giá trị</th>
            <th>Đơn vị</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((policy) => {
            const isDirty = editing[policy.id] !== undefined && editing[policy.id] !== policy.value
            const val = editing[policy.id] ?? policy.value
            return (
              <tr key={policy.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{policy.key}</td>
                <td style={{ fontSize: 12, color: 'var(--tx2)', maxWidth: 240 }}>{policy.description}</td>
                <td>
                  <input
                    className="odm-input"
                    value={val}
                    onChange={(e) => setEditing({ ...editing, [policy.id]: e.target.value })}
                    style={{ width: 80, padding: '3px 8px', fontSize: 13 }}
                  />
                </td>
                <td style={{ fontSize: 12, color: 'var(--tx3)' }}>{policy.unit}</td>
                <td>
                  {isDirty && (
                    <button
                      type="button"
                      className="odm-btn odm-btn-p"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      disabled={saving === policy.id}
                      onClick={() => handleSave(policy)}
                    >
                      {saving === policy.id ? '...' : 'Lưu'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

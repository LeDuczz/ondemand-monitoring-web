import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { RuleSeverity, RuleCategory } from '../../types/aiKnowledge'
import type { StatusTone } from '../../../../shared/types/domain'

const CATEGORY_TONE: Record<RuleCategory, StatusTone> = {
  SCHEDULE: 'blue',
  GEO: 'orange',
  CAPABILITY: 'yellow',
  SAFETY: 'red',
}

export function RulesTab() {
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listRules(signal),
    [],
  )
  const [editing, setEditing] = useState<
    Record<string, { severity?: RuleSeverity; weight?: number }>
  >({})
  const [saving, setSaving] = useState<string | null>(null)

  async function handleSave(ruleId: string) {
    const payload = editing[ruleId]
    if (!payload) return
    setSaving(ruleId)
    try {
      await adminApi.updateRule(ruleId, payload)
      const next = { ...editing }
      delete next[ruleId]
      setEditing(next)
      reload()
    } finally {
      setSaving(null)
    }
  }

  async function handleToggle(ruleId: string, isActive: boolean) {
    await adminApi.updateRule(ruleId, { isActive: !isActive })
    reload()
  }

  if (loading) return <LoadingState />
  if (!loading && (error || !data))
    return <ErrorState error={error} onRetry={reload} />
  if (!data) return null

  return (
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <table className="odm-adm-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Tên luật</th>
            <th>Loại</th>
            <th>Mức độ</th>
            <th>Trọng số</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((rule) => {
            const edit = editing[rule.id] ?? {}
            const severity = (edit.severity ?? rule.severity) as RuleSeverity
            const weight = edit.weight ?? rule.weight
            const isDirty = Boolean(editing[rule.id])
            return (
              <tr key={rule.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {rule.code}
                </td>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{rule.name}</td>
                <td>
                  <StatusBadge tone={CATEGORY_TONE[rule.category]}>
                    {rule.category}
                  </StatusBadge>
                </td>
                <td>
                  <select
                    className="odm-input"
                    value={severity}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [rule.id]: {
                          ...edit,
                          severity: e.target.value as RuleSeverity,
                        },
                      })
                    }
                    style={{ padding: '2px 6px', fontSize: 12, width: 'auto' }}
                  >
                    <option value="BLOCKER">BLOCKER</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    className="odm-input"
                    value={weight}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [rule.id]: { ...edit, weight: Number(e.target.value) },
                      })
                    }
                    style={{ width: 60, padding: '2px 6px', fontSize: 12 }}
                    min={0}
                    max={100}
                  />
                </td>
                <td>
                  <StatusBadge tone={rule.isActive ? 'green' : 'gray'}>
                    {rule.isActive ? 'Bật' : 'Tắt'}
                  </StatusBadge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {isDirty && (
                      <button
                        type="button"
                        className="odm-btn odm-btn-p"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        disabled={saving === rule.id}
                        onClick={() => handleSave(rule.id)}
                      >
                        {saving === rule.id ? '...' : 'Lưu'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => handleToggle(rule.id, rule.isActive)}
                    >
                      {rule.isActive ? 'Tắt' : 'Bật'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

import { useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import type { DocStatus, RuleSeverity, RuleCategory } from '../types/aiKnowledge'
import type { StatusTone } from '../../../shared/types/domain'

type Tab = 'docs' | 'rules'

const DOC_STATUS_TONE: Record<DocStatus, StatusTone> = {
  INDEXED: 'green',
  PENDING: 'yellow',
  FAILED: 'red',
}
const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  INDEXED: 'Đã index',
  PENDING: 'Chờ xử lý',
  FAILED: 'Thất bại',
}
const CATEGORY_TONE: Record<RuleCategory, StatusTone> = {
  SCHEDULE: 'blue',
  GEO: 'orange',
  CAPABILITY: 'yellow',
  SAFETY: 'red',
}
function DocsTab() {
  const { data, loading, error, reload } = useApiQuery((signal) => adminApi.listDocs(signal), [])
  const [submitting, setSubmitting] = useState<string | null>(null)

  async function handleReindex(docId: string) {
    setSubmitting(docId)
    try {
      await adminApi.reindexDoc(docId)
      reload()
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div>
      <div
        style={{
          border: '2px dashed var(--bd)',
          borderRadius: 10,
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--tx3)',
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        Kéo thư mục hoặc nhấp để tải lên tài liệu (PDF, DOCX) — Tính năng sẽ sẵn sàng sau
      </div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}
      {!loading && data && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Phiên bản</th>
                <th>Hiệu lực từ</th>
                <th>Trạng thái</th>
                <th>Số chunk</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{doc.title}</td>
                  <td>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx3)' }}>{doc.docType}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>v{doc.version}</td>
                  <td style={{ fontSize: 12 }}>{doc.effectiveFrom}</td>
                  <td>
                    <StatusBadge tone={DOC_STATUS_TONE[doc.status]}>
                      {DOC_STATUS_LABEL[doc.status]}
                    </StatusBadge>
                  </td>
                  <td style={{ fontSize: 12, textAlign: 'center' }}>{doc.chunkCount ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      disabled={submitting === doc.id}
                      onClick={() => handleReindex(doc.id)}
                    >
                      {submitting === doc.id ? '...' : 'Index lại'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RulesTab() {
  const { data, loading, error, reload } = useApiQuery((signal) => adminApi.listRules(signal), [])
  const [editing, setEditing] = useState<Record<string, { severity?: RuleSeverity; weight?: number }>>({})
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
  if (!loading && (error || !data)) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null

  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
      <table className="odm-adm-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Tên luật</th>
            <th>Loại</th>
            <th>Mức độ</th>
            <th>Trong so</th>
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
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{rule.code}</td>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{rule.name}</td>
                <td>
                  <StatusBadge tone={CATEGORY_TONE[rule.category]}>{rule.category}</StatusBadge>
                </td>
                <td>
                  <select
                    className="odm-input"
                    value={severity}
                    onChange={(e) =>
                      setEditing({ ...editing, [rule.id]: { ...edit, severity: e.target.value as RuleSeverity } })
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
                      setEditing({ ...editing, [rule.id]: { ...edit, weight: Number(e.target.value) } })
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

export function AiKnowledgePage() {
  const [tab, setTab] = useState<Tab>('docs')

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Tri thức AI và luật</h1>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--bd)', marginBottom: 20 }}>
        {(['docs', 'rules'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--blue-solid)' : 'var(--tx2)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--blue-solid)' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {t === 'docs' ? 'Tài liệu' : 'Luật khả thi'}
          </button>
        ))}
      </div>
      {tab === 'docs' && <DocsTab />}
      {tab === 'rules' && <RulesTab />}
    </div>
  )
}

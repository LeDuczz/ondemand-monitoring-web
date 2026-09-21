import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import { AnalysisLogTab } from '../components/aiKnowledge/AnalysisLogTab'
import { DocsTab } from '../components/aiKnowledge/DocsTab'
import { RulesTab } from '../components/aiKnowledge/RulesTab'

type Tab = 'docs' | 'rules' | 'log'

const TAB_LABEL: Record<Tab, string> = {
  docs: 'Tài liệu',
  rules: 'Luật khả thi',
  log: 'Nhật ký phân tích',
}

export function AiKnowledgePage() {
  const [tab, setTab] = useState<Tab>('docs')
  const { data: docsData } = useApiQuery(
    (signal) => adminApi.listDocs(signal),
    [],
  )
  const { data: rulesData } = useApiQuery(
    (signal) => adminApi.listRules(signal),
    [],
  )
  const { data: logData } = useApiQuery(
    (signal) => adminApi.listAnalysisLogs(signal),
    [],
  )

  const counts: Record<Tab, number> = {
    docs: docsData?.items.length ?? 0,
    rules: rulesData?.items.length ?? 0,
    log: logData?.items.length ?? 0,
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          Tri thức AI và luật kiểm tra
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
          Tài liệu RAG, luật khả thi và nhật ký phân tích
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--bd)',
          marginBottom: 20,
        }}
      >
        {(['docs', 'rules', 'log'] as Tab[]).map((t) => (
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {TAB_LABEL[t]}
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9,
                background: 'var(--sf3)',
                color: 'var(--tx2)',
              }}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>
      {tab === 'docs' && <DocsTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'log' && <AnalysisLogTab />}
    </div>
  )
}

import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import { AnalysisLogTab } from '../components/aiKnowledge/AnalysisLogTab'
import { DocsTab } from '../components/aiKnowledge/DocsTab'
import { RulesTab } from '../components/aiKnowledge/RulesTab'
import { aiKnowledgePageMessages } from './AiKnowledgePage.messages'

type Tab = 'docs' | 'rules' | 'log'

export function AiKnowledgePage() {
  const { t } = useI18n(aiKnowledgePageMessages)
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.title}</h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
          {t.subtitle}
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
        {(['docs', 'rules', 'log'] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: tab === tabKey ? 600 : 400,
              color: tab === tabKey ? 'var(--blue-solid)' : 'var(--tx2)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === tabKey ? 'var(--blue-solid)' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.tabs[tabKey]}
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9,
                background: 'var(--sf3)',
                color: 'var(--tx2)',
              }}
            >
              {counts[tabKey]}
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

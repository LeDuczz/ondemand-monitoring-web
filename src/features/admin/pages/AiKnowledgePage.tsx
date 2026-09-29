import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import { AnalysisLogTab } from '../components/aiKnowledge/AnalysisLogTab'
import { DocsTab } from '../components/aiKnowledge/DocsTab'
import { RulesTab } from '../components/aiKnowledge/RulesTab'
import { aiKnowledgePageMessages } from './AiKnowledgePage.messages'
import { PageHeader } from '../components/common/PageHeader'

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
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="odm-adm-tabs" role="tablist">
        {(['docs', 'rules', 'log'] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={tab === tabKey}
            onClick={() => setTab(tabKey)}
            className={`odm-adm-tab${tab === tabKey ? ' is-active' : ''}`}
          >
            {t.tabs[tabKey]}
            <span className="odm-adm-tab-count odm-mono">{counts[tabKey]}</span>
          </button>
        ))}
      </div>

      {tab === 'docs' && <DocsTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'log' && <AnalysisLogTab />}
    </div>
  )
}

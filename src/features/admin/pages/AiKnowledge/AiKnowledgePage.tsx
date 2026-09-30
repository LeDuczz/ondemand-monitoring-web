import { useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { MockDataBadge } from '../../../../shared/components/ui'
import { PageHeader } from '../../../../shared/components/ui'
import { AnalysisLogTab } from './components/AnalysisLogTab'
import { DocsTab } from './components/DocsTab'
import { RulesTab } from './components/RulesTab'
import { aiKnowledgePageMessages } from './AiKnowledgePage.messages'

type Tab = 'docs' | 'rules' | 'log'

const TABS: Tab[] = ['docs', 'rules', 'log']

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
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={<MockDataBadge />}
      />
      <div className="adm-tabs" role="tablist">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`adm-tab${tab === key ? ' is-active' : ''}`}
          >
            {t.tabs[key]}
            <span className="adm-tab-count odm-mono">{counts[key]}</span>
          </button>
        ))}
      </div>
      {tab === 'docs' && <DocsTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'log' && <AnalysisLogTab />}
    </div>
  )
}

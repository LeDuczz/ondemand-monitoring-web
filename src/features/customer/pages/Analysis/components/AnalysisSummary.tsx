import { Card, StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { AnalysisView } from '../../../lib/analysis/types'
import { analysisSummaryMessages } from './AnalysisSummary.messages'

export function AnalysisSummary({ analysis }: { analysis: AnalysisView }) {
  const { t } = useI18n(analysisSummaryMessages)
  return (
    <>
      <div className="an-stats">
        <StatCard
          label={t.blockers}
          value={analysis.blockerCount}
          tone={analysis.blockerCount > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label={t.warnings}
          value={analysis.warningCount}
          tone={analysis.warningCount > 0 ? 'warning' : 'default'}
        />
        <StatCard label={t.infos} value={analysis.infoCount} />
      </div>
      {analysis.summary && (
        <Card title={t.summaryTitle}>
          <p className="an-summary-text">{analysis.summary}</p>
        </Card>
      )}
    </>
  )
}

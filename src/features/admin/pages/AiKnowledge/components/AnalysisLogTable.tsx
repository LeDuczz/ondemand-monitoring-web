import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge, type UiTone } from '../../../../../shared/components/ui'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AnalysisLog, AnalysisVerdict } from '../../../types/aiKnowledge'
import { analysisLogTableMessages } from './AnalysisLogTable.messages'

const VERDICT_TONE: Record<AnalysisVerdict, UiTone> = {
  FEASIBLE: 'success',
  RISKY: 'warning',
  INFEASIBLE: 'danger',
}

export function AnalysisLogTable({ items }: { items: AnalysisLog[] }) {
  const { t, lang } = useI18n(analysisLogTableMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.session}</th>
          <th>{t.orderId}</th>
          <th>{t.verdict}</th>
          <th>{t.blockerWarning}</th>
          <th>{t.ruleEngineMs}</th>
          <th>{t.llmTokens}</th>
          <th>{t.triggeredBy}</th>
          <th>{t.timestamp}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((log) => (
          <tr key={log.id}>
            <td className="adm-cell-mono adm-strong">{log.id}</td>
            <td className="adm-cell-mono">{log.orderId}</td>
            <td>
              <StatusBadge tone={VERDICT_TONE[log.overallVerdict]}>
                {t.verdicts[log.overallVerdict]}
              </StatusBadge>
            </td>
            <td>
              {log.blockerCount} / {log.warningCount}
            </td>
            <td>{log.ruleEngineMs} ms</td>
            <td>{log.llmTokens}</td>
            <td className="adm-wrap">{log.triggeredBy}</td>
            <td className="adm-muted">{fmtDateTime(log.createdAt, lang)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

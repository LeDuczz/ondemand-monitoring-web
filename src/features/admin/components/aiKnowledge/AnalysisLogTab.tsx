import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import { fmtDateTime } from '../../lib/accountStatus'
import type { AnalysisVerdict } from '../../types/aiKnowledge'
import type { StatusTone } from '../../../../shared/types/domain'

const VERDICT_TONE: Record<AnalysisVerdict, StatusTone> = {
  FEASIBLE: 'green',
  RISKY: 'orange',
  INFEASIBLE: 'red',
}
const VERDICT_LABEL: Record<AnalysisVerdict, string> = {
  FEASIBLE: 'Khả thi',
  RISKY: 'Rủi ro',
  INFEASIBLE: 'Không khả thi',
}

export function AnalysisLogTab() {
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listAnalysisLogs(signal),
    [],
  )

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
            <th>Session</th>
            <th>order_id</th>
            <th>overall_verdict</th>
            <th>Blocker / Warning</th>
            <th>rule_engine_ms</th>
            <th>llm_tokens</th>
            <th>triggered_by</th>
            <th>timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((log) => (
            <tr key={log.id}>
              <td
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {log.id}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--tx3)',
                }}
              >
                {log.orderId}
              </td>
              <td>
                <StatusBadge tone={VERDICT_TONE[log.overallVerdict]}>
                  {VERDICT_LABEL[log.overallVerdict]}
                </StatusBadge>
              </td>
              <td style={{ fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: 'var(--tx3)' }}>
                  {log.blockerCount}
                </span>
                {' / '}
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      log.warningCount > 0 ? 'var(--orange-fg)' : 'var(--tx3)',
                  }}
                >
                  {log.warningCount}
                </span>
              </td>
              <td style={{ fontSize: 12 }}>{log.ruleEngineMs} ms</td>
              <td style={{ fontSize: 12, textAlign: 'right' }}>
                {log.llmTokens}
              </td>
              <td style={{ fontSize: 12 }}>{log.triggeredBy}</td>
              <td style={{ fontSize: 11, color: 'var(--tx2)' }}>
                {fmtDateTime(log.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

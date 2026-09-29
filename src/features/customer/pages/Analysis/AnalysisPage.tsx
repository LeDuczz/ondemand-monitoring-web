import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { EmptyState } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import './Analysis.css'
import { AnalysisHeader } from './components/AnalysisHeader'
import { AnalysisSummary } from './components/AnalysisSummary'
import { FindingList } from './components/FindingList'
import { analysisPageMessages } from './AnalysisPage.messages'
import { useAnalysis } from './hooks/useAnalysis'

/** Latest AI analysis from `GET /api/orders/{id}/analysis/latest`. */
export function AnalysisPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(analysisPageMessages)
  const state = useAnalysis(orderId)
  const { analysis } = state

  if (state.loading && !state.loaded) return <LoadingState />
  if (!state.loaded) {
    return <ErrorState title={t.errorTitle} error={state.error} onRetry={state.reload} />
  }

  return (
    <div className="an-page">
      <AnalysisHeader orderId={orderId} analysis={analysis ?? null} />
      {analysis ? (
        <>
          <AnalysisSummary analysis={analysis} />
          <FindingList
            findings={state.findings}
            busyId={state.busyId}
            actionError={state.actionError}
            onDecide={(id, action) => void state.decide(id, action)}
          />
        </>
      ) : (
        <EmptyState
          title={t.noneTitle}
          description={t.noneDescription}
          action={
            <a
              className="odm-btn odm-btn-gh"
              href={customerHref({ screen: 'orderDetail', orderId })}
            >
              {t.backToOrder}
            </a>
          }
        />
      )}
    </div>
  )
}

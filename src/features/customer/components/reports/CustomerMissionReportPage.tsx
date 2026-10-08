import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import { customerHref } from '../../routes'
import { CustomerMissionCard } from './CustomerMissionCard'
import { CustomerMissionMediaGallery } from './CustomerMissionMediaGallery'
import { customerReportMessages } from './messages'
import './reports.css'

export function CustomerMissionReportPage({
  orderId,
  missionId,
}: {
  orderId: string
  missionId: string
}) {
  return (
    <CustomerMissionReportContent
      key={`${orderId}:${missionId}`}
      orderId={orderId}
      missionId={missionId}
    />
  )
}

export function CustomerMissionReportContent({
  orderId,
  missionId,
  showMedia = true,
}: {
  orderId: string
  missionId: string
  showMedia?: boolean
}) {
  const { t } = useI18n(customerReportMessages)
  const query = useApiQuery(
    (signal) => customerMissionReportApi.report(orderId, missionId, signal),
    [orderId, missionId],
  )
  // No report/checklist publication inference from Mission lifecycle or Order status.
  const report = query.error || query.loading ? undefined : query.data
  const siblings = useApiQuery(
    (signal) =>
      report
        ? customerMissionReportApi.list(orderId, signal)
        : Promise.resolve([]),
    [orderId, Boolean(report)],
  )
  return (
    <div className="cr-report">
      <a href={customerHref({ screen: 'orderDetail', orderId })}>{t.back}</a>
      <div className="cr-heading">
        <h1>{t.report}</h1>
        <button
          className="odm-btn odm-btn-gh"
          disabled={query.loading}
          onClick={query.reload}
        >
          {t.refresh}
        </button>
      </div>
      {query.loading && <p role="status">{t.loading}</p>}
      {query.error ? <p role="alert">{t.error}</p> : null}
      {report && (
        <>
          <CustomerMissionCard
            mission={report.mission}
            siblings={siblings.error ? [] : (siblings.data ?? [])}
            showLink={false}
          />
          {report.reportAvailable === true && report.result ? (
            <>
              <section className="cr-section">
                <h2>{t.resultSummary}</h2>
                <p className="cr-copy">
                  {report.result.summary || t.noSummary}
                </p>
              </section>
              <section className="cr-section" aria-label={t.checklist}>
                <h2>{t.checklist}</h2>
                {report.checklistItems.length === 0 ? (
                  <p>{t.emptyChecklist}</p>
                ) : (
                  <ol className="cr-checklist">
                    {report.checklistItems.map((item) => (
                      <li key={item.executionId}>
                        <h3>{item.content}</h3>
                        <p>
                          {t.execution[item.status]} ·{' '}
                          {t.assessment[item.assessment]}
                        </p>
                        {item.observation && (
                          <p className="cr-copy">{item.observation}</p>
                        )}
                        {item.status === 'UNABLE_TO_VERIFY' &&
                          item.unableToVerifyReason && (
                            <p className="cr-copy">
                              {item.unableToVerifyReason}
                            </p>
                          )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          ) : (
            <p>{t.unavailable}</p>
          )}
          {showMedia && (
            <CustomerMissionMediaGallery
              key={missionId}
              missionId={missionId}
              missionCode={report.mission.missionCode}
            />
          )}
        </>
      )}
    </div>
  )
}

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import { CustomerMissionCard } from './CustomerMissionCard'
import { customerReportMessages } from './messages'
import './reports.css'

export function CustomerOrderMissionsSection({ orderId }: { orderId: string }) {
  const { t } = useI18n(customerReportMessages)
  const query = useApiQuery(
    (signal) => customerMissionReportApi.list(orderId, signal),
    [orderId],
  )
  return (
    <section className="cr-section" aria-label={t.title}>
      <div className="cr-heading">
        <h2>{t.title}</h2>
        <button
          className="odm-btn odm-btn-gh"
          disabled={query.loading}
          onClick={query.reload}
        >
          {t.retry}
        </button>
      </div>
      {query.loading && <p role="status">{t.loading}</p>}
      {query.error ? (
        <p role="alert">{t.error}</p>
      ) : (
        query.data && (
          <>
            <div className="cr-metrics">
              <span>
                {t.total}: <strong>{query.data.length}</strong>
              </span>
              <span>
                {t.finished}:{' '}
                <strong>
                  {query.data.filter((m) => m.status === 'COMPLETED').length}
                </strong>
              </span>
              <span>
                {t.published}:{' '}
                <strong>
                  {query.data.filter((m) => m.reportAvailable).length}
                </strong>
              </span>
            </div>
            <p className="cr-note">{t.progressNote}</p>
            {query.data.length === 0 ? (
              <p>{t.empty}</p>
            ) : (
              <div className="cr-missions">
                {query.data.map((m) => (
                  <CustomerMissionCard
                    key={m.missionId}
                    mission={m}
                    siblings={query.data}
                  />
                ))}
              </div>
            )}
          </>
        )
      )}
    </section>
  )
}

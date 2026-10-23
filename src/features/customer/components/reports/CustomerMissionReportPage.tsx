import type { ReactNode } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { PageHeader } from '../../../../shared/components/ui'
import { getMissionStatusMeta } from '../../lib/orderStatus'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import { customerHref } from '../../routes'
import { CustomerMissionMediaGallery } from './CustomerMissionMediaGallery'
import { customerReportMessages } from './messages'
import './reports.css'

/** Fetches one mission report plus the sibling missions used for replacement links. */
export function useCustomerMissionReport(orderId: string, missionId: string) {
  const { t, locale } = useI18n(customerReportMessages)
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
  const published = report?.reportAvailable === true && Boolean(report.result)
  const status = report
    ? getMissionStatusMeta(
        report.mission.status,
        locale === 'en-US' ? 'en' : 'vi',
      )
    : null
  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || Number.isNaN(Date.parse(start))) return t.unscheduled
    const first = new Date(start)
    const last = end && !Number.isNaN(Date.parse(end)) ? new Date(end) : null
    const date = (value: Date) =>
      value.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    const time = (value: Date) =>
      value.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    return `${date(first)} · ${time(first)}${last ? (date(first) === date(last) ? `–${time(last)}` : ` → ${date(last)} · ${time(last)}`) : ''}`
  }
  return { orderId, missionId, query, report, siblings, published, status, formatPeriod }
}

export type CustomerMissionReportModel = ReturnType<typeof useCustomerMissionReport>

/** Loading / error blocks that sit in the main column. */
export function MissionReportState({ model }: { model: CustomerMissionReportModel }) {
  const { t } = useI18n(customerReportMessages)
  const { query } = model
  return (
    <>
      {query.loading && (
        <p role="status" className="cr-state">
          {t.loading}
        </p>
      )}
      {query.error ? (
        <p role="alert" className="cr-state is-error">
          {t.error}
        </p>
      ) : null}
    </>
  )
}

/** Publication status: the first thing the customer should see. */
export function MissionReportBanner({ model }: { model: CustomerMissionReportModel }) {
  const { t } = useI18n(customerReportMessages)
  if (!model.report) return null
  const { published } = model
  return (
    <section
      className={`cr-publication ${published ? 'is-published' : ''}`}
      role="status"
    >
      <span className="cr-publication-icon" aria-hidden="true">
        {published ? '✓' : '◷'}
      </span>
      <div>
        <h2>{published ? t.publicationPublished : t.publicationPending}</h2>
        <p>
          {published ? t.publicationPublishedNote : t.publicationPendingNote}
        </p>
      </div>
    </section>
  )
}

/** Result summary and read-only checklist (published reports only). */
export function MissionReportBody({ model }: { model: CustomerMissionReportModel }) {
  const { t } = useI18n(customerReportMessages)
  const { report, published } = model
  if (!report || !published || !report.result) return null
  return (
    <>
      <section className="cr-section">
        <h2>{t.monitoringResult}</h2>
        <p className="cr-copy">{report.result.summary || t.noSummary}</p>
      </section>
      <section className="cr-section" aria-label={t.checklist}>
        <h2>{t.checklist}</h2>
        {report.checklistItems.length === 0 ? (
          <p>{t.emptyChecklist}</p>
        ) : (
          <ol className="cr-checklist">
            {[...report.checklistItems]
              .sort(
                (a, b) =>
                  a.displayOrder - b.displayOrder ||
                  a.executionId.localeCompare(b.executionId),
              )
              .map((item) => (
                <li key={item.executionId}>
                  <div className="cr-checklist-title">
                    <span
                      aria-hidden="true"
                      className={`cr-check-icon ${item.status === 'UNABLE_TO_VERIFY' ? 'is-unverified' : ''}`}
                    >
                      {item.status === 'COMPLETED' ? '✓' : '—'}
                    </span>
                    <h3>{item.content}</h3>
                  </div>
                  <dl className="cr-checklist-meta">
                    <div>
                      <dt>{t.executionLabel}</dt>
                      <dd>{t.execution[item.status] || t.unknown}</dd>
                    </div>
                    <div>
                      <dt>{t.assessmentLabel}</dt>
                      <dd>{t.assessment[item.assessment] || t.unknown}</dd>
                    </div>
                  </dl>
                  {item.observation && (
                    <p className="cr-copy">{item.observation}</p>
                  )}
                  {item.status === 'UNABLE_TO_VERIFY' &&
                    item.unableToVerifyReason && (
                      <p className="cr-copy">{item.unableToVerifyReason}</p>
                    )}
                </li>
              ))}
          </ol>
        )}
      </section>
    </>
  )
}

/**
 * Facts card for the side column. `compact` drops scope and schedule when the
 * host page already shows them (mission history detail).
 */
export function MissionReportFacts({
  model,
  compact = false,
}: {
  model: CustomerMissionReportModel
  compact?: boolean
}) {
  const { t } = useI18n(customerReportMessages)
  const { report, published, siblings, formatPeriod, orderId, missionId } = model
  if (!report) return null
  return (
    <section className="cr-section cr-overview" aria-label={t.overview}>
      <h2>{t.overview}</h2>
      <dl className="cr-summary-grid">
        {!compact && (
          <>
            <div>
              <dt>{t.scope}</dt>
              <dd>{report.mission.scopeLabel || '—'}</dd>
            </div>
            <div>
              <dt>{t.schedule}</dt>
              <dd>
                {formatPeriod(
                  report.mission.scheduledStartAt,
                  report.mission.scheduledEndAt,
                )}
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>{t.publicationStatus}</dt>
          <dd>{published ? t.publishedLabel : t.unpublishedLabel}</dd>
        </div>
        {published && report.result && (
          <>
            <div>
              <dt>{t.actualPeriod}</dt>
              <dd>
                {formatPeriod(report.result.startedAt, report.result.endedAt)}
              </dd>
            </div>
            {report.result.durationSeconds != null && (
              <div>
                <dt>{t.duration}</dt>
                <dd>
                  {t.minutes(Math.ceil(report.result.durationSeconds / 60))}
                </dd>
              </div>
            )}
          </>
        )}
      </dl>
      {!siblings.error &&
        siblings.data
          ?.filter(
            (m) =>
              m.missionId === report.mission.replacesMissionId ||
              m.replacesMissionId === missionId,
          )
          .map((m) => (
            <p className="cr-note" key={m.missionId}>
              {m.missionId === report.mission.replacesMissionId
                ? t.replaces
                : t.replacedBy}{' '}
              <a
                href={customerHref({
                  screen: 'missionReport',
                  orderId,
                  missionId: m.missionId,
                })}
              >
                {m.missionCode}
              </a>
            </p>
          ))}
    </section>
  )
}

/** Header identity line: mission code, status badge, scope. */
export function MissionReportIdentity({ model }: { model: CustomerMissionReportModel }) {
  const { report, status } = model
  if (!report) return null
  return (
    <span className="cr-report-identity">
      <span className="odm-mono">{report.mission.missionCode}</span>
      {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      {report.mission.scopeLabel && <span>{report.mission.scopeLabel}</span>}
    </span>
  )
}

/** Two-column frame shared by the report page and mission history detail. */
export function MissionReportLayout({
  main,
  side,
}: {
  main: ReactNode
  side: ReactNode
}) {
  return (
    <div className="cr-layout">
      <div className="cr-main">{main}</div>
      <aside className="cr-side">{side}</aside>
    </div>
  )
}

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
  const model = useCustomerMissionReport(orderId, missionId)
  const { query, report } = model
  return (
    <div className="cr-report">
      <PageHeader
        back={
          <a href={customerHref({ screen: 'orderDetail', orderId })}>
            <span aria-hidden="true">← </span>
            {t.back}
          </a>
        }
        title={t.report}
        subtitle={<MissionReportIdentity model={model} />}
        actions={
          <button
            type="button"
            className="odm-btn odm-btn-gh cr-btn"
            disabled={query.loading}
            onClick={query.reload}
          >
            {t.refresh}
          </button>
        }
      />
      <MissionReportState model={model} />
      <MissionReportBanner model={model} />
      {report && (
        <MissionReportLayout
          main={
            <>
              <MissionReportBody model={model} />
              {showMedia && (
                <CustomerMissionMediaGallery
                  key={missionId}
                  missionId={missionId}
                  missionCode={report.mission.missionCode}
                />
              )}
            </>
          }
          side={<MissionReportFacts model={model} />}
        />
      )}
    </div>
  )
}

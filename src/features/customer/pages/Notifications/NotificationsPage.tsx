import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { Card, EmptyState, PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { Pager } from '../../components/common/Pager'
import { shortId } from '../../lib/media/mapMedia'
import { fmtDate } from '../../lib/orderStatus'
import { daysAgo, groupByDay, type DayGroup } from './groupByDay'
import { NotificationItem } from './components/NotificationItem'
import { useNotifications } from './hooks/useNotifications'
import './Notifications.css'
import { notificationsPageMessages } from './NotificationsPage.messages'

/** Media notifications from `GET /api/customer/media-notifications`. */
export function NotificationsPage() {
  const { t, locale } = useI18n(notificationsPageMessages)
  const list = useNotifications()

  const groups = groupByDay(list.items)
  const now = new Date()
  const dayLabel = ({ date }: DayGroup) => {
    if (!date) return t.unknownDay
    const diff = daysAgo(date, now)
    if (diff === 0) return t.today
    if (diff === 1) return t.yesterday
    return fmtDate(date.toISOString(), locale)
  }

  return (
    <div className="nt-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <button type="button" className="odm-btn odm-btn-gh" onClick={list.reload}>
            {t.refresh}
          </button>
        }
      />
      {list.loading && !list.loaded && <LoadingState />}
      {!list.loaded && !list.loading && (
        <ErrorState title={t.errorTitle} error={list.error} onRetry={list.reload} />
      )}
      {list.loaded && list.total === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {list.loaded && list.total > 0 && (
        <>
          {groups.map((group) => (
            <section key={group.key} className="nt-day" aria-labelledby={`nt-day-${group.key}`}>
              <h2 className="nt-day-title" id={`nt-day-${group.key}`}>
                {dayLabel(group)}
              </h2>
              <Card>
                <ul className="nt-list">
                  {group.items.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      missionLabel={list.labels[item.missionId] ?? shortId(item.missionId)}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
          <div className="nt-footer">
            <Pager
              page={list.page}
              totalPages={list.totalPages}
              totalItems={list.total}
              unit={t.unit}
              onPage={list.setPage}
            />
          </div>
        </>
      )}
    </div>
  )
}

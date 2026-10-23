import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { managerHref } from '../../../routes'
import type { ActionItem } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { actionItemRoute, formatDashboardDate } from '../dashboardHelpers'
import { useI18n } from '../../../../../shared/i18n'
import { Button } from '../../../../../shared/components/ui'

export function ActionListCard({ items }: { items: ActionItem[] }) {
  const { t } = useI18n(dashboardPageMessages)
  const a = t.actions
  return (
    <section className="odm-card odm-mgr-section">
      <div className="odm-card-header">{a.title}</div>
      {items.length === 0 ? (
        <div className="odm-mgr-empty-list">
          <div className="odm-mgr-empty-list-title">{a.empty}</div>
        </div>
      ) : (
        <ul className="odm-mgr-action-list">
          {items.map((item) => (
            <li key={item.id} className="odm-mgr-action-row">
              <span className={`odm-mgr-priority is-${(item.priority ?? 'MEDIUM').toLowerCase()}`}>{item.priority ?? 'MEDIUM'}</span>
              <div className="odm-mgr-action-text">
                <div className="odm-mgr-action-title">{item.title}</div>
                <div className="odm-mgr-action-subtitle">
                  {[item.orderCode ?? item.code, item.description ?? item.subtitle].filter(Boolean).join(' · ')}
                </div>
                {item.systemCalculatedAmount != null ? (
                  <div className="odm-mgr-action-price">{a.systemPrice}: {formatVnd(item.systemCalculatedAmount)}</div>
                ) : null}
              </div>
              <time className="odm-mgr-action-age" dateTime={item.createdAt}>{item.createdAt ? formatDashboardDate(item.createdAt) : ''}</time>
              <Button size="sm" href={managerHref(actionItemRoute(item))}>{item.actionType ? a[item.actionType] : a.view}</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

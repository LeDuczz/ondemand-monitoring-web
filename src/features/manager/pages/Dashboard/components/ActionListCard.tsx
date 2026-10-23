import { useState } from 'react'

import { Button, Card, EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ActionItem } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { actionItemRoute, formatAge, groupActionItems, statusLabel } from '../dashboardHelpers'

export function ActionListCard({ items, generatedAt }: { items: ActionItem[]; generatedAt: string }) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const a = t.actions
  const [filter, setFilter] = useState<string>('ALL')
  const groups = groupActionItems(items)
  const active = groups.find((g) => g.type === filter)
  const visible = active ? [active] : groups
  const typeLabel = (type: string) => a.types[type] ?? statusLabel(type)

  return (
    <Card title={a.title} actions={items.length > 0 ? <span className="odm-dash-count">{items.length}</span> : undefined}>
      {items.length === 0 ? (
        <EmptyState title={a.empty} />
      ) : (
        <>
          {groups.length > 1 ? (
            <div className="odm-dash-seg odm-dash-seg-wrap" role="group" aria-label={a.filterLabel}>
              <button type="button" className={filter === 'ALL' ? 'is-active' : ''}
                aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>
                {a.all} <span>{items.length}</span>
              </button>
              {groups.map((g) => (
                <button key={g.type} type="button" className={filter === g.type ? 'is-active' : ''}
                  aria-pressed={filter === g.type} onClick={() => setFilter(g.type)}>
                  {typeLabel(g.type)} <span>{g.items.length}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="odm-dash-actions">
            {visible.map((g) => (
              <section key={g.type} className="odm-dash-group">
                {groups.length > 1 && !active ? (
                  <h3 className="odm-dash-group-title">{typeLabel(g.type)} <span>{g.items.length}</span></h3>
                ) : null}
                <ul className="odm-dash-list">
                  {g.items.map((item) => (
                    <li key={item.id} className="odm-dash-row">
                      <span className={`odm-dash-dot is-${item.priority === 'HIGH' ? 'danger' : item.priority === 'LOW' ? 'neutral' : 'warning'}`} aria-hidden="true" />
                      <div className="odm-dash-row-main">
                        <div className="odm-dash-row-title">{item.title}</div>
                        <div className="odm-dash-row-meta">
                          {[item.orderCode ?? item.code, formatAge(item.createdAt, generatedAt, locale, t.age.now)].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <Button size="sm" variant="primary" href={managerHref(actionItemRoute(item))}>
                        {item.actionType ? a[item.actionType] : a.view}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

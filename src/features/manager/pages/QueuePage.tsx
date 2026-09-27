import { useMemo, useState } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import type { OrderCreateResponse } from '../types/orders'
import { ordersApi } from '../api/ordersApi'
import {
  formatWaitLabel,
  isOverdue,
  sortQueue,
  type QueueSortMode,
} from '../lib/queue'
import { managerHref } from '../routes'
import { queuePageMessages } from './QueuePage.messages'
import '../manager.css'

export function QueuePage({ now: nowProp }: { now?: Date } = {}) {
  const { t, lang, locale } = useI18n(queuePageMessages)
  const [now] = useState(() => nowProp ?? new Date())
  const [sortMode, setSortMode] = useState<QueueSortMode>('longestWait')
  const query = useApiQuery((signal) => ordersApi.getQueue(signal), [])

  const sortOptions: Array<{ value: QueueSortMode; label: string }> = [
    { value: 'longestWait', label: t.sortOptions.longestWait },
    { value: 'preferredDateAsc', label: t.sortOptions.preferredDateAsc },
  ]

  const overdueCount = useMemo(
    () => (query.data ?? []).filter((row) => isOverdue(now, row)).length,
    [query.data, now],
  )
  const visibleRows = useMemo(() => {
    const rows = query.data ?? []
    return sortQueue(rows, sortMode, now)
  }, [query.data, sortMode, now])

  if (query.loading) return <QueueSkeleton />

  if (query.error) {
    return (
      <div className="odm-mgr-dash">
        <QueueHeader onRefresh={query.reload} t={t} />
        <StateView
          state="error"
          title={t.loadError}
          error={query.error}
          onRetry={query.reload}
        />
      </div>
    )
  }

  const data = query.data ?? []

  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">
            {t.summary(data.length, overdueCount)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="odm-btn" href="#portal/staff/assignments">
            {t.missionsToAssign}
          </a>
          <button type="button" className="odm-btn" onClick={query.reload}>
            {t.refresh}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <StateView
          state="empty"
          title={t.emptyTitle}
          description={t.emptyDescription}
        />
      ) : (
        <>
          <div className="odm-mgr-queue-toolbar">
            <label className="odm-mgr-queue-sort">
              <span className="odm-visually-hidden">{t.sort}</span>
              <select
                className="odm-inp"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as QueueSortMode)}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="odm-card odm-mgr-queue-table-wrap">
            <table className="odm-table">
              <thead>
                <tr>
                  <th>{t.columns.orderCode}</th>
                  <th>{t.columns.customer}</th>
                  <th>{t.columns.service}</th>
                  <th>{t.columns.preferredDate}</th>
                  <th>{t.columns.waitTime}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row: OrderCreateResponse) => (
                  <tr key={row.id}>
                    <td>
                      <span className="odm-mono" style={{ fontWeight: 600 }}>
                        {row.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.customerName}</div>
                    </td>
                    <td>{row.serviceName}</td>
                    <td>
                      <span className="odm-tn">
                        {new Date(row.preferredDateFrom).toLocaleDateString(
                          locale,
                        )}{' '}
                        · {row.preferredTimeName}
                      </span>
                    </td>
                    <td>
                      <span
                        className="odm-tn"
                        style={{
                          fontWeight: 600,
                          color: isOverdue(now, row)
                            ? 'var(--red-fg)'
                            : 'var(--tx2)',
                        }}
                      >
                        {formatWaitLabel(now, row, lang)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        className="odm-btn odm-btn-p odm-btn-sm"
                        href={managerHref({
                          screen: 'orderReview',
                          orderId: row.id,
                        })}
                      >
                        {t.review}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function QueueHeader({
  onRefresh,
  t,
}: {
  onRefresh: () => void
  t: (typeof queuePageMessages)['vi']
}) {
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{t.title}</h1>
      </div>
      <button type="button" className="odm-btn" onClick={onRefresh}>
        {t.refresh}
      </button>
    </div>
  )
}

function QueueSkeleton() {
  const { t } = useI18n(queuePageMessages)
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <div className="odm-mgr-dash-head">
        <span className="odm-sk" style={{ width: 220, height: 24 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <span
            key={i}
            className="odm-sk"
            style={{ width: 90, height: 28, borderRadius: 14 }}
          />
        ))}
      </div>
      <div
        className="odm-card"
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className="odm-sk"
            style={{ width: '100%', height: 42 }}
          />
        ))}
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}

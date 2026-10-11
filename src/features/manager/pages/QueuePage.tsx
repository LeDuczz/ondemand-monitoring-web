import { useEffect } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { displayOrderCode } from '../../../shared/lib/orderCode'
import type { OrderCreateResponse } from '../types/orders'
import { ordersApi } from '../api/ordersApi'
import { localizeTimeslot } from '../lib/viLabels'
import { managerHref } from '../routes'
import { queuePageMessages } from './QueuePage.messages'
import '../manager.css'

export function QueuePage() {
  const { t, locale } = useI18n(queuePageMessages)
  const query = useApiQuery((signal) => ordersApi.getQueue(signal), [])

  useEffect(() => {
    const refresh = () => query.reload()
    window.addEventListener('focus', refresh)
    const interval = window.setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(interval)
    }
  }, [query.reload])

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
          <div className="odm-mgr-dash-date">{t.summary(data.length)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'missions' })}
            style={{ textDecoration: 'none' }}
          >
            {t.viewMissions}
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
          action={
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({ screen: 'missions' })}
              style={{ textDecoration: 'none' }}
            >
              {t.viewMissions}
            </a>
          }
        />
      ) : (
        <div className="odm-card odm-mgr-queue-table-wrap">
          <table className="odm-table">
            <thead>
              <tr>
                <th>{t.columns.orderCode}</th>
                <th>{t.columns.customer}</th>
                <th>{t.columns.service}</th>
                <th>{t.columns.preferredDate}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((row: OrderCreateResponse) => (
                <tr key={row.id}>
                  <td>
                    <span className="odm-mono" style={{ fontWeight: 600 }}>
                      {displayOrderCode(row.orderCode, row.id)}
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
                      · {localizeTimeslot(row.preferredTimeName)}
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

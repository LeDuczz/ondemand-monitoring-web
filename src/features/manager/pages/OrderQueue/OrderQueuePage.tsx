import { useEffect } from 'react'

import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { ordersApi } from '../../api/ordersApi'
import { orderQueuePageMessages } from './OrderQueuePage.messages'
import '../../manager.css'
import { QueueHeader } from './components/QueueHeader'
import { QueueSkeleton } from './components/QueueSkeleton'
import { QueueSummaryHeader } from './components/QueueSummaryHeader'
import { QueueEmptyState } from './components/QueueEmptyState'
import { QueueTable } from './components/QueueTable'

export function OrderQueuePage() {
  const { t } = useI18n(orderQueuePageMessages)
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
        <QueueHeader onRefresh={query.reload} />
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
      <QueueSummaryHeader data={data} onRefresh={query.reload} />

      {data.length === 0 ? <QueueEmptyState /> : <QueueTable data={data} />}
    </div>
  )
}

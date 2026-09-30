import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { EmptyState } from '../../../../shared/components/ui'
import { MockDataBadge } from '../../../../shared/components/ui'
import { PageHeader } from '../../../../shared/components/ui'
import { TableCard } from '../../../../shared/components/ui'
import type { AuditEntry } from '../../types/auditLog'
import { AuditDetailModal } from './components/AuditDetailModal'
import {
  AuditFilters,
  EMPTY_AUDIT_FILTERS,
  type AuditFilterState,
} from './components/AuditFilters'
import { AuditPager } from './components/AuditPager'
import { AuditTable } from './components/AuditTable'
import { auditLogPageMessages } from './AuditLogPage.messages'

const PAGE_SIZE = 10

export function AuditLogPage() {
  const { t } = useI18n(auditLogPageMessages)
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_AUDIT_FILTERS)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const [exported, setExported] = useState(false)

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminApi.listAuditLog(
        {
          action: filters.action || undefined,
          entityType: filters.entityType || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    [filters, page],
  )

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  return (
    <div>
      <PageHeader
        title={t.title}
        subtitle={
          <>
            {t.subtitle} <MockDataBadge />
          </>
        }
        actions={
          <button
            type="button"
            className="odm-btn"
            onClick={() => setExported(true)}
          >
            {t.exportCsv}
          </button>
        }
      />
      {exported && (
        <div role="status" className="adm-alert is-success">
          {t.exportSuccess}
        </div>
      )}
      <AuditFilters
        value={filters}
        onChange={(next) => {
          setFilters(next)
          setPage(1)
        }}
      />
      {loading && !data && <LoadingState />}
      {!loading && !data && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.items.length > 0 && (
        <TableCard
          footer={
            <AuditPager
              page={page}
              totalPages={totalPages}
              total={data.total}
              onPage={setPage}
            />
          }
        >
          <AuditTable items={data.items} onView={setSelected} />
        </TableCard>
      )}
      {selected && (
        <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

import { useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import { fmtDateTime } from '../lib/accountStatus'
import type { AuditAction, AuditEntry } from '../types/auditLog'
import type { StatusTone } from '../../../shared/types/domain'

const ACTION_TONE: Record<AuditAction, StatusTone> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  APPROVE: 'orange',
  STATUS_CHANGE: 'yellow',
}

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  APPROVE: 'Phê duyệt',
  STATUS_CHANGE: 'Đổi trạng thái',
}

function DiffPanel({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  const formatJSON = (obj: Record<string, unknown> | null) => {
    if (!obj) return '(không có)'
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 420,
        background: 'var(--sf)',
        borderLeft: '1px solid var(--bd)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--bd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Chi tiết thay đổi</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--tx3)' }}>
            {entry.entityType} / {entry.entityId}
          </p>
        </div>
        <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>Đóng</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
          <strong>Thời gian:</strong> {fmtDateTime(entry.createdAt)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
          <strong>Người thực hiện:</strong> {entry.actorName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
          <strong>IP:</strong> {entry.ip}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--red-solid)' }}>Trước</p>
          <pre
            style={{
              background: 'var(--sf2)',
              border: '1px solid var(--bd)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              color: 'var(--tx)',
            }}
          >
            {formatJSON(entry.before)}
          </pre>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--green-solid)' }}>Sau</p>
          <pre
            style={{
              background: 'var(--sf2)',
              border: '1px solid var(--bd)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              color: 'var(--tx)',
            }}
          >
            {formatJSON(entry.after)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminApi.listAuditLog(
        {
          action: actionFilter as AuditAction || undefined,
          entityType: entityTypeFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          page,
          limit: 10,
        },
        signal,
      ),
    [actionFilter, entityTypeFilter, fromDate, toDate, page],
  )

  function handleExport() {
    alert('Đã xuất CSV thành công. (Placeholder — sẽ kết nối API xuất file)')
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Nhật ký hệ thống</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
            audit_log — chỉ đọc
          </p>
        </div>
        <button type="button" className="odm-btn odm-btn-gh" onClick={handleExport}>
          Xuất CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          className="odm-input"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          style={{ width: 160 }}
        >
          <option value="">Tất cả hành động</option>
          <option value="CREATE">Tạo mới</option>
          <option value="UPDATE">Cập nhật</option>
          <option value="DELETE">Xóa</option>
          <option value="APPROVE">Phê duyệt</option>
          <option value="STATUS_CHANGE">Đổi trạng thái</option>
        </select>
        <input
          className="odm-input"
          placeholder="Loại thực thể..."
          value={entityTypeFilter}
          onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1) }}
          style={{ width: 160 }}
        />
        <input
          className="odm-input"
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
          style={{ width: 140 }}
        />
        <input
          className="odm-input"
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1) }}
          style={{ width: 140 }}
        />
      </div>

      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}

      {!loading && data && (
        <>
          <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
            <table className="odm-adm-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Loại thực thể</th>
                  <th>ID thực thể</th>
                  <th>IP</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx3)' }}>
                      {fmtDateTime(entry.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--blue-solid)',
                            color: 'var(--inkfg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {entry.actorName.split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12 }}>{entry.actorName}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge tone={ACTION_TONE[entry.action]}>
                        {ACTION_LABEL[entry.action]}
                      </StatusBadge>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--tx2)' }}>{entry.entityType}</td>
                    <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx3)' }}>
                      {entry.entityId.slice(0, 20)}{entry.entityId.length > 20 ? '...' : ''}
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{entry.ip}</td>
                    <td>
                      <button
                        type="button"
                        className="odm-btn odm-btn-gh"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        Xem diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button
                type="button"
                className="odm-btn odm-btn-gh"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </button>
              <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="odm-btn odm-btn-gh"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      )}

      {selectedEntry && (
        <DiffPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}

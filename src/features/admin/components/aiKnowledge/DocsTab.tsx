import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { DocStatus } from '../../types/aiKnowledge'
import type { StatusTone } from '../../../../shared/types/domain'

const DOC_STATUS_TONE: Record<DocStatus, StatusTone> = {
  INDEXED: 'green',
  PENDING: 'yellow',
  FAILED: 'red',
}
const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  INDEXED: 'Đã index',
  PENDING: 'Chờ xử lý',
  FAILED: 'Thất bại',
}

export function DocsTab() {
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listDocs(signal),
    [],
  )
  const [submitting, setSubmitting] = useState<string | null>(null)

  async function handleReindex(docId: string) {
    setSubmitting(docId)
    try {
      await adminApi.reindexDoc(docId)
      reload()
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div>
      <div
        style={{
          border: '2px dashed var(--bd)',
          borderRadius: 10,
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--tx3)',
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        Kéo thư mục hoặc nhấp để tải lên tài liệu (PDF, DOCX) — Tính năng sẽ sẵn
        sàng sau
      </div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {!loading && data && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Phiên bản</th>
                <th>Hiệu lực từ</th>
                <th>Trạng thái</th>
                <th>Số chunk</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{doc.title}</td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--tx3)',
                      }}
                    >
                      {doc.docType}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>v{doc.version}</td>
                  <td style={{ fontSize: 12 }}>{doc.effectiveFrom}</td>
                  <td>
                    <StatusBadge tone={DOC_STATUS_TONE[doc.status]}>
                      {DOC_STATUS_LABEL[doc.status]}
                    </StatusBadge>
                  </td>
                  <td style={{ fontSize: 12, textAlign: 'center' }}>
                    {doc.chunkCount ?? '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      disabled={submitting === doc.id}
                      onClick={() => handleReindex(doc.id)}
                    >
                      {submitting === doc.id ? '...' : 'Index lại'}
                    </button>
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

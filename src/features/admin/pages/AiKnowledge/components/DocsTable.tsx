import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge, type AdminTone } from '../../../components/common/StatusBadge'
import type { DocStatus, KnowledgeDoc } from '../../../types/aiKnowledge'
import { docsTableMessages } from './DocsTable.messages'

const DOC_STATUS_TONE: Record<DocStatus, AdminTone> = {
  INDEXED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
}

type Props = {
  items: KnowledgeDoc[]
  busyId: string | null
  onReindex: (docId: string) => void
}

export function DocsTable({ items, busyId, onReindex }: Props) {
  const { t } = useI18n(docsTableMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.title}</th>
          <th>{t.type}</th>
          <th>{t.version}</th>
          <th>{t.effectiveFrom}</th>
          <th>{t.status}</th>
          <th>{t.chunkCount}</th>
          <th className="adm-text-right">{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((doc) => (
          <tr key={doc.id}>
            <td className="adm-strong adm-wrap">{doc.title}</td>
            <td className="adm-cell-mono">{doc.docType}</td>
            <td>v{doc.version}</td>
            <td>{doc.effectiveFrom}</td>
            <td>
              <StatusBadge tone={DOC_STATUS_TONE[doc.status]}>
                {t.docStatus[doc.status]}
              </StatusBadge>
            </td>
            <td>{doc.chunkCount ?? '—'}</td>
            <td>
              <div className="adm-row-actions">
                <button
                  type="button"
                  className="odm-btn odm-btn-gh odm-btn-sm"
                  aria-label={`${t.reindex} ${doc.title}`}
                  disabled={busyId === doc.id}
                  onClick={() => onReindex(doc.id)}
                >
                  {busyId === doc.id ? '...' : t.reindex}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

import { useI18n } from '../../../../../shared/i18n'
import { Modal } from '../../../components/common/Modal'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AuditEntry } from '../../../types/auditLog'
import { auditDetailMessages } from './AuditDetailModal.messages'

function JsonBlock({
  label,
  tone,
  value,
  empty,
}: {
  label: string
  tone: 'before' | 'after'
  value: Record<string, unknown> | null
  empty: string
}) {
  return (
    <div className="adm-json-block">
      <p className={`adm-json-label is-${tone}`}>{label}</p>
      <pre className="adm-json">
        {value ? JSON.stringify(value, null, 2) : empty}
      </pre>
    </div>
  )
}

export function AuditDetailModal({
  entry,
  onClose,
}: {
  entry: AuditEntry
  onClose: () => void
}) {
  const { t, lang } = useI18n(auditDetailMessages)
  return (
    <Modal
      width={640}
      icon="clipboard"
      title={t.title}
      subtitle={`${entry.entityType} / ${entry.entityId}`}
      onClose={onClose}
      footer={
        <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
          {t.close}
        </button>
      }
    >
      <dl className="adm-detail-meta">
        <dt>{t.time}</dt>
        <dd>{fmtDateTime(entry.createdAt, lang)}</dd>
        <dt>{t.actor}</dt>
        <dd>{entry.actorName}</dd>
        <dt>{t.ip}</dt>
        <dd>{entry.ip}</dd>
      </dl>
      <JsonBlock label={t.before} tone="before" value={entry.before} empty={t.none} />
      <JsonBlock label={t.after} tone="after" value={entry.after} empty={t.none} />
    </Modal>
  )
}

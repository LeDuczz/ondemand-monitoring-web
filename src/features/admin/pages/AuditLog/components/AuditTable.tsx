import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge } from '../../../../../shared/components/ui'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AuditEntry } from '../../../types/auditLog'
import { ACTION_TONE, auditActionMessages } from '../auditActions'
import { auditTableMessages } from './AuditTable.messages'

function initials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

type Props = {
  items: AuditEntry[]
  onView: (entry: AuditEntry) => void
}

export function AuditTable({ items, onView }: Props) {
  const { t, lang } = useI18n(auditTableMessages)
  const { t: actions } = useI18n(auditActionMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.createdAt}</th>
          <th>{t.actor}</th>
          <th>{t.action}</th>
          <th>{t.entityType}</th>
          <th>{t.entityId}</th>
          <th>{t.ip}</th>
          <th className="adm-text-right">{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((entry) => (
          <tr key={entry.id}>
            <td className="adm-cell-mono">{fmtDateTime(entry.createdAt, lang)}</td>
            <td>
              <div className="adm-actor">
                <span className="adm-avatar" aria-hidden="true">
                  {initials(entry.actorName)}
                </span>
                <span className="adm-wrap">{entry.actorName}</span>
              </div>
            </td>
            <td>
              <StatusBadge tone={ACTION_TONE[entry.action]}>
                {actions[entry.action]}
              </StatusBadge>
            </td>
            <td className="adm-wrap">{entry.entityType}</td>
            <td className="adm-cell-mono adm-wrap" title={entry.entityId}>
              {entry.entityId.slice(0, 20)}
              {entry.entityId.length > 20 ? '...' : ''}
            </td>
            <td className="adm-cell-mono">{entry.ip}</td>
            <td>
              <div className="adm-row-actions">
                <button
                  type="button"
                  className="odm-btn odm-btn-gh odm-btn-sm"
                  aria-label={`${t.viewDiff} ${entry.entityType} ${entry.entityId}`}
                  onClick={() => onView(entry)}
                >
                  {t.viewDiff}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

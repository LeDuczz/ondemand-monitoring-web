import { useI18n } from '../../../../../shared/i18n'
import { AdminToggle } from '../../../components/common/AdminToggle'
import type { AdminStation } from '../../../types/catalog'
import { RowActions } from './RowActions'
import { stationsTableMessages } from './StationsTable.messages'

export function StationsTable({
  items,
  togglingId,
  onEdit,
  onToggle,
}: {
  items: AdminStation[]
  togglingId: string | null
  onEdit: (s: AdminStation) => void
  onToggle: (s: AdminStation) => void
}) {
  const { t } = useI18n(stationsTableMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.station}</th>
          <th>{t.coords}</th>
          <th>{t.radius}</th>
          <th>{t.active}</th>
          <th className="adm-text-right">{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td>
              <div className="adm-wrap adm-strong">{s.name}</div>
              <div className="adm-cell-email adm-wrap">{s.address}</div>
            </td>
            <td className="adm-cell-mono">
              {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
            </td>
            <td className="adm-cell-mono">
              {(s.maxServiceRadiusM / 1000).toFixed(0)} km
            </td>
            <td>
              <AdminToggle
                active={s.isActive}
                label={s.name}
                onToggle={() => onToggle(s)}
                disabled={togglingId === s.id}
              />
            </td>
            <td>
              <RowActions label={s.name} onEdit={() => onEdit(s)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

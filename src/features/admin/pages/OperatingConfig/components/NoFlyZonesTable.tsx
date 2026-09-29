import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge } from '../../../components/common/StatusBadge'
import type { NoFlyZone } from '../../../types/operatingConfig'
import { noFlyZonesTableMessages } from './NoFlyZonesTable.messages'
import { ZONE_TYPE_TONE, zoneTypeMessages } from './zoneTypes'

type Props = {
  items: NoFlyZone[]
  onEdit: (zone: NoFlyZone) => void
  onToggle: (zone: NoFlyZone) => void
}

export function NoFlyZonesTable({ items, onEdit, onToggle }: Props) {
  const { t } = useI18n(noFlyZonesTableMessages)
  const { t: zt } = useI18n(zoneTypeMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.columnName}</th>
          <th>{t.columnType}</th>
          <th>{t.columnSource}</th>
          <th>{t.columnRadius}</th>
          <th>{t.columnCeiling}</th>
          <th>{t.columnStatus}</th>
          <th className="adm-text-right">{t.columnActions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((zone) => (
          <tr key={zone.id}>
            <td className="adm-strong adm-wrap">{zone.name}</td>
            <td>
              <StatusBadge tone={ZONE_TYPE_TONE[zone.zoneType]}>
                {zt[zone.zoneType]}
              </StatusBadge>
            </td>
            <td className="adm-muted adm-wrap">{zone.source}</td>
            <td>{(zone.radiusM / 1000).toFixed(1)} km</td>
            <td>
              {zone.maxAltitudeM != null ? `${zone.maxAltitudeM}m` : t.unlimited}
            </td>
            <td>
              <StatusBadge tone={zone.isActive ? 'success' : 'neutral'}>
                {zone.isActive ? t.active : t.off}
              </StatusBadge>
            </td>
            <td>
              <div className="adm-row-actions">
                <button
                  type="button"
                  className="odm-btn odm-btn-gh odm-btn-sm"
                  aria-label={`${t.edit} ${zone.name}`}
                  onClick={() => onEdit(zone)}
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  className="odm-btn odm-btn-gh odm-btn-sm"
                  aria-label={`${zone.isActive ? t.off : t.on} ${zone.name}`}
                  onClick={() => onToggle(zone)}
                >
                  {zone.isActive ? t.off : t.on}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

import { useI18n } from '../../../../../shared/i18n'
import { areaMinistryViolationsMessages } from './AreaMinistryViolations.messages'

function openMinistryMap(zoneCode: string) {
  window.open('https://cambay.mod.gov.vn/', '_blank', 'noopener,noreferrer')
  void navigator.clipboard?.writeText(zoneCode).catch(() => undefined)
}

export function AreaMinistryViolations({
  hasMinistryViolations,
  ministryViolatedZones,
}: {
  hasMinistryViolations: boolean
  ministryViolatedZones: string[]
}) {
  const { t } = useI18n(areaMinistryViolationsMessages)

  return hasMinistryViolations ? (
    <div className="odm-or-area-findings">
      <strong>{t.zoneCodesViolatedPerCambay}</strong>
      <ul>
        {ministryViolatedZones.map((zone) => (
          <li key={zone} className="is-high odm-or-area-zone-row">
            <code>{zone}</code>
            <button
              type="button"
              className="odm-or-area-zone-link"
              title={t.openCambayModGovVn(zone)}
              onClick={() => openMinistryMap(zone)}
            >
              {t.viewOnMap}
            </button>
          </li>
        ))}
      </ul>
    </div>
  ) : null
}

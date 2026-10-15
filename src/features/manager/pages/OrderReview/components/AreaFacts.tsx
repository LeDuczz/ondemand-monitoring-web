import { Fact } from './Fact'
import type { FlightAreaAssessment } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { areaFactsMessages } from './AreaFacts.messages'
import { getLanguage } from '../../../../../shared/i18n'

function restrictedLabel(value: {
  dataAvailable: boolean
  pointInsideRestrictedZone: boolean
  monitoringAreaIntersectsRestrictedZone: boolean
}) {
  if (!value.dataAvailable) return areaFactsMessages[getLanguage()].noDataYet
  if (value.pointInsideRestrictedZone)
    return areaFactsMessages[getLanguage()].centerLiesInsideARestricted
  if (value.monitoringAreaIntersectsRestrictedZone)
    return areaFactsMessages[getLanguage()].monitoringAreaIntersectsARestricted
  return areaFactsMessages[getLanguage()].noRestrictedZoneIntersection
}

function distanceLabel(value: number | null | undefined) {
  return value == null
    ? areaFactsMessages[getLanguage()].notDetermined
    : `${Math.round(value).toLocaleString(
        getLanguage() === 'en' ? 'en-US' : 'vi-VN',
      )} m`
}

function metersLabel(value: number | null | undefined) {
  return value == null
    ? areaFactsMessages[getLanguage()].notDetermined
    : `${Math.round(value)} m AMSL`
}

function ministryLabel(
  value:
    | {
        available: boolean
        violatedAreaSquareMeters?: number | null
        violatedZones: string[]
      }
    | undefined,
) {
  if (!value?.available) return areaFactsMessages[getLanguage()].couldNotConnect
  if (
    (value.violatedAreaSquareMeters ?? 0) > 0 ||
    value.violatedZones.length > 0
  ) {
    return areaFactsMessages[getLanguage()].intersectsANoFlyRestricted
  }
  return areaFactsMessages[getLanguage()].noRestrictedZoneIntersectionRecorded
}

export function AreaFacts({ data }: { data: FlightAreaAssessment }) {
  const { t } = useI18n(areaFactsMessages)

  return (
    <details className="odm-or-area-details">
      <summary>{t.viewDetailedCheckData}</summary>
      <dl className="odm-or-area-facts">
        <Fact
          label={t.crossCheckWithTheMinistry}
          value={ministryLabel(data.ministryFlightBan)}
        />
        <Fact
          label={t.internalRestrictedZoneData}
          value={restrictedLabel(data.restrictedZones)}
        />
        <Fact
          label={t.distanceToTheNearestRestricted}
          value={distanceLabel(
            data.restrictedZones.nearestRestrictedZoneDistanceMeters,
          )}
        />
        <Fact
          label={t.groundElevationAtTheLocation}
          value={metersLabel(data.elevation.terrainElevationMeters)}
        />
        <Fact
          label={t.structuresInTheArea}
          value={String(data.osmContext.buildingCount ?? 0)}
        />
        <Fact
          label={t.airportNearTheArea}
          value={data.osmContext.aerodromeNearby ? t.yes : t.no}
        />
        <Fact
          label={t.helipadNearTheArea}
          value={data.osmContext.helipadNearby ? t.yes : t.no}
        />
      </dl>
    </details>
  )
}

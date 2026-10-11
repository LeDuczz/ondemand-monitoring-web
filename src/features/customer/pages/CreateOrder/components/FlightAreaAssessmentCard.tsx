import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { FlightAreaAssessment } from '../../../api/customerApi'
import type { FlightAreaAssessmentState } from '../hooks/useFlightAreaAssessment'
import { flightAreaAssessmentCardMessages } from './FlightAreaAssessmentCard.messages'

const LEVEL_CLASS = {
  FAVORABLE: 'is-favorable',
  NEEDS_REVIEW: 'is-review',
  HIGH_RISK: 'is-high',
} as const

const SEVERITY_ORDER = { HIGH: 0, WARNING: 1, INFO: 2 } as const

type Messages = (typeof flightAreaAssessmentCardMessages)['vi']

type Props = {
  state: FlightAreaAssessmentState
  /** Desired altitude above ground (m), shown even before the backend answers. */
  requestedAltitudeAglM: number
}

/** Advisory preview of the picked area. Never says "safe" and never blocks creating an order. */
export function FlightAreaAssessmentCard({ state, requestedAltitudeAglM }: Props) {
  const { t, locale } = useI18n(flightAreaAssessmentCardMessages)
  const number = (value: number, digits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)
  const data = state.data
  const refreshing = state.status === 'loading' && data !== null

  return (
    <Card
      title={t.title}
      className="co-fa-card"
      actions={
        data ? (
          <span className="co-fa-head-actions">
            {refreshing && (
              <span className="co-fa-updating" role="status">
                <i className="co-fa-spin" aria-hidden="true" />
                {t.refreshing}
              </span>
            )}
            <LevelBadge level={data.assessment.level} label={t.level[data.assessment.level]} />
          </span>
        ) : undefined
      }
    >
      {state.status === 'loading' && <span className="co-fa-progress" aria-hidden="true" />}
      {state.status === 'idle' && !data && <p className="co-hint">{t.idle}</p>}
      {state.status === 'loading' && !data && (
        <div className="co-fa-skeleton" role="status" aria-label={t.loading}>
          {[3, 2, 3].map((rows, group) => (
            <div className="co-fa-skel-group" key={group}>
              {Array.from({ length: rows }, (_, row) => (
                <div className="co-fa-skel-row" key={row}>
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {state.status === 'error' && (
        <div className="co-notice is-warning" role="alert">
          {t.error}{' '}
          <button type="button" className="co-fa-retry" onClick={state.retry}>
            {t.retry}
          </button>
        </div>
      )}
      {data && (
        <div className={`co-fa-body${refreshing ? ' is-refreshing' : ''}`} aria-busy={refreshing}>
          <dl className="co-fa-rows">
            <Row label={t.terrain} value={terrain(data, t, number)} />
            <Row
              label={t.requested}
              value={t.agl(number(data.elevation.requestedAltitudeAglMeters ?? requestedAltitudeAglM))}
            />
            <Row
              label={t.estimated}
              value={
                data.elevation.estimatedFlightAltitudeAmslMeters != null
                  ? t.amsl(number(data.elevation.estimatedFlightAltitudeAmslMeters))
                  : t.unknown
              }
            />
          </dl>
          <dl className="co-fa-rows">
            <Row label={t.restricted} value={restricted(data, t)} />
            <Row
              label={t.nearest}
              value={
                data.restrictedZones.nearestRestrictedZoneDistanceMeters != null
                  ? t.meters(number(data.restrictedZones.nearestRestrictedZoneDistanceMeters))
                  : t.unknown
              }
            />
          </dl>
          <dl className="co-fa-rows">
            <Row label={t.buildings} value={data.osmContext.available ? number(data.osmContext.buildingCount) : t.unknown} />
            <Row
              label={t.towers}
              value={
                data.osmContext.available
                  ? number(data.osmContext.towerCount + data.osmContext.mastCount + data.osmContext.powerTowerCount)
                  : t.unknown
              }
            />
            <Row
              label={t.aerodrome}
              value={data.osmContext.available ? (data.osmContext.aerodromeNearby ? t.yes : t.no) : t.unknown}
            />
            {data.osmContext.helipadNearby && <Row label={t.helipad} value={t.yes} />}
          </dl>
          {data.assessment.findings.length > 0 && (
            <div className="co-fa-findings">
              <div className="co-block-title">{t.findings}</div>
              <ul>
                {[...data.assessment.findings]
                  .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
                  .map((finding) => (
                    <li key={finding.code} className={`is-${finding.severity.toLowerCase()}`}>
                      <span aria-hidden="true" className="co-fa-mark">
                        {finding.severity === 'INFO' ? 'ⓘ' : '⚠'}
                      </span>
                      <span>{finding.message}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {data.osmContext.available && (
            <p className="co-hint">
              {t.osmNote}
              {data.osmContext.queryRadiusMeters != null &&
                data.osmContext.queryRadiusMeters < data.location.radiusMeters &&
                ` ${t.osmRadius(number(data.osmContext.queryRadiusMeters))}`}
            </p>
          )}
          <p className="co-fa-disclaimer">{data.assessment.disclaimer}</p>
        </div>
      )}
    </Card>
  )
}

function LevelBadge({ level, label }: { level: keyof typeof LEVEL_CLASS; label: string }) {
  return <span className={`co-fa-level ${LEVEL_CLASS[level]}`}>{label}</span>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="co-fa-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function terrain(
  data: FlightAreaAssessment,
  t: Messages,
  number: (value: number, digits?: number) => string,
) {
  return data.elevation.available && data.elevation.terrainElevationMeters != null
    ? t.amsl(number(data.elevation.terrainElevationMeters))
    : t.unknown
}

function restricted(
  data: FlightAreaAssessment,
  t: Messages,
) {
  const zones = data.restrictedZones
  if (zones.pointInsideRestrictedZone) return t.restrictedInside
  if (zones.monitoringAreaIntersectsRestrictedZone) return t.restrictedIntersect
  return zones.dataAvailable ? t.restrictedNone : t.restrictedNoData
}

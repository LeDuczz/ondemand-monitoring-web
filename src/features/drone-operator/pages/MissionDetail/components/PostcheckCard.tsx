import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { formatNumber } from '../missionFormat'
import type { PostflightCheckStatus } from '../types'
import { PostcheckBasicChecks } from './PostcheckBasicChecks'
import { postcheckCardMessages } from './PostcheckCard.messages'
import { PostcheckItemRows } from './PostcheckItemRows'
import { PostMetric } from './PostMetric'

function postflightFaultLabel(
  faultType: string | null | undefined,
  t: typeof postcheckCardMessages.vi,
) {
  if (!faultType) return null
  if (faultType === 'PHYSICAL_DAMAGE') return t.faultPhysical
  if (faultType === 'BATTERY') return t.faultBattery
  if (faultType === 'HARDWARE') return t.faultHardware
  return faultType.replaceAll('_', ' ')
}

function postflightNoteLabel(notes?: string | null) {
  if (!notes) return ''
  return notes.replace(/^Inspection:\s*[^.]*\.\s*/i, '').trim()
}

function formatCheckedAt(value: string | undefined, locale: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

export function PostcheckCard({
  postflight,
}: {
  postflight: PostflightCheckStatus | null
}) {
  const { t, locale } = useI18n(postcheckCardMessages)
  const issueText = postflightFaultLabel(postflight?.faultType, t)
  const noteText = postflightNoteLabel(postflight?.notes)
  const itemChecks =
    postflight?.items?.filter((item) => item.checkName || item.checkType) ?? []

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>{t.title}</span>
        <StatusBadge
          tone={postflight ? (postflight.overallOk ? 'green' : 'red') : 'gray'}
        >
          {postflight
            ? postflight.overallOk
              ? t.ok
              : t.needsMaintenance
            : t.noPostcheck}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {postflight ? (
          <>
            {/* Telemetry metrics 2×2 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 7,
                marginBottom: 10,
              }}
            >
              <PostMetric
                label={t.checkedAt}
                value={formatCheckedAt(postflight.checkedAt, locale)}
              />
              <PostMetric
                label={t.altitude}
                value={formatNumber(postflight.landingAltitudeM, ' m')}
              />
              <PostMetric
                label={t.landingBattery}
                value={formatNumber(postflight.landingBatteryPercent, '%')}
              />
              <PostMetric
                label={t.speed}
                value={formatNumber(postflight.landingSpeedMps, ' m/s')}
              />
              {postflight.landingTelemetryOnline != null && (
                <PostMetric
                  label={t.telemetry}
                  value={
                    postflight.landingTelemetryOnline
                      ? t.telemetryOnline
                      : t.telemetryOffline
                  }
                />
              )}
              {postflight.landingHeadingDeg != null && (
                <PostMetric
                  label={t.heading}
                  value={formatNumber(postflight.landingHeadingDeg, '°', 0)}
                />
              )}
            </div>

            {itemChecks.length > 0 ? (
              <PostcheckItemRows items={itemChecks} />
            ) : (
              <PostcheckBasicChecks postflight={postflight} />
            )}

            {(issueText || noteText) && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: `1px solid ${postflight.overallOk ? 'var(--bd)' : 'var(--red-dot)'}`,
                  background: postflight.overallOk
                    ? 'var(--sf2)'
                    : 'var(--red-bg)',
                  color: postflight.overallOk ? 'var(--tx2)' : 'var(--red-fg)',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {issueText && (
                  <div style={{ fontWeight: 700 }}>{issueText}</div>
                )}
                {noteText && (
                  <div style={{ marginTop: issueText ? 3 : 0 }}>{noteText}</div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>{t.noData}</div>
        )}
      </div>
    </div>
  )
}

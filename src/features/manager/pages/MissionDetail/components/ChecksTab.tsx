import { DetailSection } from './DetailSection'
import { WeatherResultDetail } from './WeatherResultDetail'
import { MetricTile } from './MetricTile'
import { CheckItemsList } from './CheckItemsList'
import {
  checkLabel,
  formatNumber,
  formatDateTime,
  type DetailData,
} from '../../../components/common/missionDetailHelpers'
import type { PersistedPreflightCheckResponse } from '../../../types/missions'
import type { PersistedPostDeviceCheckResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { checksTabMessages } from './ChecksTab.messages'

export function ChecksTab({
  detail,
  preflight,
  postcheck,
}: {
  detail: DetailData
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
}) {
  const { t, locale } = useI18n(checksTabMessages)
  return (
    <>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection
            title={t.weatherResultCard}
            badge={
              detail.weather ? checkLabel(detail.weather.status) : undefined
            }
          >
            <WeatherResultDetail weather={detail.weather} locale={locale} />
          </DetailSection>
        </div>
      </section>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection
            title={t.precheckCard}
            badge={preflight ? checkLabel(preflight.status) : undefined}
          >
            {preflight ? (
              <div className="odm-or-detail-stack">
                <div className="odm-or-detail-grid">
                  <MetricTile
                    label={t.totalChecks}
                    value={preflight.totalChecks}
                  />
                  <MetricTile label={t.passed} value={preflight.passedChecks} />
                  <MetricTile label={t.failed} value={preflight.failedChecks} />
                  <MetricTile
                    label={t.progress}
                    value={formatNumber(preflight.progressPercent, '%')}
                  />
                </div>
                <CheckItemsList items={preflight.items} />
              </div>
            ) : (
              <div className="odm-or-empty">{t.noPrecheck}</div>
            )}
          </DetailSection>
        </div>
      </section>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection
            title={t.postcheckCard}
            badge={postcheck ? checkLabel(postcheck.status) : undefined}
          >
            {postcheck ? (
              <div className="odm-or-detail-stack">
                <div className="odm-or-detail-grid">
                  <MetricTile label={t.device} value={postcheck.deviceCode} />
                  <MetricTile
                    label={t.batteryLeft}
                    value={formatNumber(postcheck.landingBatteryPercent, '%')}
                  />
                  <MetricTile
                    label={t.batteryState}
                    value={postcheck.landingBatteryState}
                  />
                  <MetricTile
                    label={t.checkedAt}
                    value={formatDateTime(postcheck.checkedAt, locale)}
                  />
                  <MetricTile label={t.passed} value={postcheck.passedChecks} />
                  <MetricTile label={t.failed} value={postcheck.failedChecks} />
                </div>
                <CheckItemsList items={postcheck.items} />
              </div>
            ) : (
              <div className="odm-or-empty">{t.noPostcheck}</div>
            )}
          </DetailSection>
        </div>
      </section>
    </>
  )
}

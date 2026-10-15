import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { MetricTile } from './MetricTile'
import { CheckItemsList } from './CheckItemsList'
import {
  checkLabel,
  checkTone,
  formatNumber,
  formatDateTime,
} from '../../../components/common/missionDetailHelpers'
import type { PersistedPreflightCheckResponse } from '../../../types/missions'
import type { PersistedPostDeviceCheckResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { checksTabMessages } from './ChecksTab.messages'

export function ChecksTab({
  preflight,
  postcheck,
}: {
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
}) {
  const { t, lang, locale } = useI18n(checksTabMessages)
  return (
    <>
      <Card
        title={t.precheckCard}
        actions={
          preflight ? (
            <StatusBadge tone={checkTone(preflight.status)}>
              {checkLabel(preflight.status, lang)}
            </StatusBadge>
          ) : undefined
        }
      >
        {preflight ? (
          <div className="odm-md-stack">
            <div className="odm-md-metrics">
              <MetricTile label={t.totalChecks} value={preflight.totalChecks} />
              <MetricTile label={t.passed} value={preflight.passedChecks} />
              <MetricTile label={t.failed} value={preflight.failedChecks} />
              <MetricTile
                label={t.progress}
                value={formatNumber(preflight.progressPercent, '%', lang)}
              />
            </div>
            <CheckItemsList items={preflight.items} />
          </div>
        ) : (
          <p className="odm-or-empty">{t.noPrecheck}</p>
        )}
      </Card>
      <Card
        title={t.postcheckCard}
        actions={
          postcheck ? (
            <StatusBadge tone={checkTone(postcheck.status)}>
              {checkLabel(postcheck.status, lang)}
            </StatusBadge>
          ) : undefined
        }
      >
        {postcheck ? (
          <div className="odm-md-stack">
            <div className="odm-md-metrics">
              <MetricTile label={t.device} value={postcheck.deviceCode} />
              <MetricTile
                label={t.batteryLeft}
                value={formatNumber(postcheck.landingBatteryPercent, '%', lang)}
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
          <p className="odm-or-empty">{t.noPostcheck}</p>
        )}
      </Card>
    </>
  )
}

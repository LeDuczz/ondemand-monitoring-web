import { useState } from 'react'

import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { statusTone } from '../missionFormat'
import type {
  RuntimeOverallStatus,
  RuntimePreflightStatus,
  WeatherPreflightStatus,
} from '../types'
import { PrecheckCheckRow } from './PrecheckCheckRow'
import { precheckCardMessages } from './PrecheckCard.messages'
import { PrecheckWeatherResult } from './PrecheckWeatherResult'

function preflightLabel(
  status: RuntimeOverallStatus | undefined,
  t: typeof precheckCardMessages.vi,
) {
  if (status === 'READY') return t.statusReady
  if (status === 'FAILED') return t.statusFailed
  if (status === 'CHECKING') return t.statusChecking
  return t.statusNotChecked
}

export function PrecheckCard({
  preflight,
  weather,
}: {
  preflight: RuntimePreflightStatus | null
  weather: WeatherPreflightStatus | null
}) {
  const { t } = useI18n(precheckCardMessages)
  const [expanded, setExpanded] = useState(false)
  const passCount =
    preflight?.checks.filter((c) => c.status === 'PASS' || c.status === 'WARN')
      .length ?? 0
  const failCount =
    preflight?.checks.filter((c) => c.status === 'FAIL').length ?? 0
  const PREVIEW_COUNT = 5
  const visibleChecks = preflight
    ? expanded
      ? preflight.checks
      : preflight.checks.slice(0, PREVIEW_COUNT)
    : []
  const hasMore = (preflight?.checks.length ?? 0) > PREVIEW_COUNT

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>{t.title}</span>
        <StatusBadge tone={statusTone(preflight?.status)}>
          {preflightLabel(preflight?.status, t)}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {preflight ? (
          <>
            {/* Meta rows */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--tx3)',
                marginBottom: 4,
              }}
            >
              <span># {t.checkCode}</span>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10.5,
                  color: 'var(--tx2)',
                  maxWidth: 170,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {preflight.checkId}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--tx3)',
                marginBottom: 10,
              }}
            >
              <span>{t.progress}</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>
                {t.progressValue(
                  Math.round(preflight.progress),
                  passCount,
                  failCount,
                )}
              </span>
            </div>

            <PrecheckWeatherResult weather={weather} />

            {/* Check items */}
            <div
              style={{
                border: '1px solid var(--bd)',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            >
              {visibleChecks.map((item, idx) => (
                <PrecheckCheckRow
                  key={`${item.key}-${idx}`}
                  item={item}
                  isLast={idx === visibleChecks.length - 1}
                />
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '5px 0',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--blue-dot)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {expanded
                  ? t.collapse
                  : t.showMore(preflight.checks.length - PREVIEW_COUNT)}
              </button>
            )}
          </>
        ) : (
          <>
            <PrecheckWeatherResult weather={weather} />
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              {t.noData}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

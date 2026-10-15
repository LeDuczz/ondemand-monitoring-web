import { useI18n } from '../../../../../shared/i18n'
import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { NO_DRONE_SENTINEL } from '../preflightHelpers'
import { usePreflightChecklist } from '../usePreflightChecklist'
import { PreflightGroupList } from './PreflightGroupList'
import { preflightChecklistPanelMessages } from './PreflightChecklistPanel.messages'
import { SummaryBanner } from './SummaryBanner'
import { WeatherCheckPanel } from './WeatherCheckPanel'

export function PreflightChecklistPanel({
  missionId,
  missionLabel,
  deviceId,
  deviceLabel,
  missionStatus,
  latitude,
  longitude,
  onReady,
  embedded = false,
}: {
  missionId: string
  missionLabel?: string
  deviceId: string
  deviceLabel?: string
  missionStatus?: string | null
  latitude?: number | null
  longitude?: number | null
  onReady?: () => void
  embedded?: boolean
}) {
  const { t } = useI18n(preflightChecklistPanelMessages)
  const {
    RUNTIME_GROUPS,
    itemStates,
    nOk,
    nTotal,
    failedItems,
    progress,
    hasTriggered,
    canContinueToHandover,
    isAlreadyInFlight,
    isFailed,
    error,
    triggering,
    handleTriggerCheck,
    backendPreflightMessage,
    backendPreflightRegistering,
    weatherStatus,
    weatherForm,
    setWeatherForm,
    weatherSuggesting,
    weatherError,
    handleWeatherSuggestion,
  } = usePreflightChecklist({
    missionId,
    missionLabel,
    deviceId,
    missionStatus,
    latitude,
    longitude,
  })

  return (
    <div
      className="odm-card"
      style={{
        marginBottom: 0,
        height: embedded ? '100%' : undefined,
        display: embedded ? 'flex' : undefined,
        flexDirection: embedded ? 'column' : undefined,
        overflow: embedded ? 'hidden' : undefined,
      }}
    >
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel ?? missionId}
        active={isAlreadyInFlight ? 5 : 3}
        right={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 32,
              padding: '0 12px',
              borderRadius: 16,
              background: 'var(--sf3)',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
              maxWidth: 150,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {deviceId === NO_DRONE_SENTINEL
              ? t.noDroneAssigned
              : (deviceLabel ?? deviceId)}
          </span>
        }
      />
      <div
        style={{
          padding: '18px 22px',
          overflow: embedded ? 'auto' : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SummaryBanner
            nOk={nOk}
            nTotal={nTotal}
            progress={progress}
            isReady={canContinueToHandover}
            isFailed={isFailed}
            failedItems={failedItems}
            error={error}
            hasTriggered={hasTriggered}
            triggering={triggering}
            onTrigger={handleTriggerCheck}
            onReady={onReady}
            missionId={missionId}
            backendPreflightMessage={backendPreflightMessage}
            backendPreflightRegistering={backendPreflightRegistering}
          />
          <WeatherCheckPanel
            status={weatherStatus}
            form={weatherForm}
            suggesting={weatherSuggesting}
            error={weatherError}
            latitude={latitude}
            longitude={longitude}
            onFormChange={setWeatherForm}
            onSuggest={handleWeatherSuggestion}
          />

          <PreflightGroupList groups={RUNTIME_GROUPS} itemStates={itemStates} />
        </div>
      </div>
    </div>
  )
}

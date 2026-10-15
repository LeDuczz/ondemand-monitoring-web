import { useEffect, type ReactNode } from 'react'
import { missionApi } from '../../../mission/api/missionApi'
import {
  mayPerformMissionAction,
  type MissionAction,
} from '../../../mission/types/permissions'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { operatorHref } from '../../routes'
import { GuardStateCard } from './GuardStateCard'
import { missionActionGuardMessages } from './MissionActionGuard.messages'

export function MissionActionGuard({
  missionId,
  action,
  children,
}: {
  missionId?: string
  action: MissionAction
  children: ReactNode
}) {
  const { t } = useI18n(missionActionGuardMessages)
  const query = useApiQuery(
    () =>
      missionId
        ? missionApi.getPermissions(missionId)
        : Promise.reject(new Error('Select a mission first.')),
    [missionId, action],
  )
  const backHref = missionId
    ? operatorHref({ screen: 'missionDetail', missionId })
    : operatorHref({ screen: 'missions' })
  const pilotOnOperatorStep =
    query.data?.canControlFlight === true &&
    query.data?.canOperatePayload !== true &&
    (action === 'connect' || action === 'preflight' || action === 'handover')

  useEffect(() => {
    if (pilotOnOperatorStep && missionId) {
      window.location.hash = operatorHref({ screen: 'flight', missionId })
    }
  }, [missionId, pilotOnOperatorStep])

  if (query.loading)
    return (
      <GuardStateCard
        tone="blue"
        eyebrow={t.checkingEyebrow}
        title={t.checkingTitle}
        description={t.checkingDescription}
        statusRole="status"
      />
    )
  if (
    query.error ||
    !query.data ||
    !mayPerformMissionAction(query.data, action)
  ) {
    if (pilotOnOperatorStep) {
      return (
        <GuardStateCard
          tone="blue"
          eyebrow={t.readyEyebrow}
          title={t.readyTitle}
          description={t.readyDescription}
          statusRole="status"
        />
      )
    }
    const message =
      (query.error ? t.accessError : undefined) ??
      (pilotOnOperatorStep ? t.operatorStepNote : t.notPermitted)
    return (
      <GuardStateCard
        tone="amber"
        eyebrow={t.unavailableEyebrow}
        title={t.unavailableTitle}
        description={message}
        statusRole="alert"
        primaryAction={{
          label: pilotOnOperatorStep ? t.openCockpit : t.backToMission,
          href:
            pilotOnOperatorStep && missionId
              ? operatorHref({ screen: 'flight', missionId })
              : backHref,
        }}
        secondaryAction={{
          label: t.retry,
          onClick: query.reload,
        }}
      />
    )
  }
  return children
}

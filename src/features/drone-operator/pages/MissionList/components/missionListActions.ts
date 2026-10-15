import {
  missionHasSafeStop,
  missionMayTerminate,
} from '../../../../mission/lib/missionOperationalState'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import type { missionListRowMessages } from './MissionListRow.messages'

type Messages = (typeof missionListRowMessages)['vi']

export function actionFor(mission: OperatorMission, t: Messages) {
  const backendStatus = mission.backendStatus
  const permissions = mission.permissions
  if (missionHasSafeStop(mission) || backendStatus === 'CANCELLED') {
    return missionMayTerminate(mission, permissions?.canTerminateFlight)
      ? {
          label: t.stopFlight,
          cls: 'odm-btn-rd',
          href: operatorHref({ screen: 'flight', missionId: mission.id }),
        }
      : permissions?.canMaintainDevice &&
          backendStatus === 'POSTFLIGHT_CHECKING'
        ? {
            label: t.action.inspect,
            cls: '',
            href: operatorHref({ screen: 'postflight', missionId: mission.id }),
          }
        : {
            label: t.viewStopStatus,
            cls: '',
            href: operatorHref({
              screen: 'missionDetail',
              missionId: mission.id,
            }),
          }
  }
  if (
    !permissions ||
    backendStatus === 'PENDING_REVIEW' ||
    backendStatus === 'COMPLETED'
  ) {
    return {
      label: t.action.viewResult,
      cls: '',
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (permissions) {
    if (
      permissions.canCompleteMission ||
      permissions.canSubmitMissionResult ||
      (backendStatus === 'PENDING_REVIEW' &&
        permissions.canExecuteMonitoringChecklist)
    ) {
      return {
        label: t.action.viewResult,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    if (
      permissions.canMaintainDevice &&
      (backendStatus === 'RETURNING' || backendStatus === 'POSTFLIGHT_CHECKING')
    ) {
      return {
        label: t.action.inspect,
        cls: 'odm-btn-ok',
        href: operatorHref({ screen: 'postflight', missionId: mission.id }),
      }
    }
    if (
      permissions.canUploadMedia &&
      (backendStatus === 'PENDING_REVIEW' || backendStatus === 'COMPLETED')
    ) {
      return {
        label: t.action.reviewMedia,
        cls: 'odm-btn-p',
        href: operatorHref({ screen: 'upload', missionId: mission.id }),
      }
    }
    if (
      permissions.canInspectDevice ||
      permissions.canUploadMedia ||
      permissions.canMaintainDevice
    ) {
      return {
        label: t.action.viewResult,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    if (
      permissions.canControlFlight &&
      (backendStatus === 'READY_TO_FLY' ||
        backendStatus === 'IN_FLIGHT' ||
        backendStatus === 'IN_PROGRESS' ||
        backendStatus === 'RETURNING')
    ) {
      return {
        label: t.action.openCockpit,
        cls: 'odm-btn-bl',
        href: operatorHref({ screen: 'flight', missionId: mission.id }),
      }
    }
    if (permissions.canOperatePayload) {
      if (backendStatus === 'READY_TO_FLY') {
        return {
          label: t.action.handover,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'handover', missionId: mission.id }),
        }
      }
      if (
        backendStatus === 'CONNECTED' ||
        backendStatus === 'PREFLIGHT_CHECKING' ||
        backendStatus === 'FAILED_PREFLIGHT'
      ) {
        return {
          label: t.action.preflight,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'preflight', missionId: mission.id }),
        }
      }
      if (mission.status === 'ACCEPTED') {
        return {
          label: t.action.start,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'connect', missionId: mission.id }),
        }
      }
    }
  }
  // A lifecycle status alone never grants operational permission.
  return {
    label: t.action.details,
    cls: '',
    href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
  }
}

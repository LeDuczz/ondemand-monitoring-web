import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { monitoringErrorMessage } from '../../../mission/components/MonitoringChecklistSection'
import { operatorApi } from '../../api/operatorApi'
import type { OperatorMission } from '../../types/mission'
import { formatMissionDate } from './missionDate'
import { missionDateMessages } from './missionDate.messages'
import { missionDetailPageMessages } from './MissionDetailPage.messages'

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message
    ? monitoringErrorMessage(error)
    : fallback
}

// The summary is stored on the backend and read by managers, so it is always
// written in Vietnamese regardless of the operator's UI language.
function buildMissionResultPayload(mission: OperatorMission) {
  return {
    status: 'COMPLETED',
    startedAt: mission.flightStartedAt ?? null,
    endedAt: mission.completedAt ?? null,
    completedAt: mission.completedAt ?? new Date().toISOString(),
    summary: [
      `Mission ${mission.missionCode ?? mission.id} đã hoàn thành.`,
      `Dịch vụ: ${mission.serviceLabel || 'Chưa rõ'}.`,
      `Địa điểm: ${mission.location || 'Chưa rõ'}.`,
      `Ngày bay: ${formatMissionDate(mission.date, missionDateMessages.vi, 'vi-VN')}.`,
      `Vùng giám sát: ${mission.radiusMeters == null ? 'chưa rõ bán kính' : `bán kính ${mission.radiusMeters} m`}.`,
    ].join(' '),
    notes: 'Kết quả giám sát được gửi cho manager duyệt.',
  } as const
}

/** Owns the accept / reject / complete / submit-result workflow state. */
export function useMissionDetailActions({
  reloadMission,
  reloadMonitoring,
  completeReady,
  submitReady,
}: {
  reloadMission: () => void
  reloadMonitoring: () => void
  completeReady: boolean
  submitReady: boolean
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultSubmitting, setResultSubmitting] = useState(false)
  const [mediaRevision, setMediaRevision] = useState(0)
  const [actionError, setActionError] = useState<unknown>(null)

  const refreshWorkspace = (clearError = true) => {
    if (clearError) setActionError(null)
    setMediaRevision((value) => value + 1)
    reloadMission()
    reloadMonitoring()
  }

  async function handleAccept(mission: OperatorMission) {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.acceptMission(mission.id)
      reloadMission()
    } catch (error) {
      setActionError(actionErrorMessage(error, t.acceptFailed))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject(
    mission: OperatorMission,
    reason: string,
    notes: string,
  ) {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.rejectMission(mission.id, { reason, notes })
      setShowReject(false)
      reloadMission()
    } catch (error) {
      setActionError(actionErrorMessage(error, t.rejectFailed))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCompleteMission(mission: OperatorMission) {
    if (!completeReady || submitting || resultSubmitting) return
    setSubmitting(true)
    setActionError(null)
    try {
      await missionApi.completeMission(mission.id)
    } catch (error) {
      setActionError(error)
    } finally {
      refreshWorkspace(false)
      setSubmitting(false)
    }
  }

  async function handleSubmitResult(mission: OperatorMission) {
    if (!submitReady || resultSubmitting || submitting) return
    setResultSubmitting(true)
    setActionError(null)
    try {
      await missionApi.submitMissionResult(
        mission.id,
        buildMissionResultPayload(mission),
      )
    } catch (error) {
      setActionError(error)
    } finally {
      refreshWorkspace(false)
      setResultSubmitting(false)
    }
  }

  async function handlePrepareSafeStopPostflight(mission: OperatorMission) {
    setSubmitting(true)
    setActionError(null)
    try {
      await missionApi.startPostflight(mission.id)
    } catch (error) {
      setActionError(error)
    } finally {
      refreshWorkspace(false)
      setSubmitting(false)
    }
  }

  return {
    showReject,
    setShowReject,
    submitting,
    resultSubmitting,
    mediaRevision,
    actionError,
    refreshWorkspace,
    handleAccept,
    handleReject,
    handleCompleteMission,
    handleSubmitResult,
    handlePrepareSafeStopPostflight,
  }
}

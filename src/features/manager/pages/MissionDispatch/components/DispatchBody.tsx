import type { Mission, ResourceSuggestions } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { useState, useEffect } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { TimelineCard } from './TimelineCard'
import { ReleaseModal } from './ReleaseModal'
import { dispatchBodyMessages } from './DispatchBody.messages'
import { DispatchToast } from './DispatchToast'
import { DispatchHead } from './DispatchHead'
import { MissionBriefCard } from './MissionBriefCard'
import { InfeasibleCard } from './InfeasibleCard'
import { DroneStepCard } from './DroneStepCard'
import { LockedDroneStep, type LockedDrone } from './LockedDroneStep'
import { OperatorStepCard } from './OperatorStepCard'
import { RejectedCandidatesCard } from './RejectedCandidatesCard'
import { DispatchBottomBar } from './DispatchBottomBar'
import { SetupSummary } from './SetupSummary'

export function DispatchBody({
  mission: initialMission,
  suggestions,
  onMissionChanged,
  setupMode,
}: {
  mission: Mission
  suggestions: ResourceSuggestions
  onMissionChanged: () => void
  setupMode: boolean
}) {
  const { t } = useI18n(dispatchBodyMessages)
  const [mission, setMission] = useState(initialMission)
  // Phase 1: null = drone not yet locked; set = drone locked via API
  const [lockedDrone, setLockedDrone] = useState<LockedDrone | null>(() => {
    if (!initialMission.droneId || !initialMission.droneAssignmentId)
      return null
    const candidate =
      suggestions.topDrones.find((d) => d.code === initialMission.droneId) ??
      null
    return {
      candidate,
      code: initialMission.droneId,
      name: candidate?.name ?? initialMission.droneId,
      assignmentId: initialMission.droneAssignmentId,
    }
  })
  // Phase 2: operator selection
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null)
  const [lockingDrone, setLockingDrone] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [droneError, setDroneError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [rejectedOpen, setRejectedOpen] = useState(false)
  const [releaseModal, setReleaseModal] = useState(false)

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const selectedOperatorCandidate = suggestions.topOperators.find(
    (o) => o.code === selectedOperator,
  )

  async function handleLockDrone(droneCode: string) {
    setLockingDrone(true)
    setDroneError(null)
    try {
      const updated = await missionsApi.assignDrone(mission.id, droneCode)
      setMission(updated)
      const candidate =
        suggestions.topDrones.find((d) => d.code === droneCode) ?? null
      setLockedDrone({
        candidate,
        code: droneCode,
        name: candidate?.name ?? droneCode,
        assignmentId: updated.droneAssignmentId ?? '',
      })
    } catch (err) {
      setDroneError(err instanceof ApiError ? err.message : t.cannotSelectDrone)
    } finally {
      setLockingDrone(false)
    }
  }

  async function handleAssignOperator() {
    if (!lockedDrone || !selectedOperator) return
    setAssigning(true)
    setAssignError(null)
    try {
      const updated = await missionsApi.assignOperator(
        mission.id,
        selectedOperator,
      )
      setMission(updated)
      const name = selectedOperatorCandidate?.fullName ?? selectedOperator
      setToast(t.assignSuccess(name))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setAssignError(err.message)
      } else {
        setAssignError(err instanceof ApiError ? err.message : t.assignFailed)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleAutoAssign() {
    const topDrone = suggestions.topDrones[0]
    const topOperator = suggestions.topOperators[0]
    if (!topDrone || !topOperator) return
    // Step 1: lock drone
    setLockingDrone(true)
    setDroneError(null)
    let updated: Mission
    try {
      updated = await missionsApi.assignDrone(mission.id, topDrone.code)
      setMission(updated)
      setLockedDrone({
        candidate: topDrone,
        code: topDrone.code,
        name: topDrone.name,
        assignmentId: updated.droneAssignmentId ?? '',
      })
    } catch (err) {
      setDroneError(err instanceof ApiError ? err.message : t.cannotSelectDrone)
      setLockingDrone(false)
      return
    }
    setLockingDrone(false)
    // Step 2: assign operator
    setAssigning(true)
    setAssignError(null)
    try {
      const afterOp = await missionsApi.assignOperator(
        mission.id,
        topOperator.code,
      )
      setMission(afterOp)
      setSelectedOperator(topOperator.code)
      setToast(t.autoAssignSuccess(topDrone.name, topOperator.fullName))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setAssignError(err.message)
      } else {
        setAssignError(err instanceof ApiError ? err.message : t.assignFailed)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleRelease(reason: string) {
    if (mission.droneAssignmentId) {
      await missionsApi.releaseAssignment(
        mission.id,
        mission.droneAssignmentId,
        reason,
      )
    }
    if (mission.operatorAssignmentId) {
      await missionsApi.releaseAssignment(
        mission.id,
        mission.operatorAssignmentId,
        reason,
      )
    }
    setReleaseModal(false)
    setLockedDrone(null)
    setSelectedOperator(null)
    onMissionChanged()
  }

  const bothAssigned = Boolean(mission.droneId && mission.operatorId)
  const assignedStaffCount = mission.operatorId ? 1 : 0

  return (
    <div className="odm-mgr-dash">
      {/* Toast notification */}
      <DispatchToast toast={toast} />

      <DispatchHead setupMode={setupMode} mission={mission} />

      {setupMode ? (
        <OrderWorkflowStepper currentStep={bothAssigned ? 7 : 6} />
      ) : null}

      <MissionBriefCard mission={mission} suggestions={suggestions} />

      <InfeasibleCard suggestions={suggestions} />

      {droneError ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {droneError}
        </div>
      ) : null}

      {assignError ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {assignError}
        </div>
      ) : null}

      {/* ── Bước 1: chọn drone ─────────────────────────────────────────────── */}
      {!lockedDrone ? (
        <DroneStepCard
          suggestions={suggestions}
          lockingDrone={lockingDrone}
          handleLockDrone={handleLockDrone}
        />
      ) : (
        <>
          {/* Locked drone card */}
          <LockedDroneStep lockedDrone={lockedDrone} />

          {/* ── Bước 2: chọn phi công ──────────────────────────────────────── */}
          <OperatorStepCard
            suggestions={suggestions}
            selectedOperator={selectedOperator}
            setSelectedOperator={setSelectedOperator}
          />
        </>
      )}

      <RejectedCandidatesCard
        setRejectedOpen={setRejectedOpen}
        rejectedOpen={rejectedOpen}
        suggestions={suggestions}
      />

      <TimelineCard timeline={suggestions.timeline} />

      <DispatchBottomBar
        setReleaseModal={setReleaseModal}
        bothAssigned={bothAssigned}
        lockedDrone={lockedDrone}
        handleAutoAssign={handleAutoAssign}
        lockingDrone={lockingDrone}
        assigning={assigning}
        suggestions={suggestions}
        handleAssignOperator={handleAssignOperator}
        selectedOperator={selectedOperator}
      />

      {releaseModal ? (
        <ReleaseModal
          onClose={() => setReleaseModal(false)}
          onConfirm={handleRelease}
        />
      ) : null}

      <SetupSummary
        setupMode={setupMode}
        mission={mission}
        suggestions={suggestions}
        assignedStaffCount={assignedStaffCount}
        bothAssigned={bothAssigned}
        setToast={setToast}
      />
    </div>
  )
}

import type { OrderDispatchContext } from '../orderDispatchContext'
import { useI18n } from '../../../../../shared/i18n'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionApi } from '../../../../mission/api/missionApi'
import { droneApi } from '../../../../staff/api/droneApi'
import { operatorApi } from '../../../../staff/api/operatorApi'
import { useState, useRef, useEffect } from 'react'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import { type DispatchStep, missionRoles } from '../liveDispatchHelpers'
import {
  planningError,
  resourceAssignmentConflict,
} from '../../../lib/planningErrors'
import { ApiError } from '../../../../../shared/api/httpClient'
import { StateView } from '../../../../../shared/components/odm/StateView'
import { liveDispatchContentMessages } from './LiveDispatchContent.messages'
import { ResourcesChecking } from './ResourcesChecking'
import { MissionNotAssignable } from './MissionNotAssignable'
import { DispatchWizardView } from './DispatchWizardView'

export function LiveDispatchContent({
  missionId,
  orderContext,
}: {
  missionId: string
  orderContext?: OrderDispatchContext
}) {
  const { t } = useI18n(liveDispatchContentMessages)
  const mission = useApiQuery(
    () => missionApi.getMissionById(missionId),
    [missionId, orderContext?.scheduledStartAt, orderContext?.scheduledEndAt],
  )
  const currentMission =
    mission.data?.id === missionId ? mission.data : undefined
  const start = currentMission?.scheduledStartAt
  const end = currentMission?.scheduledEndAt
  const scope = JSON.stringify([missionId, start, end])
  const validWindow = Boolean(
    start && end && new Date(start).getTime() < new Date(end).getTime(),
  )
  const availability = useApiQuery(async () => {
    if (!validWindow) return null
    const [devices, people] = await Promise.all([
      droneApi.getAvailable(missionId),
      operatorApi.getAvailable(missionId),
    ])
    return { scope, devices, people }
  }, [scope, validWindow])
  const resourcesReady =
    !mission.loading &&
    !mission.error &&
    validWindow &&
    !availability.loading &&
    !availability.error &&
    availability.data?.scope === scope
  const drones = {
    data: resourcesReady ? availability.data?.devices : undefined,
    reload: availability.reload,
  }
  const operators = {
    data: resourcesReady ? availability.data?.people : undefined,
    reload: availability.reload,
  }
  const [droneIds, setDroneIds] = useState<string[]>(
    orderContext?.initialDevices ?? [],
  )
  const [staffByRole, setStaffByRole] = useState<
    Partial<Record<MissionStaffRole, string[]>>
  >(orderContext?.initialStaff ?? {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<DispatchStep>(
    orderContext?.initialStep ?? 'staff',
  )
  const [openStaffRole, setOpenStaffRole] = useState<MissionStaffRole | null>(
    null,
  )
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)
  const conflictStep = useRef<'staff' | 'device' | null>(null)
  useEffect(() => {
    if (!resourcesReady) return
    const deviceSet = new Set(availability.data?.devices.map((item) => item.id))
    const staffSet = new Set(availability.data?.people.map((item) => item.id))
    const deviceInvalid = droneIds.some((id) => !deviceSet.has(id))
    const staffInvalid = missionRoles.some((role) =>
      (staffByRole[role] ?? []).some((id) => !staffSet.has(id)),
    )
    if (deviceInvalid)
      setDroneIds((ids) => ids.filter((id) => deviceSet.has(id)))
    if (staffInvalid)
      setStaffByRole((crew) =>
        Object.fromEntries(
          missionRoles.map((role) => [
            role,
            (crew[role] ?? []).filter((id) => staffSet.has(id)),
          ]),
        ),
      )
    if (deviceInvalid || staffInvalid || conflictStep.current) {
      const step =
        conflictStep.current === 'device'
          ? 'device'
          : staffInvalid
            ? 'staff'
            : deviceInvalid
              ? 'device'
              : conflictStep.current!
      setActiveStep(step)
      setOpenStaffRole(null)
      setDevicePickerOpen(false)
      setError(
        deviceInvalid || staffInvalid
          ? step === 'staff'
            ? t.staffAvailabilityChanged
            : t.deviceAvailabilityChanged
          : t.resourceAvailabilityChanged,
      )
      conflictStep.current = null
    }
  }, [
    resourcesReady,
    availability.data,
    droneIds,
    staffByRole,
    t.staffAvailabilityChanged,
    t.deviceAvailabilityChanged,
    t.resourceAvailabilityChanged,
  ])

  const hasAllRoles = missionRoles.every(
    (role) => (staffByRole[role] ?? []).length > 0,
  )

  const dirty = Boolean(
    orderContext &&
    (JSON.stringify(droneIds) !== JSON.stringify(orderContext.initialDevices) ||
      missionRoles.some(
        (role) =>
          JSON.stringify(staffByRole[role] ?? []) !==
          JSON.stringify(orderContext.initialStaff[role] ?? []),
      )),
  )
  const draftCallback = orderContext?.onDraftState
  useEffect(() => {
    draftCallback?.(dirty, busy)
  }, [dirty, busy, draftCallback])
  const globalStepCallback = orderContext?.onGlobalStep
  useEffect(() => {
    globalStepCallback?.(activeStep === 'confirm' ? 7 : 6)
  }, [activeStep, globalStepCallback])

  async function assign() {
    if (
      busy ||
      !resourcesReady ||
      (orderContext &&
        (!orderContext.canAssign ||
          mission.data?.id !== missionId ||
          mission.data.orderId !== orderContext.orderId))
    )
      return
    if (droneIds.length === 0 || !hasAllRoles) {
      setError(t.selectDroneAndOperator)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneIds, staffByRole)
      orderContext?.onAssigned()
      mission.reload()
      availability.reload()
    } catch (cause) {
      setError(planningError(cause))
      if (resourceAssignmentConflict(cause)) {
        conflictStep.current =
          cause instanceof ApiError && cause.path.includes('assign-device')
            ? 'device'
            : 'staff'
        setActiveStep(conflictStep.current)
      }
      orderContext?.onChanged()
      availability.reload()
      mission.reload()
    } finally {
      setBusy(false)
    }
  }

  if (
    mission.loading ||
    availability.loading ||
    (validWindow && !availability.error && availability.data?.scope !== scope)
  ) {
    return <ResourcesChecking activeStep={activeStep} />
  }
  if (mission.error || availability.error || !mission.data || !resourcesReady) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={
          new Error(!validWindow ? t.scheduleRequired : t.khongTheTaiNguonLuc)
        }
        onRetry={() => {
          mission.reload()
          availability.reload()
        }}
      />
    )
  }

  const current = mission.data
  if (
    orderContext &&
    (current.id !== missionId ||
      current.orderId !== orderContext.orderId ||
      !['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        current.status,
      ))
  )
    return <MissionNotAssignable orderContext={orderContext} />
  return (
    <DispatchWizardView
      orderContext={orderContext}
      current={current}
      busy={busy}
      error={error}
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      staffByRole={staffByRole}
      setStaffByRole={setStaffByRole}
      operators={operators}
      drones={drones}
      droneIds={droneIds}
      setDroneIds={setDroneIds}
      openStaffRole={openStaffRole}
      setOpenStaffRole={setOpenStaffRole}
      devicePickerOpen={devicePickerOpen}
      setDevicePickerOpen={setDevicePickerOpen}
      setError={setError}
      hasAllRoles={hasAllRoles}
      assign={assign}
    />
  )
}

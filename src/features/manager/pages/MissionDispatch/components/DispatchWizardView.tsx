import {
  dispatchSteps,
  fmtDateTime,
  missionRoles,
} from '../liveDispatchHelpers'
import { DispatchPageHead } from './DispatchPageHead'
import { AssignedResult } from './AssignedResult'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { DispatchWizardTabs } from './DispatchWizardTabs'
import { OrderInfoStep } from './OrderInfoStep'
import { MissionImplementationStep } from './MissionImplementationStep'
import { StaffStep } from './StaffStep'
import { DeviceStep } from './DeviceStep'
import { ConfirmStep } from './ConfirmStep'
import { DispatchActionBar } from './DispatchActionBar'
import type { OrderDispatchContext } from '../orderDispatchContext'
import type { DispatchStep } from '../liveDispatchHelpers'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { Mission } from '../../../../mission/types/mission'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { AvailableDrone } from '../../../../staff/api/droneApi'

import { useI18n } from '../../../../../shared/i18n'
import { dispatchWizardViewMessages } from './DispatchWizardView.messages'

export function DispatchWizardView({
  orderContext,
  current,
  busy,
  activeStep,
  setActiveStep,
  staffByRole,
  operators,
  openStaffRole,
  setOpenStaffRole,
  setStaffByRole,
  setError,
  drones,
  droneIds,
  devicePickerOpen,
  setDevicePickerOpen,
  setDroneIds,
  error,
  hasAllRoles,
  assign,
}: {
  orderContext: OrderDispatchContext | undefined
  current: Mission
  busy: boolean
  activeStep: DispatchStep
  setActiveStep: Dispatch<SetStateAction<DispatchStep>>
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  operators: { data: AvailableOperator[] | undefined; reload: () => void }
  openStaffRole: MissionStaffRole | null
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  setStaffByRole: Dispatch<
    SetStateAction<Partial<Record<MissionStaffRole, string[]>>>
  >
  setError: Dispatch<SetStateAction<string | null>>
  drones: { data: AvailableDrone[] | undefined; reload: () => void }
  droneIds: string[]
  devicePickerOpen: boolean
  setDevicePickerOpen: Dispatch<SetStateAction<boolean>>
  setDroneIds: Dispatch<SetStateAction<string[]>>
  error: string | null
  hasAllRoles: boolean
  assign: () => Promise<void>
}) {
  const { t } = useI18n(dispatchWizardViewMessages)
  const assignable = orderContext
    ? ['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        current.status,
      )
    : current.status === 'RESOURCE_ASSIGNING' || current.status === 'CREATED'
  const activeStepIndex = dispatchSteps.indexOf(activeStep)
  const selectedDrones = (drones.data ?? []).filter((drone) =>
    droneIds.includes(drone.id),
  )
  const assignedDeviceText =
    selectedDrones.length > 0
      ? selectedDrones.map((drone) => drone.label).join(', ')
      : (current.droneCode ??
        current.deviceCode ??
        current.deviceId ??
        current.droneId ??
        '—')
  const goNext = () => {
    if (activeStep === 'mission' && orderContext) {
      if (orderContext.onMissionNext()) setActiveStep('staff')
      return
    }
    setActiveStep(
      dispatchSteps[Math.min(activeStepIndex + 1, dispatchSteps.length - 1)],
    )
  }
  const goPrevious = () => {
    if (activeStep === 'staff' && orderContext) {
      orderContext.onReturn()
      return
    }
    setActiveStep(dispatchSteps[Math.max(activeStepIndex - 1, 0)])
  }
  const globalStep = activeStep === 'confirm' ? 4 : 3
  const roleSummary = missionRoles.map((role) => ({
    role,
    names: (staffByRole[role] ?? [])
      .map(
        (id) => (operators.data ?? []).find((item) => item.id === id)?.fullName,
      )
      .filter(Boolean) as string[],
  }))
  const missingRoles = roleSummary.filter(
    (item) => item.names.length === 0,
  ).length
  const stepHint: Record<DispatchStep, string> = {
    order: t.orderFooterHint,
    mission: t.missionFooterHint,
    staff: t.staffFooterHint,
    device: t.deviceFooterHint,
    confirm: t.footerHint,
  }
  const scheduleText = `${fmtDateTime(current.scheduledStartAt)}${
    current.scheduledEndAt ? ` → ${fmtDateTime(current.scheduledEndAt)}` : ''
  }`

  const selectedStaffIds = missionRoles.flatMap(
    (role) => staffByRole[role] ?? [],
  )
  return (
    <div className="odm-or">
      <DispatchPageHead
        orderContext={orderContext}
        current={current}
        busy={busy}
      />

      {!assignable ? (
        <AssignedResult
          current={current}
          scheduleText={scheduleText}
          assignedDeviceText={assignedDeviceText}
        />
      ) : (
        <>
          <OrderWorkflowStepper currentStep={globalStep} />

          <DispatchWizardTabs
            activeStep={activeStep}
            onStep={(step) => {
              if (orderContext && (step === 'order' || step === 'mission'))
                orderContext.onReturn(step === 'order')
              else setActiveStep(step)
            }}
          />

          {activeStep === 'order' && <OrderInfoStep current={current} />}

          {activeStep === 'mission' &&
            orderContext &&
            orderContext.missionSelection}
          {activeStep === 'mission' && !orderContext && (
            <MissionImplementationStep
              current={current}
              scheduleText={scheduleText}
            />
          )}

          {activeStep === 'staff' && (
            <StaffStep
              missingRoles={missingRoles}
              staffByRole={staffByRole}
              operators={operators}
              openStaffRole={openStaffRole}
              setOpenStaffRole={setOpenStaffRole}
              setStaffByRole={setStaffByRole}
              setError={setError}
              selectedStaffIds={selectedStaffIds}
            />
          )}

          {activeStep === 'device' && (
            <DeviceStep
              selectedDrones={selectedDrones}
              drones={drones}
              droneIds={droneIds}
              devicePickerOpen={devicePickerOpen}
              setDevicePickerOpen={setDevicePickerOpen}
              setOpenStaffRole={setOpenStaffRole}
              setDroneIds={setDroneIds}
              setError={setError}
            />
          )}

          {activeStep === 'confirm' && (
            <ConfirmStep
              current={current}
              scheduleText={scheduleText}
              roleSummary={roleSummary}
              selectedDrones={selectedDrones}
              missingRoles={missingRoles}
            />
          )}

          {error && (
            <div role="alert" className="odm-or-error">
              {error}
            </div>
          )}

          <DispatchActionBar
            stepHint={stepHint}
            activeStep={activeStep}
            activeStepIndex={activeStepIndex}
            goPrevious={goPrevious}
            goNext={goNext}
            busy={busy}
            droneIds={droneIds}
            hasAllRoles={hasAllRoles}
            orderContext={orderContext}
            assign={assign}
          />
        </>
      )}
    </div>
  )
}

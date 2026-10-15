import { useCallback, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../api/planningApi'
import { ordersApi } from '../../api/ordersApi'
import { LiveDispatchPage } from '../../pages/MissionDispatch/components/LiveDispatchPage'
import { staffRoleLabel } from './missionDetailHelpers'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { usePlanningConfirmation } from './usePlanningConfirmation'
import { MissionSelectionCard } from './MissionSelectionCard'
import { NotEligibleNotice } from './NotEligibleNotice'
import { MissionLoadFailedNotice } from './MissionLoadFailedNotice'
import { WizardMissionStep } from './WizardMissionStep'
import { useI18n } from '../../../../shared/i18n'
import { orderResourceAssignmentWizardMessages } from './OrderResourceAssignmentWizard.messages'

const roles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

/** Order orchestration only. Staff/device/review remain LiveDispatchPage's original wizard. */
export function OrderResourceAssignmentWizard({
  orderId,
  initialMissionId,
  onClose,
  returnLabel: returnLabelProp,
}: {
  orderId: string
  initialMissionId?: string
  onClose: () => void
  returnLabel?: string
}) {
  const { t, lang } = useI18n(orderResourceAssignmentWizardMessages)
  const returnLabel = returnLabelProp ?? t.backToOrderPlan

  const confirmation = usePlanningConfirmation()
  const query = useApiQuery(
    async (signal) => {
      const [plan, missions, order] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        ordersApi.getOrder(orderId, signal),
      ])
      const stops = await Promise.all(
        missions.map(async (mission) => {
          try {
            return await planningApi.getSafeStop(mission.id, signal)
          } catch {
            return null
          }
        }),
      )
      return { plan, missions, order, stops }
    },
    [orderId],
  )
  const [candidateId, setCandidateId] = useState<string | null>(
    initialMissionId ?? null,
  )
  const [activeId, setActiveId] = useState<string | null>(
    initialMissionId ?? null,
  )
  const [draft, setDraft] = useState(false)
  const [busy, setBusy] = useState(false)
  const updateDraft = useCallback((dirty: boolean, saving: boolean) => {
    setDraft(dirty)
    setBusy(saving)
  }, [])
  const data = query.data
  const effective =
    data?.missions.filter((mission) => mission.status !== 'CANCELLED') ?? []
  const allAssigned =
    !query.loading &&
    !query.error &&
    data?.plan.planStatus === 'FINALIZED' &&
    effective.length > 0 &&
    effective.every(
      (mission) =>
        mission.status !== 'FAILED' && assignmentReadiness(mission).complete,
    )
  function eligible(id: string) {
    const mission = data?.missions.find((m) => m.id === id)
    const scope = data?.plan.missions.find((m) => m.missionId === id)
    const stop = data?.stops.find((s) => s?.missionId === id)
    return Boolean(
      !query.loading &&
      !query.error &&
      mission?.orderId === orderId &&
      data?.plan.planStatus === 'FINALIZED' &&
      ['APPROVED', 'IN_PROGRESS'].includes(data.order.status) &&
      (scope?.finalizedPlanRevision ?? 0) > 0 &&
      ['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        mission.status,
      ) &&
      stop &&
      !stop.status &&
      !stop.requestedAt,
    )
  }
  async function leave(close = false) {
    if (
      busy ||
      (draft &&
        !(await confirmation.confirm({
          title: t.discardUnsavedChanges,
          body: t.phanCongDaLuuVan,
          action: t.discardChanges,
        })))
    )
      return
    setActiveId(null)
    setDraft(false)
    if (close || initialMissionId) onClose()
  }
  function next() {
    if (!candidateId || !eligible(candidateId) || busy) return false
    if (draft && activeId !== candidateId) return false
    setActiveId(candidateId)
    if (activeId !== candidateId) setDraft(false)
    return true
  }
  const selection = (
    <MissionSelectionCard
      busy={busy}
      query={query}
      data={data}
      eligible={eligible}
      orderId={orderId}
      candidateId={candidateId}
      setCandidateId={setCandidateId}
    />
  )
  const current = data?.missions.find((m) => m.id === activeId)
  if (current && !query.loading && !eligible(current.id))
    return (
      <NotEligibleNotice
        orderId={orderId}
        query={query}
        onClose={onClose}
        returnLabel={returnLabel}
      />
    )
  if (activeId && !current && !query.loading)
    return (
      <MissionLoadFailedNotice
        query={query}
        onClose={onClose}
        returnLabel={returnLabel}
      />
    )
  if (current) {
    const initialStaff: Partial<Record<MissionStaffRole, string[]>> = {}
    for (const role of roles)
      initialStaff[role] = [
        ...new Set(
          current.staffAssignments
            ?.filter(
              (person) =>
                person.assignedRole === role &&
                person.responseStatus !== 'REJECTED',
            )
            .map((person) => person.staffId) ?? [],
        ),
      ]
    const deviceId = current.deviceId || current.droneId
    return (
      <>
        {confirmation.dialog}
        <LiveDispatchPage
          key={current.id}
          missionId={current.id}
          orderContext={{
            orderId,
            missionScoped: Boolean(initialMissionId),
            returnLabel,
            initialStep: assignmentReadiness(current).step,
            canAssign: eligible(current.id),
            missionSelection: selection,
            onMissionNext: next,
            onReturn: (toOrigin = false) => leave(toOrigin),
            onAssigned: () => {
              setActiveId(null)
              setDraft(false)
              setBusy(false)
              query.reload()
              if (initialMissionId) onClose()
            },
            onChanged: query.reload,
            onDraftState: updateDraft,
            initialDevices: deviceId ? [deviceId] : [],
            scheduledStartAt: current.scheduledStartAt,
            scheduledEndAt: current.scheduledEndAt,
            initialStaff,
            assignedPeople: [
              ...new Map(
                (current.staffAssignments ?? []).map((person) => [
                  person.staffId,
                  {
                    id: person.staffId,
                    fullName:
                      person.staffName ||
                      person.staffEmail ||
                      staffRoleLabel(person.assignedRole, lang),
                    email: person.staffEmail || '',
                  },
                ]),
              ).values(),
            ],
            assignedDevices: deviceId
              ? [
                  {
                    id: deviceId,
                    label:
                      current.deviceCode ||
                      current.droneCode ||
                      current.deviceName ||
                      t.assignedDevice,
                  },
                ]
              : [],
          }}
        />
      </>
    )
  }
  return (
    <WizardMissionStep
      confirmation={confirmation}
      busy={busy}
      leave={leave}
      returnLabel={returnLabel}
      selection={selection}
      allAssigned={allAssigned}
      onClose={onClose}
      candidateId={candidateId}
      eligible={eligible}
      next={next}
    />
  )
}

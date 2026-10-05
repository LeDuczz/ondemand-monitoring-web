export type ChecklistExecutionStatus =
  'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'UNABLE_TO_VERIFY'
export type ChecklistAssessmentStatus =
  'NOT_ASSESSED' | 'COMPLIANT' | 'NON_COMPLIANT'

export type MissionChecklistExecution = {
  id: string
  orderChecklistItemId: string
  content: string
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_CUSTOM'
  executionStatus: ChecklistExecutionStatus
  assessmentStatus: ChecklistAssessmentStatus
  observation: string | null
  unableToVerifyReason: string | null
  startedAt: string | null
  completedAt: string | null
  lastModifiedBy: string | null
  createdAt: string
  updatedAt: string | null
  version: number
}

export type MissionChecklistResponse = {
  missionId: string
  legacySnapshot: boolean
  readyForSubmission: boolean
  executions: MissionChecklistExecution[]
}

export type ChecklistExecutionUpdateRequest = {
  expectedVersion: number
  executionStatus: ChecklistExecutionStatus
  assessmentStatus: ChecklistAssessmentStatus
  observation: string | null
  unableToVerifyReason: string | null
}

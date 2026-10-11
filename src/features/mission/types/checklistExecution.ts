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
  evidencePolicyVersion?: number
  minimumEvidenceCount?: number
  eligibleEvidenceCount?: number
  evidenceRequirementSatisfied?: boolean
  evidenceReady?: boolean
  blockingReasons?: EvidenceBlockingReason[]
  evidence?: MissionChecklistEvidence[]
}

export type MissionChecklistResponse = {
  missionId: string
  legacySnapshot: boolean
  readyForSubmission: boolean
  executions: MissionChecklistExecution[]
  checklistEvidenceReady?: boolean
  readyForMissionCompletion?: boolean
  readyForFinalApproval?: boolean
  blockingReasons?: EvidenceBlockingReason[]
}

export type EvidenceBlockingReason =
  | 'EVIDENCE_SOURCE_NOT_ELIGIBLE'
  | 'EVIDENCE_TYPE_NOT_ELIGIBLE'
  | 'MEDIA_REJECTED'
  | 'MEDIA_NOT_VALIDATED'
  | 'MEDIA_APPROVAL_REQUIRED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'EXECUTION_NOT_TERMINAL'
  | 'UNABLE_REASON_REQUIRED'
  | 'CHECKLIST_INTEGRITY_INVALID'
export type EvidenceMediaStatus =
  | 'UPLOAD_PENDING'
  | 'UPLOADING'
  | 'VALIDATING'
  | 'RETRY_REQUIRED'
  | 'MANUAL_UPLOAD_REQUIRED'
  | 'PENDING_MANAGER_APPROVAL'
  | 'AVAILABLE'
  | 'REJECTED'
export type EvidenceEligibility = {
  eligibleForOperationalReadiness: boolean
  eligibleForFinalApproval: boolean
  ineligibilityReason: EvidenceBlockingReason | null
}
export type MissionChecklistEvidence = EvidenceEligibility & {
  evidenceId: string
  mediaId: string
  executionId: string
  attachedBy: string
  attachedAt: string
  note: string | null
  version: number
  mediaType: string
  contentType: string
  fileName: string
  mediaStatus: EvidenceMediaStatus | null
  sourceType: string | null
  capturedAt: string
  sourceCapturedAt: string | null
  validatedAt: string | null
  previewUrl: string | null
  urlExpiresAt: string | null
}
export type EvidenceCandidate = EvidenceEligibility & {
  mediaId: string
  fileName: string
  mediaType: string
  contentType: string
  status: EvidenceMediaStatus | null
  sourceType: string | null
  capturedAt: string
  validatedAt: string | null
  attachable: boolean
  previewUrl: string | null
  urlExpiresAt: string | null
  alreadyAttachedExecutionIds: string[]
}

export type ChecklistExecutionUpdateRequest = {
  expectedVersion: number
  executionStatus: ChecklistExecutionStatus
  assessmentStatus: ChecklistAssessmentStatus
  observation: string | null
  unableToVerifyReason: string | null
}

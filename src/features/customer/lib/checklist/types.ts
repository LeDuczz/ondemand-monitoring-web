import type { RequiredEvidenceType } from '../../../../shared/types/domain'

export type ServiceChecklistItem = {
  id: string
  serviceId: string
  checklistId: string
  content: string
  displayOrder: number
  checklistVersion: number
  serviceActive: boolean
  checklistActive: boolean
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
}

export type ChecklistInput = {
  sourceChecklistId?: string
  expectedChecklistVersion?: number
  contentOverride?: string
  minimumEvidenceCount: number
  requiredEvidenceType: RequiredEvidenceType
}

export type ChecklistSnapshot = {
  id: string
  sourceChecklistId: string | null
  content: string
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_CUSTOM'
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
}

export type ChecklistRow = {
  key: string
  sourceChecklistId: string | null
  version: number | null
  originalContent: string
  content: string
  selected: boolean
  minimumEvidenceCount: number
  requiredEvidenceType: RequiredEvidenceType
}

export const normalizeContent = (content: string) =>
  // Match Java's Unicode (?U)\\s: NEL is whitespace, but BOM is not.
  content
    .normalize('NFC')
    .replace(/\p{White_Space}+/gu, ' ')
    .replace(/^ +| +$/g, '')

export function serializeChecklist(rows: ChecklistRow[]): ChecklistInput[] {
  return rows
    .filter((row) => row.selected)
    .map((row) => {
      const content = normalizeContent(row.content)
      const evidenceRequirements = {
        minimumEvidenceCount: row.minimumEvidenceCount,
        requiredEvidenceType: row.requiredEvidenceType,
      }
      if (!row.sourceChecklistId)
        return { contentOverride: content, ...evidenceRequirements }
      return {
        sourceChecklistId: row.sourceChecklistId,
        expectedChecklistVersion: row.version!,
        ...evidenceRequirements,
        ...(content !== normalizeContent(row.originalContent)
          ? { contentOverride: content }
          : {}),
      }
    })
}

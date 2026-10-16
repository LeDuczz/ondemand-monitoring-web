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
  /** Effective media allowance for this service (association override, else the checklist). */
  includedImageCount?: number
  includedVideoCount?: number
  required?: boolean
}

export type CatalogChecklistItem = {
  id: string
  content: string
  version: number
  includedImageCount: number
  includedVideoCount: number
}

/**
 * Either the explicit evidence requirement (checklists without media) or the requested media counts.
 * The backend rejects both together and derives the acceptance thresholds from the requested counts.
 */
export type ChecklistInput = {
  sourceChecklistId?: string
  expectedChecklistVersion?: number
  contentOverride?: string
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  requestedImageCount?: number
  requestedVideoCount?: number
}

export type ChecklistSnapshot = {
  id: string
  sourceChecklistId: string | null
  content: string
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_SELECTED' | 'CUSTOMER_CUSTOM'
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  evidencePolicyVersion?: number
  minimumImageCount?: number
  minimumVideoCount?: number
  includedImageCountSnapshot?: number
  includedVideoCountSnapshot?: number
  requestedImageCount?: number
  requestedVideoCount?: number
  pricingProfileSnapshot?: string | null
  basePriceSnapshot?: number
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
  /** Allowance configured by the Admin; 0 for a custom checklist (the backend applies the custom policy). */
  includedImageCount: number
  includedVideoCount: number
  /** What the customer asks for. Defaults to the included allowance. */
  requestedImageCount: number
  requestedVideoCount: number
  /** The checklist cannot be removed from the order. */
  mandatory: boolean
  /** True only when the checklist was automatically supplied by the selected package. */
  packageItem?: boolean
}

/** A row is priced and verified by media counts as soon as it has an allowance or the customer asks for media. */
export const usesMedia = (row: ChecklistRow) =>
  row.includedImageCount + row.includedVideoCount > 0 ||
  row.requestedImageCount + row.requestedVideoCount > 0

export const extraMedia = (requested: number, included: number) =>
  Math.max(0, requested - included)

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
      const evidenceRequirements = usesMedia(row)
        ? {
            requestedImageCount: row.requestedImageCount,
            requestedVideoCount: row.requestedVideoCount,
          }
        : {
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

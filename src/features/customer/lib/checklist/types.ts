export type ServiceChecklistItem = {
  id: string
  serviceId: string
  checklistId: string
  content: string
  displayOrder: number
  checklistVersion: number
  serviceActive: boolean
  checklistActive: boolean
}

export type ChecklistInput = {
  sourceChecklistId?: string
  expectedChecklistVersion?: number
  contentOverride?: string
}

export type ChecklistSnapshot = {
  id: string
  sourceChecklistId: string | null
  content: string
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_CUSTOM'
}

export type ChecklistRow = {
  key: string
  sourceChecklistId: string | null
  version: number | null
  originalContent: string
  content: string
  selected: boolean
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
      if (!row.sourceChecklistId) return { contentOverride: content }
      return {
        sourceChecklistId: row.sourceChecklistId,
        expectedChecklistVersion: row.version!,
        ...(content !== normalizeContent(row.originalContent)
          ? { contentOverride: content }
          : {}),
      }
    })
}

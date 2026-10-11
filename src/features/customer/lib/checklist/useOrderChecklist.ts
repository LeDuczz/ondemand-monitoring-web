import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { customerApi } from '../../api/customerApi'
import { checklistError } from './errors'
import { checklistMessages } from './messages'
import {
  normalizeContent,
  serializeChecklist,
  type ChecklistRow,
} from './types'

type State = {
  serviceId: string
  status: 'loading' | 'ready' | 'error' | 'stale'
  rows: ChecklistRow[]
  error: unknown
}

/** Scoped to one creation flow, never shared with historical order details. */
export function useOrderChecklist(serviceId: string) {
  const { t } = useI18n(checklistMessages)
  const [state, setState] = useState<State | null>(null)
  const [revision, setRevision] = useState(0)
  const sequence = useRef(0)
  const customSequence = useRef(0)

  useEffect(() => {
    const requestId = ++sequence.current
    const controller = new AbortController()
    if (!serviceId) setState(null)
    if (serviceId) {
      setState({ serviceId, status: 'loading', rows: [], error: null })
      customerApi
        .getServiceChecklist(serviceId, controller.signal)
        .then((items) => {
          if (controller.signal.aborted || requestId !== sequence.current)
            return
          // Versions belong to catalog items, NOT the service association.
          if (
            items.some(
              (item) =>
                item.serviceId !== serviceId ||
                !item.checklistId?.trim() ||
                !Number.isSafeInteger(item.checklistVersion) ||
                item.checklistVersion < 0,
            ) ||
            new Set(items.map((item) => item.checklistId)).size !== items.length
          ) {
            throw new Error('Invalid template response')
          }
          const rows = [...items]
            .filter((item) => item.serviceActive && item.checklistActive)
            .sort(
              (a, b) =>
                a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
            )
            .map((item) => ({
              key: item.id,
              sourceChecklistId: item.checklistId,
              version: item.checklistVersion,
              originalContent: item.content,
              content: item.content,
              selected: true,
            }))
          setState({ serviceId, status: 'ready', rows, error: null })
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId !== sequence.current)
            return
          setState({
            serviceId,
            status: 'error',
            rows: [],
            error,
          })
        })
    }
    return () => controller.abort()
  }, [serviceId, revision])

  const current = state?.serviceId === serviceId ? state : null
  const status = !serviceId ? 'idle' : (current?.status ?? 'loading')
  const rows = current?.rows ?? []
  const selected = rows.filter((row) => row.selected)
  let validation: string | null = null
  if (selected.length > 100) validation = t.limit
  else if (
    selected.some((row) => {
      const length = normalizeContent(row.content).length
      return length < 1 || length > 500
    })
  )
    validation = t.length
  else if (
    new Set(selected.map((row) => normalizeContent(row.content).toLowerCase()))
      .size !== selected.length
  )
    validation = t.duplicate

  function change(
    key: string,
    patch: Partial<Pick<ChecklistRow, 'content' | 'selected'>>,
  ) {
    setState((previous) =>
      previous?.serviceId === serviceId && previous.status === 'ready'
        ? {
            ...previous,
            rows: previous.rows.map((row) =>
              row.key === key ? { ...row, ...patch } : row,
            ),
          }
        : previous,
    )
  }

  return {
    rows,
    status,
    validation,
    error: status === 'error' ? checklistError(current?.error, true) : null,
    selectedCount: selected.length,
    valid: status === 'ready' && !validation,
    change,
    add: () =>
      setState((previous) =>
        previous?.serviceId === serviceId &&
        previous.status === 'ready' &&
        previous.rows.filter((row) => row.selected).length < 100
          ? {
              ...previous,
              rows: [
                ...previous.rows,
                {
                  key: `custom-${++customSequence.current}`,
                  sourceChecklistId: null,
                  version: null,
                  originalContent: '',
                  content: '',
                  selected: true,
                },
              ],
            }
          : previous,
      ),
    remove: (key: string) =>
      setState((previous) =>
        previous?.serviceId === serviceId && previous.status === 'ready'
          ? {
              ...previous,
              rows: previous.rows.filter(
                (row) => row.key !== key || row.sourceChecklistId !== null,
              ),
            }
          : previous,
      ),
    reload: () => {
      setState({ serviceId, status: 'loading', rows: [], error: null })
      setRevision((value) => value + 1)
    },
    markStale: () =>
      setState((previous) =>
        previous?.serviceId === serviceId
          ? { ...previous, status: 'stale', error: t.stale }
          : previous,
      ),
    serialize: () => {
      if (status !== 'ready' || validation)
        throw new Error('Checklist is not ready')
      return serializeChecklist(rows)
    },
  }
}

export type OrderChecklistEditorState = ReturnType<typeof useOrderChecklist>

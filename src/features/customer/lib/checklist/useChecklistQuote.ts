import { useEffect, useState } from 'react'
import {
  checklistPricingApi,
  type CustomerQuoteItem,
  type ChecklistQuoteContext,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import { ApiError } from '../../../../shared/api/httpClient'
import { useI18n } from '../../../../shared/i18n'
import { checklistMessages } from './messages'
import { normalizeContent } from './types'

const DEBOUNCE_MS = 400

export type ChecklistQuoteState = {
  preview: ServicePricePreview | null
  error: { code?: string; message: string } | null
  loading: boolean
}

function inSelectionOrder(
  preview: ServicePricePreview,
  items: CustomerQuoteItem[],
): ServicePricePreview {
  const remaining = [...preview.checklists]
  const checklists = items.flatMap((item) => {
    const index = remaining.findIndex((row) =>
      item.sourceChecklistId
        ? row.checklistId === item.sourceChecklistId
        : row.custom &&
          normalizeContent(row.content) ===
            normalizeContent(item.content ?? ''),
    )
    return index < 0 ? [] : remaining.splice(index, 1)
  })
  return { ...preview, checklists: [...checklists, ...remaining] }
}

/** Debounced backend quote for the current checklist selection. */
export function useChecklistQuote(
  serviceId: string,
  items: CustomerQuoteItem[] | null,
  context?: ChecklistQuoteContext,
): ChecklistQuoteState {
  const { t } = useI18n(checklistMessages)
  const [state, setState] = useState<ChecklistQuoteState>({
    preview: null,
    error: null,
    loading: false,
  })
  const itemsKey = JSON.stringify(items)
  const contextKey = JSON.stringify(context)

  useEffect(() => {
    if (!serviceId || items === null) {
      setState({ preview: null, error: null, loading: false })
      return
    }

    const requestItems = JSON.parse(itemsKey) as CustomerQuoteItem[]
    const requestContext = contextKey
      ? (JSON.parse(contextKey) as ChecklistQuoteContext)
      : undefined
    const controller = new AbortController()
    setState({ preview: null, error: null, loading: true })
    const timer = window.setTimeout(() => {
      const request = requestContext
        ? checklistPricingApi.customerQuote(
            serviceId,
            requestItems,
            controller.signal,
            requestContext,
          )
        : checklistPricingApi.customerQuote(
            serviceId,
            requestItems,
            controller.signal,
          )
      request
        .then((preview) => {
          if (!controller.signal.aborted) {
            setState({
              preview: inSelectionOrder(preview, requestItems),
              error: null,
              loading: false,
            })
          }
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return
          setState({
            preview: null,
            error:
              cause instanceof ApiError
                ? {
                    code: cause.code,
                    message:
                      cause.code === 'MEDIA_PRICING_NOT_CONFIGURED' ||
                      cause.code === 'CUSTOM_CHECKLIST_PRICING_NOT_CONFIGURED'
                        ? cause.message
                        : t.quoteFailed,
                  }
                : { message: t.quoteFailed },
            loading: false,
          })
        })
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [contextKey, itemsKey, serviceId, t.quoteFailed])

  return state
}

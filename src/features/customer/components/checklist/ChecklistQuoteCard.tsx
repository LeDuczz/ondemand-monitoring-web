import { useEffect, useState } from 'react'
import { ApiError } from '../../../../shared/api/httpClient'
import {
  checklistPricingApi,
  type CustomerQuoteItem,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import { PriceBreakdownView } from '../../../../shared/components/odm/PriceBreakdownView'
import { Card } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { checklistMessages } from '../../lib/checklist/messages'

const DEBOUNCE_MS = 400

/**
 * Price of the current selection, always computed by the backend. The client only sends which checklists it wants
 * and how many images/videos; it has no way to send a price.
 */
export function ChecklistQuoteCard({
  serviceId,
  items,
}: {
  serviceId: string
  /** `null` while the form is incomplete. */
  items: CustomerQuoteItem[] | null
}) {
  const { t } = useI18n(checklistMessages)
  const [state, setState] = useState<{
    preview: ServicePricePreview | null
    error: string | null
    loading: boolean
  }>({ preview: null, error: null, loading: false })
  const key = JSON.stringify(items)

  useEffect(() => {
    if (!serviceId || items === null) {
      setState({ preview: null, error: null, loading: false })
      return
    }
    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true, error: null }))
    const timer = window.setTimeout(() => {
      checklistPricingApi
        .customerQuote(serviceId, items, controller.signal)
        .then((preview) => {
          if (!controller.signal.aborted)
            setState({ preview, error: null, loading: false })
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return
          const message =
            cause instanceof ApiError &&
            (cause.code === 'MEDIA_PRICING_NOT_CONFIGURED' ||
              cause.code === 'CUSTOM_CHECKLIST_PRICING_NOT_CONFIGURED')
              ? cause.message
              : t.quoteFailed
          setState({ preview: null, error: message, loading: false })
        })
    }, DEBOUNCE_MS)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
    // `key` stands for the serialised items.
  }, [serviceId, key, t.quoteFailed])

  return (
    <Card title={t.quoteTitle}>
      <p className="checklist-hint">{t.quoteHint}</p>
      {state.loading && <p role="status">{t.quoteLoading}</p>}
      {state.error && (
        <p role="alert" className="co-notice is-danger">
          {state.error}
        </p>
      )}
      {state.preview && <PriceBreakdownView preview={state.preview} />}
    </Card>
  )
}

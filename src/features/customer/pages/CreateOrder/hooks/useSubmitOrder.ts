import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  customerApi,
  type CreateOrderPayload,
} from '../../../api/customerApi'
import { clearStoredDraft } from '../../../lib/createOrder/draftStorage'
import { submitOrderHookMessages } from './useSubmitOrder.messages'

type Options = {
  /** Validates the whole form (step 4); returns false to abort. */
  validate: () => boolean
  buildPayload: () => CreateOrderPayload
  onError: (message: string | null) => void
}

/** Confirm dialog state + `POST /api/orders`. */
export function useSubmitOrder({ validate, buildPayload, onError }: Options) {
  const { t } = useI18n(submitOrderHookMessages)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  async function submit() {
    if (!validate()) {
      setConfirmOpen(false)
      return
    }
    setSubmitting(true)
    onError(null)
    try {
      const result = await customerApi.createOrder(buildPayload())
      clearStoredDraft()
      setConfirmOpen(false)
      setCreatedId(result.id)
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : t.submitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    confirmOpen,
    openConfirm: () => validate() && setConfirmOpen(true),
    closeConfirm: () => !submitting && setConfirmOpen(false),
    submitting,
    createdId,
    submit,
  }
}

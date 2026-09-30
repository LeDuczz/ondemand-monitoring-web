import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { customerApi, type CreateOrderPayload } from '../../../api/customerApi'
import { submitOrderHookMessages } from '../../CreateOrder/hooks/useSubmitOrder.messages'

type Options = {
  /** Validates the whole form; returns false to abort. */
  validate: () => boolean
  buildPayload: () => CreateOrderPayload
  onError: (message: string | null) => void
}

/**
 * Confirm dialog + `POST /api/orders` (BE `OrderCreateRequest`). Unlike the
 * wizard it never touches the wizard's stored draft.
 */
export function useRequestSubmit({ validate, buildPayload, onError }: Options) {
  const { t } = useI18n(submitOrderHookMessages)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  async function submit() {
    if (!validate()) {
      setConfirmOpen(false)
      return
    }
    setSubmitting(true)
    onError(null)
    try {
      const result = await customerApi.createOrder(buildPayload())
      setConfirmOpen(false)
      setCreatedId(result.id)
      setCreatedCode(displayOrderCode(result.orderCode, result.id))
    } catch (error: unknown) {
      onError(error instanceof Error && error.message ? error.message : t.submitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    confirmOpen,
    submitting,
    createdId,
    createdCode,
    submit,
    openConfirm: () => validate() && setConfirmOpen(true),
    closeConfirm: () => !submitting && setConfirmOpen(false),
  }
}

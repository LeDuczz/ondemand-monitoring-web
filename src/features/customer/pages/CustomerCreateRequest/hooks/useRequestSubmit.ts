import { useRef, useState } from 'react'

import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { customerApi, type CreateOrderPayload } from '../../../api/customerApi'
import { checklistError, isStaleChecklist } from '../../../lib/checklist/errors'

type Options = {
  /** Validates the whole form; returns false to abort. */
  validate: () => boolean
  buildPayload: () => CreateOrderPayload
  onError: (message: string | null) => void
  onTemplateChanged?: () => void
}

/**
 * Confirm dialog + `POST /api/orders` (BE `OrderCreateRequest`). Unlike the
 * wizard it never touches the wizard's stored draft.
 */
export function useRequestSubmit({
  validate,
  buildPayload,
  onError,
  onTemplateChanged,
}: Options) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const inFlight = useRef(false)

  async function submit() {
    if (inFlight.current || createdId) return
    if (!validate()) {
      setConfirmOpen(false)
      return
    }
    setSubmitting(true)
    inFlight.current = true
    onError(null)
    try {
      const result = await customerApi.createOrder(buildPayload())
      setConfirmOpen(false)
      setCreatedId(result.id)
      setCreatedCode(displayOrderCode(result.orderCode, result.id))
    } catch (error: unknown) {
      if (isStaleChecklist(error)) {
        onTemplateChanged?.()
        setConfirmOpen(false)
      }
      onError(checklistError(error))
    } finally {
      setSubmitting(false)
      inFlight.current = false
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

import { useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { toOrderDetail } from '../../../lib/orders/mapOrder'
import { cancelOrderModalMessages } from '../components/CancelOrderModal.messages'

/** `GET /api/orders/{id}` plus the mock-only cancel action and its dialog state. */
export function useOrderDetail(orderId: string) {
  const { t } = useI18n(cancelOrderModalMessages)
  const query = useApiQuery(
    (signal) => customerApi.getOrderById(orderId, signal).then(toOrderDetail),
    [orderId],
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  async function cancel() {
    setCancelling(true)
    setCancelError(null)
    try {
      await customerApi.cancelOrder(orderId)
      setConfirmOpen(false)
      query.reload()
    } catch (error: unknown) {
      setCancelError(error instanceof Error && error.message ? error.message : t.failed)
    } finally {
      setCancelling(false)
    }
  }

  return {
    order: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    confirmOpen,
    cancelling,
    cancelError,
    openCancel: () => {
      setCancelError(null)
      setConfirmOpen(true)
    },
    closeCancel: () => setConfirmOpen(false),
    cancel,
  }
}

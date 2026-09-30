export function displayOrderCode(
  orderCode?: string | null,
  orderId?: string | null,
) {
  const trimmedCode = orderCode?.trim()
  if (trimmedCode) return trimmedCode

  const rawId = orderId?.trim()
  if (!rawId) return '—'

  const compact = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  return compact ? `ORD-${compact}` : rawId
}

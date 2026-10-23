import { ApiError } from '../../../shared/api/httpClient'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import type { CustomerQuote } from '../types'
import { pricingDescription } from '../../../shared/lib/pricingPresentation'

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export function messageOf(
  error: unknown,
  t: (typeof customerFinancePanelMessages)['vi'],
) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return t.networkError
    }
    if (error.code === 'PAYMENT_PROVIDER_ERROR') {
      return t.paymentProviderError
    }
    if (error.code && t.errorCodes[error.code]) {
      return t.errorCodes[error.code]
    }
    return t.loadError
  }
  return error instanceof Error ? error.message : t.loadError
}

/**
 * Line text for the quote. `description` comes from the backend: the
 * Vietnamese lookup only applies in vi mode, EN shows it unchanged.
 */
export function lineText(
  row: CustomerQuote['items'][number],
  t: (typeof customerFinancePanelMessages)['vi'],
  lang: 'vi' | 'en',
  checklistName?: string,
) {
  if (row.type === 'MANAGER_ADJUSTMENT') {
    const reason = row.description.split(' · ').slice(1).join(' · ')
    return reason ? `${t.adjustment}: ${reason}` : t.adjustment
  }
  const text = lang === 'vi' ? pricingDescription(row.description) : row.description
  const prefix = checklistName ? `${checklistName} · ` : ''
  return prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text
}

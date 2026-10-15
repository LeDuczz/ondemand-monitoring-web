import type { ReactNode } from 'react'

import { useLanguage } from '../../../../shared/i18n'
import type { OrderDetail } from '../../types/orders'
import { requestDetailHelpersMessages } from './requestDetailHelpers.messages'

export type DetailItem = {
  label: string
  value: ReactNode
}

type Locale = 'vi-VN' | 'en-US'
type HelperMessages = (typeof requestDetailHelpersMessages)['vi']

/** Language-bound formatters; every helper below takes this as its first arg. */
export type DetailFormat = { t: HelperMessages; locale: Locale }

export function useDetailFormat(): DetailFormat {
  const { lang, locale } = useLanguage()
  return { t: requestDetailHelpersMessages[lang], locale }
}

export function text(f: DetailFormat, value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? (f.t.enumLabels[trimmed] ?? trimmed) : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? f.t.yes : f.t.no
  return null
}

export function list(
  f: DetailFormat,
  values: string[] | null | undefined,
): string | null {
  if (!values || values.length === 0) return null
  return values.map((value) => text(f, value) ?? value).join(', ')
}

export function dateOnly(
  f: DetailFormat,
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(f.locale)
}

export function dateTime(
  f: DetailFormat,
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(f.locale)
}

export function visibleItems(items: DetailItem[]) {
  return items.filter((item) => item.value != null && item.value !== '')
}

export function requirementValue(
  f: DetailFormat,
  value: unknown,
): string | null {
  if (Array.isArray(value)) {
    const values = value
      .map((item) => requirementValue(f, item))
      .filter(Boolean)
    return values.length ? values.join(', ') : null
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const parts = [
      text(f, record.type),
      text(f, record.description),
      record.additionalPrice != null
        ? `${text(f, record.additionalPrice)}${f.t.currencySuffix}`
        : null,
      text(f, record.fileName ?? record.name),
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
  }
  return text(f, value)
}

export function mediaTypeFromTitle(
  f: DetailFormat,
  title: string | null | undefined,
) {
  const normalized = title?.trim().toLowerCase() ?? ''
  if (normalized.includes('video')) return f.t.mediaVideo
  if (
    normalized.includes('ảnh') ||
    normalized.includes('hình') ||
    normalized.includes('photo') ||
    normalized.includes('image')
  ) {
    return f.t.mediaImage
  }
  if (normalized.includes('báo cáo') || normalized.includes('report')) {
    return f.t.mediaReport
  }
  return null
}

export function formatMoney(f: DetailFormat, value: unknown) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : null
  return amount != null && Number.isFinite(amount)
    ? amount.toLocaleString(f.locale) + f.t.currencySuffix
    : text(f, value)
}

export function numberText(f: DetailFormat, value: unknown): string | null {
  const valueText = text(f, value)
  return valueText && valueText !== '0' ? valueText : null
}

export function deliverableSummary(
  f: DetailFormat,
  requirement: Record<string, unknown> | null,
  deliverableName?: string | null,
) {
  if (!requirement) return []
  const type =
    mediaTypeFromTitle(f, deliverableName) ?? text(f, requirement.mediaType)
  const quantity = numberText(f, requirement.quantity)
  return [
    type,
    quantity ? f.t.items(quantity) : null,
    text(f, requirement.resolution),
    text(f, requirement.aiAnalysisRequested) === f.t.yes ? f.t.withAi : null,
  ].filter((item): item is string => Boolean(item))
}

export function resultFormatsFromDeliverables(
  f: DetailFormat,
  order: OrderDetail,
): string | null {
  const formats =
    order.deliverables
      ?.map((deliverable) => {
        const fromName = mediaTypeFromTitle(f, deliverable.deliverableTypeName)
        if (fromName) return fromName
        return text(f, deliverable.requirement?.mediaType)
      })
      .filter((item): item is string => Boolean(item)) ?? []

  const uniqueFormats = [...new Set(formats)]
  return uniqueFormats.length > 0 ? uniqueFormats.join(', ') : null
}

export function addOnItems(
  f: DetailFormat,
  requirement: Record<string, unknown> | null,
): string[] {
  const value = requirement?.additionalRequirements
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return requirementValue(f, item)
      const record = item as Record<string, unknown>
      const title = text(f, record.type) ?? f.t.additionalRequirement
      const description = text(f, record.description)
      const price = formatMoney(f, record.additionalPrice)
      return [title, description, price].filter(Boolean).join(' · ')
    })
    .filter((item): item is string => Boolean(item))
}

export function requirementItems(
  f: DetailFormat,
  requirement: Record<string, unknown> | null,
): DetailItem[] {
  if (!requirement) return []
  const hiddenTechnicalKeys = new Set([
    'priority',
    'readinessScore',
    'usagePurpose',
    'serviceCode',
    'serviceId',
    'deliverableTypeId',
    'mediaType',
    'quantity',
    'resolution',
    'radiusM',
    'estimatedAreaHa',
    'aiAnalysisRequested',
    'additionalRequirements',
  ])

  return Object.entries(requirement)
    .map<DetailItem | null>(([key, value]) => {
      if (hiddenTechnicalKeys.has(key)) return null
      const formatted = requirementValue(f, value)
      if (!formatted) return null
      const suffix =
        key === 'radiusM' ? ' m' : key === 'estimatedAreaHa' ? ' ha' : ''
      const finalValue =
        key === 'additionalPrice'
          ? (formatMoney(f, value) ?? formatted)
          : formatted
      return {
        label: f.t.labels[key] ?? key,
        value: `${finalValue}${suffix}`,
      }
    })
    .filter((item): item is DetailItem => item != null)
}

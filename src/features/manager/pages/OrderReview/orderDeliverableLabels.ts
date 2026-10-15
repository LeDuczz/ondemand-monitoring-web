import type { OrderDetail } from '../../types/orders'

export function clean(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const VI_TERMS: Record<string, string> = {
  PHOTO: 'Ảnh',
  PHOTOS: 'Ảnh',
  IMAGE: 'Ảnh',
  IMAGES: 'Ảnh',
  VIDEO: 'Video',
  VIDEOS: 'Video',
  REPORT: 'Báo cáo',
  STREAMING: 'Phát trực tiếp',
  LIVESTREAM: 'Phát trực tiếp',
  ORTHOMOSAIC: 'Bản đồ trực giao',
  MODEL3D: 'Mô hình 3D',
  THERMAL: 'Ảnh nhiệt',
}

/** Backend deliverable names can be raw enum-like tokens (e.g. "PHOTO"). */
function localizeLabel(label: string, locale: 'vi-VN' | 'en-US') {
  if (locale !== 'vi-VN') return label
  return label.replace(
    /[A-Za-z0-9]+/g,
    (word) => VI_TERMS[word.toUpperCase()] ?? word,
  )
}

/** Unique, non-empty labels of what the order actually delivers. */
export function orderDeliverableLabels(
  order: OrderDetail,
  locale: 'vi-VN' | 'en-US' = 'vi-VN',
): string[] {
  const raw = [
    ...(order.deliverables ?? []).map((d) => d.deliverableTypeName),
    ...(order.resultFormats ?? []),
  ]
  const seen = new Set<string>()
  const labels: string[] = []
  for (const item of raw) {
    const raw = clean(item)
    const label = raw ? localizeLabel(raw, locale) : null
    const key = label?.toLowerCase()
    if (!label || !key || seen.has(key)) continue
    seen.add(key)
    labels.push(label)
  }
  return labels
}

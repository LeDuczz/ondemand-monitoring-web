import type { Language } from '../../../../shared/i18n'
import { normalizeKey } from './normalize'

type Names = { vi: string; en: string }

/** Deliverable types (ServiceCatalogSeedDataInitializer.seedDeliverableTypes) plus legacy mock names. */
const DELIVERABLES: Names[] = [
  { vi: 'Báo cáo Giám sát', en: 'Monitoring report' },
  { vi: 'Hình ảnh Kiểm tra', en: 'Inspection images' },
  { vi: 'Video Ghi hình', en: 'Recorded video' },
  { vi: 'Báo cáo Phân tích Nhiệt', en: 'Thermal analysis report' },
  { vi: 'Báo cáo Tiến độ', en: 'Progress report' },
  { vi: 'Báo cáo Nhiệt độ / Áp suất', en: 'Temperature / pressure report' },
  { vi: 'Video giám sát', en: 'Surveillance video' },
  { vi: 'Ảnh chụp hiện trường', en: 'Site photos' },
  { vi: 'Livestream trực tiếp', en: 'Live stream' },
  { vi: 'Ảnh nhiệt', en: 'Thermal images' },
]

/** Category services (CategoryServiceDataInitializer.DEFAULT_SERVICES) plus mock names. */
const CATEGORIES: Names[] = [
  { vi: 'Giám sát công trình', en: 'Construction monitoring' },
  { vi: 'Giám sát nông nghiệp', en: 'Agricultural monitoring' },
  { vi: 'Giám sát khu công nghiệp / nhà máy', en: 'Industrial zone / factory monitoring' },
  { vi: 'Giám sát an ninh khu vực', en: 'Area security monitoring' },
  { vi: 'Giám sát giao thông', en: 'Traffic monitoring' },
  { vi: 'Giám sát môi trường', en: 'Environmental monitoring' },
  { vi: 'Giám sát điện / hạ tầng', en: 'Power / infrastructure monitoring' },
  { vi: 'Giám sát kho bãi / logistics', en: 'Warehouse / logistics monitoring' },
  { vi: 'Giám sát sự kiện / khu đông người', en: 'Event / crowd monitoring' },
  { vi: 'Giám sát theo yêu cầu định kỳ', en: 'Scheduled recurring monitoring' },
  { vi: 'Hạ tầng', en: 'Infrastructure' },
  { vi: 'Nông nghiệp', en: 'Agriculture' },
]

const index = (list: Names[]) => new Map(list.map((n) => [normalizeKey(n.vi), n.en]))
const DELIVERABLE_BY_NAME = index(DELIVERABLES)
const CATEGORY_BY_NAME = index(CATEGORIES)

function lookup(map: Map<string, string>, name: string | null | undefined, lang: Language): string {
  const input = name?.trim() ?? ''
  if (!input || lang !== 'en') return input
  return map.get(normalizeKey(input)) ?? input
}

/** Localized deliverable-type name; unknown names and Vietnamese mode keep the BE text. */
export function localizeDeliverableName(name: string | null | undefined, lang: Language): string {
  return lookup(DELIVERABLE_BY_NAME, name, lang)
}

/** Localized category-service name; unknown names and Vietnamese mode keep the BE text. */
export function localizeCategoryName(name: string | null | undefined, lang: Language): string {
  return lookup(CATEGORY_BY_NAME, name, lang)
}

export const translatedDeliverableNames = (): string[] => DELIVERABLES.map((n) => n.vi)
export const translatedCategoryNames = (): string[] => CATEGORIES.map((n) => n.vi)

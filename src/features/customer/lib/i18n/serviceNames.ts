import type { Language } from '../../../../shared/i18n'
import { normalizeKey } from './normalize'

type Names = { vi: string; en: string }

/**
 * BE service names are Vietnamese. Ids differ between environments, so the
 * same entry is reachable by id (mock / seed ids) and by normalized name.
 */
const SERVICES: Array<{ ids: string[]; names: Names }> = [
  { ids: [], names: { vi: 'Kiểm tra mái nhà', en: 'Roof inspection' } },
  { ids: [], names: { vi: 'Giám sát công trình', en: 'Construction site monitoring' } },
  { ids: [], names: { vi: 'Khảo sát nông nghiệp', en: 'Agricultural survey' } },
  {
    ids: ['svc-construction'],
    names: { vi: 'Giám sát tiến độ công trình', en: 'Construction progress monitoring' },
  },
  {
    ids: ['svc-thermal'],
    names: { vi: 'Kiểm tra nhiệt mái và tấm pin', en: 'Roof and solar panel thermal inspection' },
  },
  { ids: ['svc-security'], names: { vi: 'Tuần tra an ninh khu vực', en: 'Area security patrol' } },
  { ids: ['svc-mapping'], names: { vi: 'Bản đồ 2D/3D', en: '2D/3D mapping' } },
  { ids: ['svc-ndvi'], names: { vi: 'Giám sát cây trồng (NDVI)', en: 'Crop monitoring (NDVI)' } },
  { ids: [], names: { vi: 'GS cây trồng', en: 'Crop monitoring' } },
  { ids: [], names: { vi: 'GS giao thông và sự kiện', en: 'Traffic and event monitoring' } },
  {
    ids: [],
    names: {
      vi: 'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
      en: 'Factory roof thermal inspection, Hiep Phuoc Industrial Park',
    },
  },
  // Real BE services (ServiceCatalogSeedDataInitializer.seedServices). BE ids are
  // random UUIDs, so these are matched by normalized name only.
  { ids: [], names: { vi: 'Giám sát Kho bãi / Logistics', en: 'Warehouse / logistics monitoring' } },
  { ids: [], names: { vi: 'Giám sát Đập nước / Hồ chứa', en: 'Dam / reservoir monitoring' } },
  { ids: [], names: { vi: 'Giám sát Rừng / Điểm nhiệt', en: 'Forest / thermal hotspot monitoring' } },
  { ids: [], names: { vi: 'Giám sát Nông nghiệp / Cây trồng', en: 'Agricultural / crop monitoring' } },
  { ids: [], names: { vi: 'Kiểm tra Sân bay / Đường băng', en: 'Airport / runway inspection' } },
  { ids: [], names: { vi: 'Giám sát Kho công nghiệp / Nhà xưởng', en: 'Industrial warehouse / factory monitoring' } },
  { ids: [], names: { vi: 'Giám sát Mặt nước / Dòng chảy', en: 'Water surface / flow monitoring' } },
  { ids: [], names: { vi: 'Đo nhiệt độ / Điểm nhiệt', en: 'Temperature / thermal hotspot measurement' } },
  { ids: [], names: { vi: 'Đo nhiệt độ / Áp suất', en: 'Temperature / pressure measurement' } },
  { ids: [], names: { vi: 'Kiểm tra Công trình thủy lợi', en: 'Irrigation structure inspection' } },
  { ids: [], names: { vi: 'Giám sát Tiến độ Xây dựng', en: 'Construction progress monitoring' } },
  { ids: [], names: { vi: 'Giám sát Sạt lở / Ngập lụt', en: 'Landslide / flood monitoring' } },
  { ids: [], names: { vi: 'Kiểm tra Tháp viễn thông', en: 'Telecom tower inspection' } },
  { ids: [], names: { vi: 'Giám sát Mục tiêu xa', en: 'Remote target monitoring' } },
  { ids: [], names: { vi: 'Giám sát Bãi đáp / Trạm drone', en: 'Landing pad / drone station monitoring' } },
]

const BY_ID = new Map<string, Names>()
const BY_NAME = new Map<string, Names>()
for (const entry of SERVICES) {
  entry.ids.forEach((id) => BY_ID.set(id, entry.names))
  BY_NAME.set(normalizeKey(entry.names.vi), entry.names)
}

/**
 * Localized service name for a BE service id or Vietnamese name. Unknown
 * services return `fallback` (default: the input), i.e. the BE name unchanged.
 * Vietnamese always shows the BE text as given.
 */
export function localizeServiceName(
  nameOrId: string | null | undefined,
  lang: Language,
  fallback?: string,
): string {
  const input = nameOrId?.trim() ?? ''
  const shown = fallback ?? input
  if (!input) return shown
  if (lang !== 'en') return shown
  // Real BE ids are random UUIDs, so also try the BE name passed as `fallback`.
  const hit =
    BY_ID.get(input) ??
    BY_NAME.get(normalizeKey(input)) ??
    (fallback ? BY_NAME.get(normalizeKey(fallback)) : undefined)
  return hit ? hit.en : shown
}

/** Every Vietnamese service name that has an English translation. */
export function translatedServiceNames(): string[] {
  return SERVICES.map((entry) => entry.names.vi)
}

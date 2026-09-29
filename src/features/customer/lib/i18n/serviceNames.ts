import type { Language } from '../../../../shared/i18n'
import { normalizeKey } from './normalize'

type Names = { vi: string; en: string }

/**
 * BE service names are Vietnamese. Ids differ between environments, so the
 * same entry is reachable by id (mock / seed ids) and by normalized name.
 */
const SERVICES: Array<{ ids: string[]; names: Names }> = [
  { ids: ['svc-1'], names: { vi: 'Kiểm tra mái nhà', en: 'Roof inspection' } },
  { ids: ['svc-2'], names: { vi: 'Giám sát công trình', en: 'Construction site monitoring' } },
  { ids: ['svc-3'], names: { vi: 'Khảo sát nông nghiệp', en: 'Agricultural survey' } },
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
  const hit = BY_ID.get(input) ?? BY_NAME.get(normalizeKey(input))
  return hit ? hit.en : shown
}

import { describe, expect, it } from 'vitest'

import {
  localizeCategoryName,
  localizeDeliverableName,
  translatedCategoryNames,
  translatedDeliverableNames,
} from './catalogNames'
import { localizeServiceName, translatedServiceNames } from './serviceNames'

// Vietnamese names seeded by the BE (ServiceCatalogSeedDataInitializer,
// CategoryServiceDataInitializer). Ids are random UUIDs, so lookup is by name.
const BE_SERVICES: Array<[string, string]> = [
  ['Giám sát Kho bãi / Logistics', 'Warehouse / logistics monitoring'],
  ['Giám sát Đập nước / Hồ chứa', 'Dam / reservoir monitoring'],
  ['Giám sát Rừng / Điểm nhiệt', 'Forest / thermal hotspot monitoring'],
  ['Giám sát Nông nghiệp / Cây trồng', 'Agricultural / crop monitoring'],
  ['Kiểm tra Sân bay / Đường băng', 'Airport / runway inspection'],
  ['Giám sát Kho công nghiệp / Nhà xưởng', 'Industrial warehouse / factory monitoring'],
  ['Giám sát Mặt nước / Dòng chảy', 'Water surface / flow monitoring'],
  ['Đo nhiệt độ / Điểm nhiệt', 'Temperature / thermal hotspot measurement'],
  ['Đo nhiệt độ / Áp suất', 'Temperature / pressure measurement'],
  ['Kiểm tra Công trình thủy lợi', 'Irrigation structure inspection'],
  ['Giám sát Tiến độ Xây dựng', 'Construction progress monitoring'],
  ['Giám sát Sạt lở / Ngập lụt', 'Landslide / flood monitoring'],
  ['Kiểm tra Tháp viễn thông', 'Telecom tower inspection'],
  ['Giám sát Mục tiêu xa', 'Remote target monitoring'],
  ['Giám sát Bãi đáp / Trạm drone', 'Landing pad / drone station monitoring'],
]
const BE_DELIVERABLES: Array<[string, string]> = [
  ['Báo cáo Giám sát', 'Monitoring report'],
  ['Hình ảnh Kiểm tra', 'Inspection images'],
  ['Video Ghi hình', 'Recorded video'],
  ['Báo cáo Phân tích Nhiệt', 'Thermal analysis report'],
  ['Báo cáo Tiến độ', 'Progress report'],
  ['Báo cáo Nhiệt độ / Áp suất', 'Temperature / pressure report'],
]
const BE_CATEGORIES: Array<[string, string]> = [
  ['Giám sát công trình', 'Construction monitoring'],
  ['Giám sát nông nghiệp', 'Agricultural monitoring'],
  ['Giám sát khu công nghiệp / nhà máy', 'Industrial zone / factory monitoring'],
  ['Giám sát an ninh khu vực', 'Area security monitoring'],
  ['Giám sát giao thông', 'Traffic monitoring'],
  ['Giám sát môi trường', 'Environmental monitoring'],
  ['Giám sát điện / hạ tầng', 'Power / infrastructure monitoring'],
  ['Giám sát kho bãi / logistics', 'Warehouse / logistics monitoring'],
  ['Giám sát sự kiện / khu đông người', 'Event / crowd monitoring'],
  ['Giám sát theo yêu cầu định kỳ', 'Scheduled recurring monitoring'],
]
const VI_CHARS = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i

describe('BE catalog names', () => {
  it.each(BE_SERVICES)('translates service %s', (vi, en) => {
    expect(localizeServiceName(vi, 'en')).toBe(en)
    expect(localizeServiceName(vi, 'vi')).toBe(vi)
    expect(localizeServiceName('3f0c9a1e-uuid', 'en', vi)).toBe(en)
    expect(localizeServiceName('3f0c9a1e-uuid', 'vi', vi)).toBe(vi)
  })
  it.each(BE_DELIVERABLES)('translates deliverable type %s', (vi, en) => {
    expect(localizeDeliverableName(vi, 'en')).toBe(en)
    expect(localizeDeliverableName(vi, 'vi')).toBe(vi)
  })
  it.each(BE_CATEGORIES)('translates category %s', (vi, en) => {
    expect(localizeCategoryName(vi, 'en')).toBe(en)
    expect(localizeCategoryName(vi, 'vi')).toBe(vi)
  })
  it('leaves no Vietnamese in any English translation', () => {
    for (const [, en] of [...BE_SERVICES, ...BE_DELIVERABLES, ...BE_CATEGORIES]) {
      expect(VI_CHARS.test(en)).toBe(false)
    }
    for (const vi of translatedServiceNames()) expect(VI_CHARS.test(localizeServiceName(vi, 'en'))).toBe(false)
    for (const vi of translatedDeliverableNames()) expect(VI_CHARS.test(localizeDeliverableName(vi, 'en'))).toBe(false)
    for (const vi of translatedCategoryNames()) expect(VI_CHARS.test(localizeCategoryName(vi, 'en'))).toBe(false)
  })
  it('keeps unknown names unchanged', () => {
    expect(localizeDeliverableName('Loại lạ', 'en')).toBe('Loại lạ')
    expect(localizeCategoryName(null, 'en')).toBe('')
  })
})
import { localizeTimeslot, timeslotCodeFromName } from './timeslots'

describe('localizeServiceName', () => {
  it('maps by id and by accent-insensitive Vietnamese name in English', () => {
    expect(localizeServiceName('svc-ndvi', 'en')).toBe('Crop monitoring (NDVI)')
    expect(localizeServiceName('Giám sát công trình', 'en')).toBe('Construction site monitoring')
    expect(localizeServiceName('  giam sat cong trinh ', 'en')).toBe('Construction site monitoring')
    expect(localizeServiceName('uuid-x', 'en', 'Dịch vụ lạ')).toBe('Dịch vụ lạ')
  })
  it('keeps the BE name for unknown services and in Vietnamese', () => {
    expect(localizeServiceName('Dịch vụ lạ', 'en')).toBe('Dịch vụ lạ')
    expect(localizeServiceName('Giám sát công trình', 'vi')).toBe('Giám sát công trình')
    expect(localizeServiceName(null, 'en')).toBe('')
  })
})

describe('localizeTimeslot', () => {
  const known = [
    { id: 'pt-2', code: 'AFTERNOON', name: 'Buổi chiều', startTime: '12:00:00', endTime: '17:00:00' },
  ]
  it('resolves id to code and adds the range', () => {
    expect(localizeTimeslot({ id: 'pt-2' }, 'en', known)).toBe('Afternoon 12:00–17:00')
    expect(localizeTimeslot({ id: 'pt-2', name: 'Buổi chiều' }, 'vi', known)).toBe('Buổi chiều 12:00–17:00')
  })
  it('matches by name when the id is missing', () => {
    expect(localizeTimeslot({ name: 'Buổi chiều' }, 'en', known)).toBe('Afternoon 12:00–17:00')
  })
  it('infers the code from the name and keeps a range written in it', () => {
    expect(localizeTimeslot({ name: 'Chiều tối 17:00–19:00' }, 'en')).toBe('Evening 17:00–19:00')
    expect(localizeTimeslot({ name: 'Sáng 07:00–11:00' }, 'en')).toBe('Morning 07:00–11:00')
    expect(localizeTimeslot({ name: 'Sáng 07:00–11:00' }, 'vi')).toBe('Sáng 07:00–11:00')
    expect(timeslotCodeFromName('Đêm')).toBe('NIGHT')
  })
  it('falls back to the BE name', () => {
    expect(localizeTimeslot({ name: 'Giờ lạ' }, 'en')).toBe('Giờ lạ')
  })
})

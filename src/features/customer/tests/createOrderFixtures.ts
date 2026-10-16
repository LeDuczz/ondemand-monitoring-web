import type {
  ServiceDeliverableOption,
  ServiceRequirementSuggestion,
} from '../api/customerApi'

import type { PreferredTimeResponse, ServiceResponse } from '../../admin/api/catalogApi'
import type { ServiceChecklistItem } from '../lib/checklist/types'

type CategoryService = { id: string; name: string; description?: string }

// Test fixtures for BE-shaped catalog endpoints. AI recommendation logic does not
// read this list directly; the create-order flow sends the active service catalog
// in requestContext, same as when it talks to the real backend.
export const mockServiceDeliverables: ServiceDeliverableOption[] = [
  { id: 'sd-construction-photo', serviceId: 'svc-construction', serviceName: 'Giám sát công trình', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-construction-video', serviceId: 'svc-construction', serviceName: 'Giám sát công trình', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-construction-report', serviceId: 'svc-construction', serviceName: 'Giám sát công trình', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo kết quả' },
  { id: 'sd-factory-photo', serviceId: 'svc-factory', serviceName: 'Kiểm tra nhà xưởng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-factory-video', serviceId: 'svc-factory', serviceName: 'Kiểm tra nhà xưởng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-factory-report', serviceId: 'svc-factory', serviceName: 'Kiểm tra nhà xưởng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo kết quả' },
  { id: 'sd-area-photo', serviceId: 'svc-area', serviceName: 'Giám sát khu vực', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-area-video', serviceId: 'svc-area', serviceName: 'Giám sát khu vực', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-forest-photo', serviceId: 'svc-forest', serviceName: 'Giám sát rừng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-forest-video', serviceId: 'svc-forest', serviceName: 'Giám sát rừng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-forest-report', serviceId: 'svc-forest', serviceName: 'Giám sát rừng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo kết quả' },
]

export const mockRequirementSuggestions: ServiceRequirementSuggestion[] = [
  { id: 'rs-construction-1', serviceId: 'svc-construction', category: 'Yêu cầu mặc định', label: 'Kiểm tra tình trạng tổng thể công trình', message: 'Ghi nhận hình ảnh tổng quan hiện trạng công trình.', sortOrder: 10, source: 'SEED' },
  { id: 'rs-factory-1', serviceId: 'svc-factory', category: 'Yêu cầu mặc định', label: 'Kiểm tra tình trạng tổng thể nhà xưởng', message: 'Ghi nhận toàn cảnh khu vực nhà xưởng.', sortOrder: 10, source: 'SEED' },
  { id: 'rs-area-1', serviceId: 'svc-area', category: 'Yêu cầu mặc định', label: 'Ghi nhận toàn cảnh khu vực', message: 'Chụp ảnh tổng quan phạm vi giám sát.', sortOrder: 10, source: 'SEED' },
  { id: 'rs-forest-1', serviceId: 'svc-forest', category: 'Yêu cầu mặc định', label: 'Ghi nhận toàn cảnh khu vực rừng', message: 'Chụp ảnh/video tổng quan phạm vi rừng cần giám sát.', sortOrder: 10, source: 'SEED' },
]

export const mockCategoryServices: CategoryService[] = [
  { id: 'cat-1', name: 'Giám sát công trình', description: 'Theo dõi tiến độ, chụp định kỳ, so sánh theo tuần/tháng và phát hiện khu vực thi công chậm.' },
  { id: 'cat-2', name: 'Kiểm tra nhà xưởng', description: 'Quan sát mái, bề mặt và các khu vực khó tiếp cận của nhà xưởng.' },
  { id: 'cat-3', name: 'Giám sát khu vực', description: 'Chụp ảnh và video tổng quan một khu vực theo phạm vi yêu cầu.' },
  { id: 'cat-4', name: 'Giám sát rừng', description: 'Ghi nhận hiện trạng khu vực rừng và các dấu hiệu bất thường.' },
]

export const catalogServices: ServiceResponse[] = ([
  {
    id: 'svc-construction',
    name: 'Giám sát công trình',
    description:
      'Chụp ảnh và video hiện trạng công trình, hỗ trợ theo dõi và đối chiếu tiến độ thi công theo từng thời điểm.',
    basePrice: 3_500_000,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-factory',
    name: 'Kiểm tra nhà xưởng',
    description:
      'Quan sát mái, bề mặt và các khu vực khó tiếp cận của nhà xưởng bằng hình ảnh và video từ drone.',
    basePrice: 3_000_000,
    isActive: true,
    createdAt: '2026-01-11T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-area',
    name: 'Giám sát khu vực',
    description:
      'Chụp ảnh và video tổng quan một khu vực theo vị trí và phạm vi giám sát do khách hàng yêu cầu.',
    basePrice: 2_500_000,
    isActive: true,
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-forest',
    name: 'Giám sát rừng',
    description:
      'Chụp ảnh và video khu vực rừng, ghi nhận hiện trạng và hỗ trợ quan sát các khu vực có dấu hiệu bất thường.',
    basePrice: 4_000_000,
    isActive: true,
    createdAt: '2026-01-13T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
])

export const catalogTimes: PreferredTimeResponse[] = ([
  {
    id: 'pt-1',
    code: 'MORNING',
    name: 'Buổi sáng',
    startTime: '06:00:00',
    endTime: '12:00:00',
  },
  {
    id: 'pt-2',
    code: 'AFTERNOON',
    name: 'Buổi chiều',
    startTime: '12:00:00',
    endTime: '17:00:00',
  },
  {
    id: 'pt-3',
    code: 'EVENING',
    name: 'Buổi tối',
    startTime: '17:00:00',
    endTime: '20:00:00',
  },
])

export const mockServiceChecklist = (
  serviceId: string,
): ServiceChecklistItem[] =>
  ({
    'svc-construction': [
      'Kiểm tra tình trạng tổng thể công trình',
      'Ghi nhận tiến độ các khu vực đang thi công',
      'Kiểm tra mặt ngoài công trình',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh tổng quan công trình',
      'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
    ],
    'svc-factory': [
      'Kiểm tra tình trạng tổng thể nhà xưởng',
      'Kiểm tra mái nhà xưởng',
      'Kiểm tra bề mặt và kết cấu phía trên',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh các vị trí bất thường',
      'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
    ],
    'svc-area': [
      'Ghi nhận toàn cảnh khu vực',
      'Ghi nhận các khu vực chính',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh các vị trí khách hàng yêu cầu',
      'Ghi nhận hiện trạng khu vực',
    ],
    'svc-forest': [
      'Ghi nhận toàn cảnh khu vực rừng',
      'Quan sát tình trạng khu vực cây xanh',
      'Quan sát khu vực có dấu hiệu bất thường',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh các vị trí được chỉ định',
      'Ghi nhận hiện trạng sau khi hoàn tất giám sát',
    ],
  }[serviceId] ?? []).map((content, index) => ({
    id: `assignment-${serviceId}-${index + 1}`,
    serviceId,
    checklistId: `check-${serviceId}-${index + 1}`,
    content,
    displayOrder: index,
    checklistVersion: 1,
    serviceActive: true,
    checklistActive: true,
  }))

export const SERVICE_PRICES: Record<string, number> = {
  'svc-construction': 3_500_000,
  'svc-factory': 3_000_000,
  'svc-area': 2_500_000,
  'svc-forest': 4_000_000,
}

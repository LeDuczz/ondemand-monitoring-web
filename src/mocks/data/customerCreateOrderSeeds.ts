import type {
  ServiceDeliverableOption,
  ServiceRequirementSuggestion,
} from '../../features/customer/api/customerApi'

type CategoryService = { id: string; name: string; description?: string }

// Local mock seed data for BE-shaped endpoints. AI recommendation logic does not
// read this list directly; the create-order flow sends the active service catalog
// in requestContext, same as when it talks to the real backend.
export const mockServiceDeliverables: ServiceDeliverableOption[] = [
  { id: 'sd-1', serviceId: 'svc-4', serviceName: 'Giám sát Kho bãi / Logistics', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-2', serviceId: 'svc-4', serviceName: 'Giám sát Kho bãi / Logistics', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-3', serviceId: 'svc-4', serviceName: 'Giám sát Kho bãi / Logistics', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-4', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-5', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-6', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-7', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-8', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-9', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-10', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-11', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-12', serviceId: 'svc-3', serviceName: 'Giám sát Nông nghiệp / Cây trồng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-13', serviceId: 'svc-3', serviceName: 'Giám sát Nông nghiệp / Cây trồng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-14', serviceId: 'svc-3', serviceName: 'Giám sát Nông nghiệp / Cây trồng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-15', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-16', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-17', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-18', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-19', serviceId: 'svc-9', serviceName: 'Giám sát Mặt nước / Dòng chảy', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-20', serviceId: 'svc-9', serviceName: 'Giám sát Mặt nước / Dòng chảy', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-21', serviceId: 'svc-9', serviceName: 'Giám sát Mặt nước / Dòng chảy', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-22', serviceId: 'svc-10', serviceName: 'Đo nhiệt độ / Điểm nhiệt', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-23', serviceId: 'svc-10', serviceName: 'Đo nhiệt độ / Điểm nhiệt', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-24', serviceId: 'svc-10', serviceName: 'Đo nhiệt độ / Điểm nhiệt', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-25', serviceId: 'svc-11', serviceName: 'Đo nhiệt độ / Áp suất', deliverableTypeId: 'dt-temp', deliverableTypeName: 'Báo cáo Nhiệt độ / Áp suất' },
  { id: 'sd-26', serviceId: 'svc-11', serviceName: 'Đo nhiệt độ / Áp suất', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-27', serviceId: 'svc-11', serviceName: 'Đo nhiệt độ / Áp suất', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-28', serviceId: 'svc-12', serviceName: 'Kiểm tra Công trình thủy lợi', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-29', serviceId: 'svc-12', serviceName: 'Kiểm tra Công trình thủy lợi', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-30', serviceId: 'svc-12', serviceName: 'Kiểm tra Công trình thủy lợi', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-31', serviceId: 'svc-2', serviceName: 'Giám sát Tiến độ Xây dựng', deliverableTypeId: 'dt-progress', deliverableTypeName: 'Báo cáo Tiến độ' },
  { id: 'sd-32', serviceId: 'svc-2', serviceName: 'Giám sát Tiến độ Xây dựng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-33', serviceId: 'svc-2', serviceName: 'Giám sát Tiến độ Xây dựng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-34', serviceId: 'svc-13', serviceName: 'Giám sát Sạt lở / Ngập lụt', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-35', serviceId: 'svc-13', serviceName: 'Giám sát Sạt lở / Ngập lụt', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-36', serviceId: 'svc-13', serviceName: 'Giám sát Sạt lở / Ngập lụt', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-37', serviceId: 'svc-1', serviceName: 'Kiểm tra Tháp viễn thông', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-38', serviceId: 'svc-1', serviceName: 'Kiểm tra Tháp viễn thông', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-39', serviceId: 'svc-1', serviceName: 'Kiểm tra Tháp viễn thông', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
]

export const mockRequirementSuggestions: ServiceRequirementSuggestion[] = [
  { id: 'rs-1', serviceId: 'svc-1', category: 'TARGET', label: 'Kiểm tra tháp', message: 'Kiểm tra anten và kết cấu tháp viễn thông.', sortOrder: 1, source: 'SEED' },
  { id: 'rs-2', serviceId: 'svc-2', category: 'TARGET', label: 'Tiến độ', message: 'Chụp ảnh tiến độ thi công định kỳ.', sortOrder: 1, source: 'SEED' },
]

export const mockCategoryServices: CategoryService[] = [
  { id: 'cat-1', name: 'Giám sát công trình', description: 'Theo dõi tiến độ, chụp định kỳ, so sánh theo tuần/tháng và phát hiện khu vực thi công chậm.' },
  { id: 'cat-2', name: 'Giám sát nông nghiệp', description: 'Kiểm tra cây trồng, vùng thiếu nước, sâu bệnh, stress thực vật và theo dõi diện tích canh tác.' },
  { id: 'cat-3', name: 'Giám sát khu công nghiệp / nhà máy', description: 'Kiểm tra mái nhà, bồn chứa, khu vực nguy hiểm, hàng rào và tài sản ngoài trời.' },
  { id: 'cat-4', name: 'Giám sát an ninh khu vực', description: 'Tuần tra theo tuyến, phát hiện người/phương tiện và kiểm tra xâm nhập vùng giới hạn.' },
  { id: 'cat-5', name: 'Giám sát giao thông', description: 'Theo dõi mật độ xe, ùn tắc, luồng di chuyển và sự cố giao thông.' },
  { id: 'cat-6', name: 'Giám sát môi trường', description: 'Phát hiện sạt lở, ngập lụt, cháy, thay đổi mặt nước, rác thải hoặc biến động địa hình.' },
  { id: 'cat-7', name: 'Giám sát điện / hạ tầng', description: 'Kiểm tra đường dây điện, cột điện, trạm biến áp, pin mặt trời và đường ống.' },
  { id: 'cat-8', name: 'Giám sát kho bãi / logistics', description: 'Giám sát bãi container, bãi xe, khu tập kết vật tư và kiểm kê khu vực ngoài trời.' },
  { id: 'cat-9', name: 'Giám sát sự kiện / khu đông người', description: 'Quan sát tổng thể khu vực, mật độ người và các điểm bất thường.' },
  { id: 'cat-10', name: 'Giám sát theo yêu cầu định kỳ', description: 'Khách chọn khu vực và tần suất bay hằng ngày/tuần/tháng để nhận báo cáo tự động.' },
]

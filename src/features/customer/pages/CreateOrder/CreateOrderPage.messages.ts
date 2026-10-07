import { defineMessages } from '../../../../shared/i18n'

/** Page-level texts: header, step names, field validation and readiness notes. */
export const createOrderPageMessages = defineMessages({
  vi: {
    pageTitle: 'Tạo yêu cầu giám sát',
    pageSubtitle:
      'Chọn dịch vụ, chốt nội dung giám sát, xác định vùng giám sát, chọn thời gian rồi xác nhận kết quả bàn giao.',
    cancel: 'Hủy',
    cancelConfirm: 'Thoát khỏi trang tạo yêu cầu? Bản nháp của bạn được lưu tự động.',
    blockedChecklist: 'Hãy sửa nội dung giám sát chưa hợp lệ để tiếp tục.',
    blockedLoading: 'Đang tải dữ liệu…',
    stepLabels: {
      1: 'Dịch vụ & mục tiêu',
      2: 'Nội dung giám sát',
      3: 'Vị trí & vùng giám sát',
      4: 'Thời gian',
      5: 'Kết quả bàn giao & xác nhận',
    } as Record<1 | 2 | 3 | 4 | 5, string>,
    metaErrorTitle: 'Không tải được dữ liệu tạo yêu cầu',
    validation: {
      address: 'Nhập địa chỉ/khu vực cần giám sát.',
      latitude: 'Latitude không hợp lệ.',
      longitude: 'Longitude không hợp lệ.',
      outsideZone:
        'Hiện chỉ phục vụ trong khu vực TP.HCM. Vui lòng chọn lại điểm trong vùng phục vụ.',
      blockedZone: (zoneNames: string) =>
        `Vùng giám sát chạm vùng cấm: ${zoneNames}. Vui lòng chọn điểm hoặc giảm bán kính.`,
      serviceId: 'Chọn dịch vụ giám sát.',
      title: 'Nhập tiêu đề yêu cầu.',
      preferredDateFrom: 'Chọn ngày bắt đầu.',
      preferredDateTo: 'Chọn ngày kết thúc.',
      preferredDateOrder: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
      preferredTimeId: 'Chọn khung giờ.',
      resultDeadline: 'Hạn chót nhận kết quả không được trước ngày bay muộn nhất.',
      recurrenceOccurrences: 'Số lần lặp phải từ 2 đến 52.',
      deliverableTypeId: 'Chọn kết quả bàn giao.',
      resultFormats: 'Chọn ít nhất một định dạng kết quả.',
      deliveryMethods: 'Chọn ít nhất một phương thức nhận kết quả.',
      termsAccepted: 'Bạn cần đồng ý điều khoản và cam kết bảo mật để gửi yêu cầu.',
      altitudeM: 'Độ cao bay phải từ 10 đến 120 m.',
      estimatedLengthM: 'Chiều dài ước tính phải lớn hơn 0 và không quá 100.000 m.',
      siteContactPhone: 'Số điện thoại liên hệ không hợp lệ.',
      permitStatus: (zoneName: string) =>
        `Khu vực nằm trong vùng cần xin phép bay (${zoneName}). Hãy cho biết bạn đã có giấy phép hay cần hỗ trợ.`,
      permitNumber: 'Nhập số giấy phép bay.',
    },
    scoreNotes: {
      missingAddress: 'Thiếu địa chỉ mô tả khu vực giám sát.',
      missingService: 'Chưa chọn dịch vụ giám sát.',
      missingDeliverable: 'Chưa chọn kết quả bàn giao.',
      missingSchedule: 'Thiếu ngày hoặc khung giờ bay.',
      largeRadius: 'Bán kính lớn, nên chia khu vực thành nhiều lượt bay.',
      allGood: 'Thông tin đủ để gửi yêu cầu cho bộ phận vận hành kiểm tra.',
    },
  },
  en: {
    pageTitle: 'Create Monitoring Request',
    pageSubtitle:
      'Choose a service, confirm the monitoring content, define the monitoring area, pick a schedule, then confirm deliverables.',
    cancel: 'Cancel',
    cancelConfirm: 'Leave the request page? Your draft is saved automatically.',
    blockedChecklist: 'Fix the invalid monitoring content to continue.',
    blockedLoading: 'Loading data…',
    stepLabels: {
      1: 'Service & target',
      2: 'Monitoring content',
      3: 'Location & monitoring area',
      4: 'Schedule',
      5: 'Deliverables & confirmation',
    } as Record<1 | 2 | 3 | 4 | 5, string>,
    metaErrorTitle: 'Unable to load data for creating this request',
    validation: {
      address: 'Enter the address/area to monitor.',
      latitude: 'Invalid latitude.',
      longitude: 'Invalid longitude.',
      outsideZone:
        'Service is currently limited to Ho Chi Minh City. Please pick a point inside the service area.',
      blockedZone: (zoneNames: string) =>
        `The monitoring area touches a no-fly zone: ${zoneNames}. Please pick another point or reduce the radius.`,
      serviceId: 'Select a monitoring service.',
      title: 'Enter a request title.',
      preferredDateFrom: 'Select a start date.',
      preferredDateTo: 'Select an end date.',
      preferredDateOrder: 'End date must be on or after the start date.',
      preferredTimeId: 'Select a time window.',
      resultDeadline: 'The result deadline cannot be before the latest flight date.',
      recurrenceOccurrences: 'Number of flights must be between 2 and 52.',
      deliverableTypeId: 'Select a deliverable.',
      resultFormats: 'Select at least one result format.',
      deliveryMethods: 'Select at least one delivery method.',
      termsAccepted: 'You must accept the terms and the security commitment to submit.',
      altitudeM: 'Flight altitude must be between 10 and 120 m.',
      estimatedLengthM: 'Estimated length must be above 0 and at most 100,000 m.',
      siteContactPhone: 'Invalid contact phone number.',
      permitStatus: (zoneName: string) =>
        `The area is inside airspace that needs a flight permit (${zoneName}). Tell us whether you hold a permit or need support.`,
      permitNumber: 'Enter the flight permit number.',
    },
    scoreNotes: {
      missingAddress: 'Missing an address describing the monitoring area.',
      missingService: 'No monitoring service selected.',
      missingDeliverable: 'No deliverable selected.',
      missingSchedule: 'Missing flight date or time window.',
      largeRadius:
        'Large radius: consider splitting the area into multiple flights.',
      allGood:
        'Enough information to submit this request for operations review.',
    },
  },
})

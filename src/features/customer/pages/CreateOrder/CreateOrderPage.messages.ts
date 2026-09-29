import { defineMessages } from '../../../../shared/i18n'

/** Page-level texts: header, step names, field validation and readiness notes. */
export const createOrderPageMessages = defineMessages({
  vi: {
    pageTitle: 'Tạo yêu cầu giám sát',
    pageSubtitle:
      'Chọn vị trí trên bản đồ mô phỏng, nhập thông tin cần thiết, dùng AI tư vấn rồi gửi yêu cầu.',
    cancel: 'Huỷ',
    stepLabels: {
      1: 'Vị trí giám sát',
      2: 'AI tư vấn & mục tiêu',
      3: 'Thời gian và kết quả',
      4: 'Xác nhận & gửi yêu cầu',
    } as Record<1 | 2 | 3 | 4, string>,
    metaErrorTitle: 'Không tải được dữ liệu tạo yêu cầu',
    validation: {
      address: 'Nhập địa chỉ/khu vực cần giám sát.',
      latitude: 'Latitude không hợp lệ.',
      longitude: 'Longitude không hợp lệ.',
      outsideZone:
        'Vị trí này nằm ngoài các vùng giám sát đã cấu hình. Vui lòng chọn lại điểm trong vùng phục vụ.',
      blockedZone: (zoneNames: string) =>
        `Vùng giám sát chạm vùng cấm: ${zoneNames}. Vui lòng chọn điểm hoặc giảm bán kính.`,
      serviceId: 'Chọn dịch vụ giám sát.',
      title: 'Nhập tiêu đề yêu cầu.',
      preferredDateFrom: 'Chọn ngày bắt đầu.',
      preferredDateTo: 'Chọn ngày kết thúc.',
      preferredDateOrder: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
      preferredTimeId: 'Chọn khung giờ.',
      deliverableTypeId: 'Chọn kết quả bàn giao.',
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
      'Pick a location on the simulation map, fill in the required details, use AI consultation, then submit.',
    cancel: 'Cancel',
    stepLabels: {
      1: 'Monitoring location',
      2: 'AI consultation & target',
      3: 'Schedule & deliverables',
      4: 'Review & submit',
    } as Record<1 | 2 | 3 | 4, string>,
    metaErrorTitle: 'Unable to load data for creating this request',
    validation: {
      address: 'Enter the address/area to monitor.',
      latitude: 'Invalid latitude.',
      longitude: 'Invalid longitude.',
      outsideZone:
        'This location is outside the configured monitoring zones. Please pick a point inside a service zone.',
      blockedZone: (zoneNames: string) =>
        `The monitoring area touches a no-fly zone: ${zoneNames}. Please pick another point or reduce the radius.`,
      serviceId: 'Select a monitoring service.',
      title: 'Enter a request title.',
      preferredDateFrom: 'Select a start date.',
      preferredDateTo: 'Select an end date.',
      preferredDateOrder: 'End date must be on or after the start date.',
      preferredTimeId: 'Select a time window.',
      deliverableTypeId: 'Select a deliverable.',
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

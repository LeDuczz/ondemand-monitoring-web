import { defineMessages } from '../../../../shared/i18n'

/** Page-level texts: header, step names, field validation and readiness notes. */
export const createOrderPageMessages = defineMessages({
  vi: {
    pageTitle: 'Tạo yêu cầu giám sát',
    pageSubtitle:
      'Chọn dịch vụ, xác định vùng giám sát, chọn thời gian rồi xác nhận kết quả bàn giao.',
    cancel: 'Huỷ',
    stepLabels: {
      1: 'Dịch vụ & mục tiêu',
      2: 'Vị trí & vùng giám sát',
      3: 'Thời gian',
      4: 'Kết quả bàn giao & xác nhận',
    } as Record<1 | 2 | 3 | 4, string>,
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
      'Choose a service, define the monitoring area, pick a schedule, then confirm deliverables.',
    cancel: 'Cancel',
    stepLabels: {
      1: 'Service & target',
      2: 'Location & monitoring area',
      3: 'Schedule',
      4: 'Deliverables & confirmation',
    } as Record<1 | 2 | 3 | 4, string>,
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

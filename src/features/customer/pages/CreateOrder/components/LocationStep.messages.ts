import { defineMessages } from '../../../../../shared/i18n'

export const locationStepMessages = defineMessages({
  vi: {
    mapLabel: 'Bản đồ chọn vị trí giám sát',
    layerStreet: 'Bản đồ',
    layerSatellite: 'Vệ tinh',
    selfCheckTitle: 'Tự kiểm tra vùng bay',
    selfCheckBody:
      'ODMS không tự xác nhận quyền bay. Bạn hãy nhập vùng yêu cầu trên cổng thông tin chính thức để tự kiểm tra.',
    selfCheckOpen: 'Mở cổng kiểm tra vùng bay ↗',
    selfCheckAfter:
      'Sau khi kiểm tra, quay lại ODMS và khai báo giấy phép hoặc chọn cần hỗ trợ xin phép.',
  },
  en: {
    mapLabel: 'Monitoring location map',
    layerStreet: 'Map',
    layerSatellite: 'Satellite',
    selfCheckTitle: 'Check the flight zone yourself',
    selfCheckBody:
      'ODMS does not confirm flight permission. Enter the requested zone on the official portal to check it yourself.',
    selfCheckOpen: 'Open the flight-zone portal ↗',
    selfCheckAfter:
      'After checking, come back to ODMS and declare your permit or choose to need help applying for one.',
  },
})

import { defineMessages } from '../../../../../shared/i18n'

export const areaDecisionSummaryMessages = defineMessages({
  vi: {
    thisAreaShouldNotBe: 'Chưa nên duyệt khu vực này',
    needsFurtherChecksBeforeApproval: 'Cần kiểm tra thêm trước khi duyệt',
    noSignificantObstaclesFound: 'Chưa phát hiện trở ngại đáng kể',
    banDoCuaBoQuoc:
      'Bản đồ của Bộ Quốc phòng ghi nhận khu vực giao vùng cấm hoặc hạn chế bay. Hãy mở bản đồ, đối chiếu mã vùng bên dưới và xác nhận điều kiện trước khi duyệt.',
    hayXemCacCanhBao:
      'Hãy xem các cảnh báo bên dưới và xác nhận điều kiện thực tế trước khi duyệt.',
    banCoTheTiepTuc:
      'Bạn có thể tiếp tục xem các điều kiện duyệt khác. Điều kiện bay cuối cùng vẫn cần được xác nhận khi lập kế hoạch.',
  },
  en: {
    thisAreaShouldNotBe: 'This area should not be approved yet',
    needsFurtherChecksBeforeApproval: 'Needs further checks before approval',
    noSignificantObstaclesFound: 'No significant obstacles found',
    banDoCuaBoQuoc:
      'The Ministry of National Defence map shows the area intersects a no-fly or restricted zone. Open the map, compare the zone codes below and confirm conditions before approving.',
    hayXemCacCanhBao:
      'Review the warnings below and confirm real-world conditions before approving.',
    banCoTheTiepTuc:
      'You can continue reviewing the other approval conditions. Final flight conditions must still be confirmed during planning.',
  },
})

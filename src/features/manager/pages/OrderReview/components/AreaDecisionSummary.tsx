import { OrderIcon } from '../../../components/common/OrderIcon'
import type { MinistryFlightBan } from '../areaTypes'

export function AreaDecisionSummary({ ministry }: { ministry: MinistryFlightBan }) {
  const hasConflict =
    ministry.violatedZones.length > 0 ||
    (ministry.violatedAreaSquareMeters ?? 0) > 0
  const level = hasConflict ? 'needs_review' : 'favorable'
  const title = hasConflict
    ? 'Cần đối chiếu với bản đồ cấm bay'
    : 'Chưa ghi nhận giao vùng cấm bay'
  const guidance = hasConflict
    ? 'Bản đồ của Bộ Quốc phòng ghi nhận khu vực giao vùng cấm hoặc hạn chế bay. Hãy mở bản đồ, đối chiếu mã vùng bên dưới và xác nhận điều kiện trước khi duyệt.'
    : 'Bạn có thể tiếp tục xem các điều kiện duyệt khác. Điều kiện bay cuối cùng vẫn cần được xác nhận khi lập kế hoạch.'

  return (
    <div className={`odm-or-area-decision is-${level}`}>
      <span className="odm-or-area-decision-icon" aria-hidden="true">
        <OrderIcon name={hasConflict ? 'alert' : 'check'} size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{guidance}</p>
      </div>
    </div>
  )
}

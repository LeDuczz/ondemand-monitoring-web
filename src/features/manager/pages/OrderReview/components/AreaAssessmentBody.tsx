import { AreaDecisionSummary } from './AreaDecisionSummary'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { openMinistryMap } from '../areaHelpers'
import { ManagerAreaReview } from './ManagerAreaReview'
import type { OrderDetail } from '../../../types/orders'
import type { ManagerAreaAssessment, SavedAreaReview } from '../areaTypes'
import type { Dispatch, SetStateAction } from 'react'

export function AreaAssessmentBody({
  data,
  hasMinistryViolations,
  ministryViolatedZones,
  order,
  review,
  setReviewOpen,
}: {
  data: ManagerAreaAssessment
  hasMinistryViolations: boolean
  ministryViolatedZones: string[]
  order: OrderDetail
  review: SavedAreaReview | null
  setReviewOpen: Dispatch<SetStateAction<boolean>>
}) {
  const ministry = data.ministryFlightBan?.available
    ? data.ministryFlightBan
    : undefined
  return (
    <>
      {ministry ? <AreaDecisionSummary ministry={ministry} /> : null}
      {hasMinistryViolations ? (
        <div className="odm-or-area-findings">
          <strong>Vùng cần đối chiếu</strong>
          <ul>
            {ministryViolatedZones.map((zone) => (
              <li key={zone} className="is-high odm-or-area-zone-row">
                <code>{zone}</code>
                <button
                  type="button"
                  className="odm-or-area-zone-link"
                  title={`Mở cambay.mod.gov.vn và sao chép mã ${zone}`}
                  onClick={() => openMinistryMap(zone)}
                >
                  Xem trên bản đồ
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {ministry ? (
        <a
          className="odm-or-area-source"
          href={ministry.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <OrderIcon name="plane" size={18} />
          <span>Mở bản đồ cấm bay của Bộ Quốc phòng</span>
          <OrderIcon name="chevron-right" size={18} />
        </a>
      ) : null}
      <ManagerAreaReview
        order={order}
        review={review}
        onEdit={() => setReviewOpen(true)}
      />
    </>
  )
}

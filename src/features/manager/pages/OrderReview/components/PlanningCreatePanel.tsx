import type { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { MissionCreatePage } from '../../MissionCreate/MissionCreatePage'
import type { Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'

export function PlanningCreatePanel({
  confirmation,
  setCreating,
  orderId,
  creating,
  setSelectedId,
  query,
}: {
  confirmation: ReturnType<typeof usePlanningConfirmation>
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  orderId: string
  creating: { replacesMissionId?: string | undefined }
  setSelectedId: Dispatch<SetStateAction<string | null>>
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }>
}) {
  return (
    <section
      className="odm-planning-create-panel"
      aria-label="Tạo Mission trong Order"
    >
      <header className="odm-planning-create-head">
        <span className="odm-planning-create-icon" aria-hidden="true">
          ＋
        </span>
        <div>
          <h3>Tạo Mission mới</h3>
          <p>
            Đặt tên dễ nhận biết, sau đó kiểm tra thời tiết và chọn lịch bay.
          </p>
        </div>
        <button
          className="odm-planning-create-close"
          type="button"
          aria-label="Đóng form tạo Mission"
          title="Đóng form"
          onClick={async () => {
            if (
              await confirmation.confirm({
                title: 'Đóng form tạo Mission?',
                body: 'Dữ liệu chưa gửi sẽ không được lưu.',
                action: 'Đóng form',
              })
            )
              setCreating(null)
          }}
        >
          ×
        </button>
      </header>
      <MissionCreatePage
        orderId={orderId}
        replacesMissionId={creating.replacesMissionId}
        onCreated={(id) => {
          setSelectedId(id)
          setCreating(null)
          query.reload()
        }}
      />
    </section>
  )
}

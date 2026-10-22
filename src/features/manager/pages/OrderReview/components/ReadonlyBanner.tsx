import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'

export function ReadonlyBanner({
  setViewStage,
}: {
  setViewStage: Dispatch<
    SetStateAction<
      'intake' | 'criteria' | 'decision' | 'deposit' | 'planning' | null
    >
  >
}) {
  return (
    <div className="odm-or-readonly-banner" role="status">
      <strong>Bạn đang xem lại bước đã hoàn thành</strong>
      <span>Thông tin này đã được xác nhận và hiện chỉ có thể xem.</span>
      <Button
        type="button"
        variant="primary"
        onClick={() => setViewStage(null)}
      >
        Quay lại bước hiện tại
      </Button>
    </div>
  )
}

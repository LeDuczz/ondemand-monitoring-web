import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'

export function PlanningAdjustmentForm({
  mutate,
  reason,
  setReason,
  busy,
  setAmending,
}: {
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  reason: string
  setReason: Dispatch<SetStateAction<string>>
  busy: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <form
      className="odm-planning-adjustment"
      onSubmit={(e) => {
        e.preventDefault()
        void mutate('amend')
      }}
    >
      <h3>Điều chỉnh kế hoạch</h3>
      <p>
        Mở lại kế hoạch để thêm hoặc thay thế Mission. Lịch sử thực thi vẫn được
        giữ nguyên.
      </p>
      <label>
        Lý do điều chỉnh kế hoạch
        <textarea
          required
          autoFocus
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <Button type="submit" variant="primary" disabled={busy || !reason.trim()}>
        Xác nhận điều chỉnh
      </Button>
      <Button
        type="button"
        onClick={() => setAmending(false)}
      >
        Đóng
      </Button>
    </form>
  )
}

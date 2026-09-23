import { useState } from 'react'

const REASONS = [
  'Trùng lịch cá nhân',
  'Chưa đủ điều kiện vận hành',
  'Địa điểm quá xa',
  'Dự báo thời tiết xấu',
  'Lý do khác',
]

export function RejectDialog({
  missionId,
  submitting,
  onCancel,
  onConfirm,
}: {
  missionId: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (reason: string, notes: string) => void
}) {
  const [reason, setReason] = useState(REASONS[0])
  const [notes, setNotes] = useState('')

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 20, 25, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        className="odm-card"
        style={{ width: 440, maxWidth: '92vw', padding: 0 }}
      >
        <div className="odm-card-body" style={{ padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Từ chối mission {missionId}
          </h2>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REASONS.map((r) => (
              <label
                key={r}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {r}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <label htmlFor="reject-notes" style={{ fontSize: 12.5, color: 'var(--tx3)', display: 'block', marginBottom: 6 }}>
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              id="reject-notes"
              className="odm-input"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mô tả thêm lý do từ chối..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <button type="button" className="odm-btn" onClick={onCancel} disabled={submitting}>
              Huỷ
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={() => onConfirm(reason, notes)}
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

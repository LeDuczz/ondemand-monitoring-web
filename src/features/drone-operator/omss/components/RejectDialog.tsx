import { useState } from 'react'

interface Props {
  onConfirm: (reason: string, notes?: string) => void
  onCancel: () => void
}

const REASONS = [
  { id: 'schedule', label: 'Trùng lịch cá nhân' },
  { id: 'qualification', label: 'Chưa đủ điều kiện vận hành' },
  { id: 'distance', label: 'Địa điểm quá xa' },
  { id: 'weather', label: 'Dự báo thời tiết xấu' },
  { id: 'other', label: 'Lý do khác' },
]

export default function RejectDialog({ onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<string>('')
  const [notes, setNotes] = useState('')

  const canConfirm = selected !== ''

  function handleConfirm() {
    if (!canConfirm) return
    const reason = REASONS.find((r) => r.id === selected)?.label ?? selected
    onConfirm(reason, selected === 'other' ? notes : undefined)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 28px 24px',
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 8px 40px rgba(0,0,0,.18)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
          Từ chối mission
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 20px' }}>
          Vui lòng chọn lý do từ chối để quản lý có thể điều phối lại.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {REASONS.map((r) => (
            <label
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${selected === r.id ? 'var(--blue)' : 'var(--border)'}`,
                background: selected === r.id ? 'var(--surface-2)' : 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                color: 'var(--text)',
              }}
            >
              <input
                type="radio"
                name="reject-reason"
                value={r.id}
                checked={selected === r.id}
                onChange={() => setSelected(r.id)}
                style={{ accentColor: 'var(--blue)' }}
              />
              {r.label}
            </label>
          ))}
        </div>

        {selected === 'other' && (
          <textarea
            className="op-input"
            placeholder="Nhập ghi chú thêm..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }}
          />
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="op-btn op-btn-ghost" onClick={onCancel}>
            Huỷ
          </button>
          <button
            className="op-btn op-btn-danger"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  )
}

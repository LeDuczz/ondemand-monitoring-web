interface Props {
  id: string
  label: string
  value: string
  result: 'PASS' | 'FAIL' | null
  onResult: (id: string, r: 'PASS' | 'FAIL') => void
}

export default function PreflightItem({ id, label, value, result, onResult }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{value}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onResult(id, 'PASS')}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: `1px solid ${result === 'PASS' ? 'var(--green)' : 'var(--border)'}`,
            background: result === 'PASS' ? 'var(--green)' : 'var(--surface)',
            color: result === 'PASS' ? '#fff' : 'var(--text-2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Đạt
        </button>
        <button
          onClick={() => onResult(id, 'FAIL')}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: `1px solid ${result === 'FAIL' ? 'var(--red)' : 'var(--border)'}`,
            background: result === 'FAIL' ? 'var(--red)' : 'var(--surface)',
            color: result === 'FAIL' ? '#fff' : 'var(--text-2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Không đạt
        </button>
      </div>
    </div>
  )
}

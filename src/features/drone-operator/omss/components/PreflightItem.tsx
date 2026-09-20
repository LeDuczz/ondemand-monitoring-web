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
      borderBottom: '1px solid var(--bd)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{value}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onResult(id, 'PASS')}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: `1px solid ${result === 'PASS' ? 'var(--green-solid)' : 'var(--bd)'}`,
            background: result === 'PASS' ? 'var(--green-solid)' : 'var(--sf)',
            color: result === 'PASS' ? '#fff' : 'var(--tx2)',
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
            border: `1px solid ${result === 'FAIL' ? 'var(--red-solid)' : 'var(--bd)'}`,
            background: result === 'FAIL' ? 'var(--red-solid)' : 'var(--sf)',
            color: result === 'FAIL' ? '#fff' : 'var(--tx2)',
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

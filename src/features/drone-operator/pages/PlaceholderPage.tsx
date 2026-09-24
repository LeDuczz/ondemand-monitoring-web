export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="odm-card">
      <div
        className="odm-card-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 10,
          padding: '80px 24px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ color: 'var(--tx3)' }}>Đang phát triển</div>
      </div>
    </div>
  )
}

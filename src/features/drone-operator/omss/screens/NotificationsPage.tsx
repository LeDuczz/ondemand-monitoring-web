export default function NotificationsPage() {
  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 12px',
        }}
      >
        Thông báo
      </h1>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 48,
          textAlign: 'center',
          color: 'var(--text-3)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-2)',
            marginBottom: 4,
          }}
        >
          Chưa có thông báo mới
        </div>
        <div style={{ fontSize: 13 }}>
          Thông báo về mission và chứng chỉ sẽ hiện ở đây.
        </div>
      </div>
    </div>
  )
}

import type { OperatorProfile } from '../types'

interface Props {
  profile: OperatorProfile | null
}

export default function ProfilePage({ profile }: Props) {
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
        Hồ sơ và chứng chỉ
      </h1>
      {profile ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 24,
            maxWidth: 480,
          }}
        >
          <Row label="Họ tên" value={profile.fullName} />
          <Row label="Mã phi công" value={profile.id} />
          <Row label="Hạng chứng chỉ" value={profile.licenseGrade} />
          <Row
            label="Hạn chứng chỉ"
            value={profile.certExpiryDate.split('-').reverse().join('/')}
          />
          <Row label="Trạm" value={profile.station} />
        </div>
      ) : (
        <div style={{ color: 'var(--text-3)' }}>Đang tải hồ sơ...</div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: 14,
      }}
    >
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

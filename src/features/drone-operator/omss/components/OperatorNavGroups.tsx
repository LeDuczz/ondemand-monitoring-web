import type { Screen } from '../types'

export interface NavLeaf {
  screen: Screen
  label: string
  badge?: number
}

export interface NavGroup {
  label: string
  items: NavLeaf[]
}

export const BREADCRUMB_LABELS: Partial<Record<Screen, string>> = {
  'mission-list': 'Mission của tôi',
  availability: 'Lịch rảnh',
  'mission-detail': 'Chi tiết mission',
  'accept-reject': 'Phản hồi mission',
  'gcs-connect': 'Kết nối drone',
  'control-handover': 'Bàn giao quyền điều khiển',
  preflight: 'Preflight',
  'preflight-failure': 'Lỗi preflight',
  'drone-replacement': 'Thay drone',
  'ready-to-fly': 'Sẵn sàng bay',
  'in-flight': 'Buồng lái',
  'return-to-base': 'Trở về',
  postflight: 'Postflight',
  'mission-completed': 'Hoàn thành mission',
  'mission-failed': 'Mission thất bại',
  'media-upload': 'Upload media',
  'manual-upload': 'Upload thủ công',
  'simulation-zones': 'Bản đồ vùng bay',
  notifications: 'Thông báo',
  profile: 'Hồ sơ và chứng chỉ',
  'operator-overview': 'Tổng quan',
}

export function buildOperatorNavGroups(
  pendingCount: number,
  notificationCount: number,
): NavGroup[] {
  return [
    {
      label: 'Công việc',
      items: [
        {
          screen: 'mission-list',
          label: 'Mission của tôi',
          badge: pendingCount,
        },
        { screen: 'availability', label: 'Lịch rảnh' },
      ],
    },
    {
      label: 'Chuyến bay',
      items: [
        { screen: 'gcs-connect', label: 'Kết nối drone' },
        { screen: 'control-handover', label: 'Bàn giao quyền' },
        { screen: 'preflight', label: 'Preflight' },
        { screen: 'in-flight', label: 'Buồng lái' },
        { screen: 'media-upload', label: 'Upload media' },
        { screen: 'postflight', label: 'Postflight' },
        { screen: 'simulation-zones', label: 'Vùng mô phỏng' },
      ],
    },
    {
      label: 'Tài khoản',
      items: [
        {
          screen: 'notifications',
          label: 'Thông báo',
          badge: notificationCount,
        },
        { screen: 'profile', label: 'Hồ sơ và chứng chỉ' },
      ],
    },
  ]
}

export function NavGroupView({
  group,
  activeScreen,
  onNavigate,
}: {
  group: NavGroup
  activeScreen: Screen
  onNavigate: (s: Screen) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          padding: '0 4px',
        }}
      >
        {group.label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {group.items.map((item) => {
          const active = item.screen === activeScreen
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: active ? 'var(--accent-bg)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'var(--font-ui)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
              }}
            >
              {item.label}
              {item.badge ? (
                <span
                  aria-label={`${item.badge} thông báo`}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--red)',
                    display: 'inline-block',
                  }}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

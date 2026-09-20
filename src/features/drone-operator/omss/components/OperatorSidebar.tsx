import { authSession } from '../../../auth/api/authApi'
import { LogoutButton } from '../../../auth/components/LogoutButton'
import type { Screen } from '../types'

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

interface NavLeaf {
  screen: Screen
  label: string
  icon: string
  badge?: number
}

interface NavGroup {
  label: string
  items: NavLeaf[]
}

function buildGroups(pendingCount: number, notificationCount: number): NavGroup[] {
  return [
    {
      label: 'Công việc',
      items: [
        { screen: 'mission-list', label: 'Mission của tôi', icon: '▤', badge: pendingCount },
        { screen: 'availability', label: 'Lịch rảnh', icon: '🗓' },
      ],
    },
    {
      label: 'Chuyến bay',
      items: [
        { screen: 'gcs-connect', label: 'Kết nối drone', icon: '⌁' },
        { screen: 'control-handover', label: 'Bàn giao quyền', icon: '⇄' },
        { screen: 'preflight', label: 'Preflight', icon: '✓' },
        { screen: 'in-flight', label: 'Buồng lái', icon: '◎' },
        { screen: 'media-upload', label: 'Upload media', icon: '⤒' },
        { screen: 'postflight', label: 'Postflight', icon: '⚑' },
        { screen: 'simulation-zones', label: 'Zone map', icon: '▦' },
      ],
    },
    {
      label: 'Tài khoản',
      items: [
        { screen: 'notifications', label: 'Thông báo', icon: '🔔', badge: notificationCount },
        { screen: 'profile', label: 'Hồ sơ và chứng chỉ', icon: '◉' },
      ],
    },
  ]
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

interface Props {
  screen: Screen
  onNavigate: (screen: Screen) => void
  pendingCount: number
  notificationCount: number
}

export default function OperatorSidebar({
  screen,
  onNavigate,
  pendingCount,
  notificationCount,
}: Props) {
  const groups = buildGroups(pendingCount, notificationCount)
  const user = authSession.getUser()

  return (
    <nav aria-label="Điều hướng phi công" className="odm-opr-side">
      <div className="odm-opr-brand">
        <span className="odm-opr-brand-mark" aria-hidden="true">
          ✦
        </span>
        <span>
          <span className="odm-opr-brand-name">OnDemand Monitor</span>
          <span className="odm-opr-brand-sub">Phi công · web</span>
        </span>
      </div>

      <div className="odm-opr-nav-scroll">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="odm-opr-navg">{group.label}</div>
            {group.items.map((item) => {
              const active = item.screen === screen
              return (
                <button
                  key={item.screen}
                  type="button"
                  className={`odm-opr-navi ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNavigate(item.screen)}
                >
                  <span aria-hidden="true" className="odm-opr-navi-icon">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="odm-opr-navc">{item.badge}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="odm-opr-user">
        <span className="odm-opr-avatar" aria-hidden="true">
          {initialsOf(user?.fullName)}
        </span>
        <span className="odm-opr-user-text">
          <span className="odm-opr-user-name">{user?.fullName ?? 'Phi công'}</span>
          <span className="odm-opr-user-email">{user?.email ?? ''}</span>
        </span>
      </div>
      <LogoutButton className="odm-opr-logout" />
    </nav>
  )
}

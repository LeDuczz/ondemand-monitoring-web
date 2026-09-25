import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { operatorHref, type OperatorRoute, type OperatorScreen } from './routes'

type NavItem = { label: string; icon: string; route: OperatorRoute; badge?: number }
type NavGroup = { label: string; items: NavItem[] }

function buildGroups(pendingCount: number, notificationCount: number): NavGroup[] {
  return [
    {
      label: 'Công việc',
      items: [
        { label: 'Mission của tôi', icon: '✈', route: { screen: 'missions' }, badge: pendingCount },
        { label: 'Bảo trì & Sự cố', icon: '🛠', route: { screen: 'maintenance' } },
        { label: 'Lịch rảnh', icon: '🗓', route: { screen: 'availability' } },
      ],
    },
    {
      label: 'Chuyến bay',
      items: [
        { label: 'Zone map', icon: '⛶', route: { screen: 'zoneMap' } },
      ],
    },
    {
      label: 'Tài khoản',
      items: [
        { label: 'Thông báo', icon: '🔔', route: { screen: 'notifications' }, badge: notificationCount },
        { label: 'Hồ sơ và chứng chỉ', icon: '◉', route: { screen: 'profile' } },
      ],
    },
  ]
}

const activeScreen: Record<OperatorScreen, string> = {
  missions: 'Mission của tôi',
  missionDetail: 'Mission của tôi',
  availability: 'Lịch rảnh',
  connect: 'Kết nối drone',
  handover: 'Bàn giao quyền',
  preflight: 'Preflight',
  flight: 'Buồng lái',
  upload: 'Upload media',
  postflight: 'Postflight',
  maintenance: 'Bảo trì & Sự cố',
  zoneMap: 'Zone map',
  notifications: 'Thông báo',
  profile: 'Hồ sơ và chứng chỉ',
  notFound: '',
}

export function operatorActiveLabel(screen: OperatorScreen): string {
  return activeScreen[screen]
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function OperatorSidebar({
  route,
  pendingCount = 0,
  notificationCount = 0,
}: {
  route: OperatorRoute
  pendingCount?: number
  notificationCount?: number
}) {
  const user = authSession.getUser()
  const active = activeScreen[route.screen]
  const groups = buildGroups(pendingCount, notificationCount)

  return (
    <nav aria-label="Điều hướng phi công" className="odm-opr-side">
      <div className="odm-opr-nav-scroll">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="odm-opr-navg">{group.label}</div>
            {group.items.map((item) => {
              const isActive = item.label === active
              return (
                <a
                  key={item.label}
                  href={operatorHref(item.route)}
                  className={`odm-opr-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span aria-hidden="true" style={{ minWidth: 16, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge ? <span className="odm-opr-navc">{item.badge}</span> : null}
                </a>
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

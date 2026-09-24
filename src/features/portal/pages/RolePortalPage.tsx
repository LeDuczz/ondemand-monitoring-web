import type { UserRole } from '../../auth/types'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

type PortalMetric = {
  label: string
  value: string
  detail: string
  icon: 'chart' | 'ticket' | 'clock' | 'shield' | 'radio'
}

const roleContent: Record<
  UserRole,
  {
    title: string
    subtitle: string
    eyebrow: string
    metrics: PortalMetric[]
    activities: string[]
    primary: string
  }
> = {
  CUSTOMER: {
    title: 'Your monitoring workspace',
    subtitle:
      'Create requests, follow progress, and review inspection outcomes in one place.',
    eyebrow: 'Customer command center',
    primary: 'Create monitoring request',
    metrics: [
      {
        label: 'Open requests',
        value: '04',
        detail: '1 needs your review',
        icon: 'ticket',
      },
      {
        label: 'In progress',
        value: '02',
        detail: 'Latest update 12 min ago',
        icon: 'clock',
      },
      {
        label: 'Reports ready',
        value: '08',
        detail: '3 new this month',
        icon: 'chart',
      },
      {
        label: 'Safety status',
        value: 'Good',
        detail: 'No critical findings',
        icon: 'shield',
      },
    ],
    activities: [
      'Cooling tower B inspection is in progress',
      'Report RPT-1048 is ready to review',
      'Request MON-2481 was assigned to an operations team',
    ],
  },
  STAFF: {
    title: 'Operations overview',
    subtitle:
      'Review incoming requests, assign the right team, and keep service delivery on track.',
    eyebrow: 'Service operations',
    primary: 'Review request queue',
    metrics: [
      {
        label: 'New requests',
        value: '12',
        detail: '5 received today',
        icon: 'ticket',
      },
      {
        label: 'In assignment',
        value: '07',
        detail: '2 need an operator',
        icon: 'clock',
      },
      {
        label: 'Active missions',
        value: '04',
        detail: 'Across 3 sites',
        icon: 'chart',
      },
      {
        label: 'SLA health',
        value: '96%',
        detail: 'Within target',
        icon: 'shield',
      },
    ],
    activities: [
      'MON-2492 is waiting for assignment',
      'East site inspection scheduled for 14:00',
      'Team Alpha completed preflight checks',
    ],
  },
  DRONE_OPERATOR: {
    title: 'Mission console',
    subtitle:
      'Manage assigned inspections from acceptance through post-flight review.',
    eyebrow: 'Field execution',
    primary: 'Open mission console',
    metrics: [
      {
        label: 'Assigned missions',
        value: '03',
        detail: '1 ready to accept',
        icon: 'ticket',
      },
      {
        label: 'Preflight ready',
        value: '02',
        detail: 'No blocking checks',
        icon: 'shield',
      },
      {
        label: 'Live missions',
        value: '01',
        detail: 'Telemetry connected',
        icon: 'chart',
      },
      {
        label: 'Device status',
        value: 'Good',
        detail: 'All assigned devices online',
        icon: 'clock',
      },
    ],
    activities: [
      'Mission M-001 is ready for operator acceptance',
      'DRONE-01 telemetry stream is connected',
      'Post-flight review pending for M-0008',
    ],
  },
  SYSTEM_OPERATOR: {
    title: 'System operations',
    subtitle:
      'Monitor device health, telemetry availability, and operational incidents.',
    eyebrow: 'Platform reliability',
    primary: 'Review device health',
    metrics: [
      {
        label: 'Devices online',
        value: '28/30',
        detail: '2 require attention',
        icon: 'radio',
      },
      {
        label: 'Telemetry health',
        value: '99.2%',
        detail: 'Last 24 hours',
        icon: 'chart',
      },
      {
        label: 'Active alerts',
        value: '03',
        detail: '1 high priority',
        icon: 'shield',
      },
      {
        label: 'Service uptime',
        value: '99.98%',
        detail: 'Current month',
        icon: 'clock',
      },
    ],
    activities: [
      'DRONE-07 has missed 3 telemetry heartbeats',
      'Media service latency returned to normal',
      'Device certificate rotation due in 9 days',
    ],
  },
  ADMIN: {
    title: 'Administration overview',
    subtitle:
      'Manage access, system governance, and the health of the Fieldwise platform.',
    eyebrow: 'System administration',
    primary: 'Manage user accounts',
    metrics: [
      {
        label: 'Total users',
        value: '148',
        detail: '+12 this month',
        icon: 'ticket',
      },
      {
        label: 'Active customers',
        value: '86',
        detail: '58% of all users',
        icon: 'chart',
      },
      {
        label: 'Open incidents',
        value: '02',
        detail: 'No critical incidents',
        icon: 'shield',
      },
      {
        label: 'Audit events',
        value: '324',
        detail: 'Last 24 hours',
        icon: 'clock',
      },
    ],
    activities: [
      'New customer account created today',
      'Staff role permissions were updated',
      'Weekly audit export is ready',
    ],
  },
  AUDITOR: {
    title: 'Audit workspace',
    subtitle: 'Review system audit logs and compliance records.',
    eyebrow: 'Audit overview',
    primary: 'View audit log',
    metrics: [
      { label: 'Audit events today', value: '12', detail: 'Last 24 hours', icon: 'clock' as const },
    ],
    activities: ['Review recent audit entries'],
  },
}

export function RolePortalPage({ role }: { role: UserRole }) {
  const content = roleContent[role]
  return (
    <PortalLayout role={role} title={content.title} subtitle={content.subtitle}>
      <section className="portal-welcome-panel">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2>Make the next decision with confidence.</h2>
          <p>
            Fieldwise keeps the request, people, devices, and evidence connected
            so every team can act from the same operational picture.
          </p>
        </div>
        <Button icon="arrow-up-right">{content.primary}</Button>
      </section>
      <section className="portal-metric-grid" aria-label="Key metrics">
        {content.metrics.map((metric) => (
          <article className="portal-metric-card" key={metric.label}>
            <div className="portal-metric-icon">
              <Icon name={metric.icon} />
            </div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>
      <section className="portal-lower-grid">
        <article className="portal-panel">
          <div className="portal-panel-heading">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>What needs attention</h2>
            </div>
            <Icon name="arrow-up-right" />
          </div>
          <div className="portal-activity-list">
            {content.activities.map((activity, index) => (
              <div className="portal-activity-item" key={activity}>
                <span
                  className={`portal-activity-dot ${index === 0 ? 'is-active' : ''}`}
                />
                <div>
                  <strong>{activity}</strong>
                  <small>
                    {index === 0
                      ? 'Updated just now'
                      : `${index + 1} hours ago`}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="portal-panel portal-next-panel">
          <p className="eyebrow">Next best action</p>
          <h2>Keep the workflow moving.</h2>
          <p>
            Use the workspace navigation to review the queue, inspect evidence,
            or resolve the next operational handoff.
          </p>
          <a href="#top" className="text-link">
            View workspace guidance <Icon name="arrow-right" />
          </a>
        </article>
      </section>
    </PortalLayout>
  )
}

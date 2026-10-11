import type { UserRole } from '../../auth/types'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { Icon, type IconName } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { rolePortalPageMessages } from './RolePortalPage.messages'

export function RolePortalPage({ role }: { role: UserRole }) {
  const { t } = useI18n(rolePortalPageMessages)
  const content = t.roleContent[role]
  return (
    <PortalLayout role={role} title={content.title} subtitle={content.subtitle}>
      <section className="portal-welcome-panel">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2>{t.heroTitle}</h2>
          <p>{t.heroCopy}</p>
        </div>
        <Button
          icon="arrow-up-right"
          onClick={() => {
            if (role === 'STAFF') {
              window.location.hash = '#portal/staff'
            }
          }}
        >
          {content.primary}
        </Button>
      </section>
      <section className="portal-metric-grid" aria-label={t.metricsAriaLabel}>
        {content.metrics.map((metric) => (
          <article className="portal-metric-card" key={metric.label}>
            <div className="portal-metric-icon">
              <Icon name={metric.icon as IconName} />
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
              <p className="eyebrow">{t.recentActivityEyebrow}</p>
              <h2>{t.recentActivityTitle}</h2>
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
                    {index === 0 ? t.updatedJustNow : t.hoursAgo(index + 1)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="portal-panel portal-next-panel">
          <p className="eyebrow">{t.nextActionEyebrow}</p>
          <h2>{t.nextActionTitle}</h2>
          <p>{t.nextActionCopy}</p>
          <a href="#top" className="text-link">
            {t.nextActionLink} <Icon name="arrow-right" />
          </a>
        </article>
      </section>
    </PortalLayout>
  )
}

import { Icon, type IconName } from '../../shared/components/Icon'
import { useI18n } from '../../shared/i18n'
import { rolePortalPageMessages } from '../portal/pages/RolePortalPage.messages'

/** Overview body for the System Operator portal (same data as the old portal home). */
export function SystemOperatorOverview() {
  const { t } = useI18n(rolePortalPageMessages)
  const content = t.roleContent.SYSTEM_OPERATOR
  return (
    <>
      <section className="odm-sysop-hero">
        <div>
          <p className="odm-sysop-hero-eyebrow">{content.eyebrow}</p>
          <h2>{t.heroTitle}</h2>
          <p>{t.heroCopy}</p>
        </div>
        <a className="odm-btn odm-btn-p" href="#portal/system-operator/devices">
          {content.primary}
        </a>
      </section>

      <section className="odm-sysop-metrics" aria-label={t.metricsAriaLabel}>
        {content.metrics.map((metric) => (
          <article className="odm-sysop-metric" key={metric.label}>
            <div className="odm-sysop-metric-icon">
              <Icon name={metric.icon as IconName} />
            </div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="odm-sysop-lower">
        <article className="odm-sysop-panel">
          <p className="odm-sysop-hero-eyebrow">{t.recentActivityEyebrow}</p>
          <h2>{t.recentActivityTitle}</h2>
          <div className="odm-sysop-activity">
            {content.activities.map((activity, index) => (
              <div className="odm-sysop-activity-item" key={activity}>
                <i className={index === 0 ? 'is-active' : ''} />
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
        <article className="odm-sysop-panel">
          <p className="odm-sysop-hero-eyebrow">{t.nextActionEyebrow}</p>
          <h2>{t.nextActionTitle}</h2>
          <p>{t.nextActionCopy}</p>
        </article>
      </section>
    </>
  )
}

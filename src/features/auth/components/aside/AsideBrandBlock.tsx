import { useI18n } from '../../../../shared/i18n'
import { authAsideMessages } from '../AuthAside.messages'
import { BrandMark } from '../BrandMark'

/**
 * Top-left brand lockup for the animated aside: mark + system name +
 * bilingual subtitle, fading/sliding in on mount (staggered with the
 * float cards via CSS animation-delay).
 */
export function AsideBrandBlock() {
  const { t } = useI18n(authAsideMessages)
  return (
    <div className="odm-aside-brand">
      <BrandMark />
      <div>
        <div className="odm-aside-brand-title odm-aside-brand-title--shimmer">
          OnDemand Monitor
        </div>
        <div className="odm-aside-brand-subtitle">{t.brandSubtitle}</div>
      </div>
    </div>
  )
}

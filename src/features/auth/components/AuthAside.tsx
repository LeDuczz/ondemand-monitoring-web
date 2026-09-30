import '../auth-aside.css'
import { useI18n } from '../../../shared/i18n'
import { authAsideMessages } from './AuthAside.messages'
import { AsideScene } from './aside/AsideScene'
import type { AsideValueProp } from './aside/AsideFloatCards'

export function AuthAside() {
  const { t } = useI18n(authAsideMessages)
  return (
    <aside className="odm-auth-aside" aria-label={t.asideLabel}>
      <AsideScene valueProps={t.valueProps as AsideValueProp[]} />
    </aside>
  )
}

import { useEffect, useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { themeToggleMessages } from './ThemeToggle.messages'

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const { t } = useI18n(themeToggleMessages)
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <div className="odm-auth-theme-toggle">
      <span>{t.label}</span>
      <button
        type="button"
        aria-label={dark ? t.switchToLight : t.switchToDark}
        onClick={() => setDark((value) => !value)}
      >
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
      <LanguageToggle />
    </div>
  )
}

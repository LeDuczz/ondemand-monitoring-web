import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { customerHref } from '../../../routes'
import { siblingNavMessages } from './SiblingNav.messages'

type Props = { prev: MediaItem | null; next: MediaItem | null }

export function SiblingNav({ prev, next }: Props) {
  const { t } = useI18n(siblingNavMessages)
  const link = (target: MediaItem | null, label: string) =>
    target ? (
      <a
        className="odm-btn odm-btn-gh"
        href={customerHref({ screen: 'mediaDetail', mediaId: target.id })}
      >
        {label}
      </a>
    ) : (
      <button type="button" className="odm-btn odm-btn-gh" disabled>
        {label}
      </button>
    )
  return (
    <nav className="mdp-nav" aria-label={t.label}>
      {link(prev, t.prev)}
      {link(next, t.next)}
    </nav>
  )
}

import { Icon } from '../../../../shared/components/Icon'

/**
 * Small glass status chip over the hero card's top-left corner: a live
 * pulsing dot plus the existing "radio" icon (already used for the
 * live-view value prop elsewhere in this scene) — no invented label text.
 */
export function AsideStatusChip() {
  return (
    <div className="odm-aside-status-chip" aria-hidden="true">
      <span className="odm-aside-status-dot" />
      <Icon name="radio" className="odm-aside-status-icon" />
    </div>
  )
}

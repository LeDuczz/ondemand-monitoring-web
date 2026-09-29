import { useEffect, useId, useRef, type ReactNode } from 'react'

import { Icon, type IconName } from '../../../../shared/components/Icon'
import { useI18n } from '../../../../shared/i18n'
import { modalMessages } from './Modal.messages'

export type ModalTone = 'primary' | 'danger' | 'warning' | 'success'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: IconName
  tone?: ModalTone
  /** Max width of the card in px. */
  width?: number
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Centered dialog with blurred overlay, tone icon header, Esc/backdrop close and a focus trap. */
export function Modal({
  title,
  subtitle,
  icon = 'shield',
  tone = 'primary',
  width = 480,
  onClose,
  children,
  footer,
}: Props) {
  const { t } = useI18n(modalMessages)
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const card = cardRef.current
    const first = card?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? card)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !card) return
      const items = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const head = items[0]
      const tail = items[items.length - 1]
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault()
        tail.focus()
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault()
        head.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="adm-modal-overlay" onMouseDown={onClose}>
      <div
        ref={cardRef}
        className="adm-modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-header">
          <span className={`adm-modal-icon is-${tone}`} aria-hidden="true">
            <Icon name={icon} width={20} height={20} />
          </span>
          <div className="adm-modal-heading">
            <h2 id={titleId} className="adm-modal-title">
              {title}
            </h2>
            {subtitle ? <p className="adm-modal-subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="adm-modal-close"
            onClick={onClose}
            aria-label={t.close}
          >
            <Icon name="x" width={16} height={16} />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer ? <div className="adm-modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { adminHref } from '../../../routes'
import { servicesTableMessages } from './ServicesTable.messages'
import type { AdminService } from '../../../types/catalog'
import './servicesTable.css'

export function ServiceRowActions({
  service,
  edit,
  remove,
}: {
  service: AdminService
  edit: () => void
  remove: () => void
}) {
  const { t } = useI18n(servicesTableMessages)
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    deleteButton.current?.focus()
    function outside(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])
  return (
    <div
      className="service-row-actions"
      ref={container}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <a
        className="odm-btn odm-btn-sm"
        href={adminHref({ screen: 'serviceChecklists', serviceId: service.id })}
      >
        <Icon name="clipboard" width={15} height={15} aria-hidden="true" />
        Checklist
      </a>
      <button
        type="button"
        className="odm-btn odm-btn-gh service-action-icon"
        aria-label={t.edit + ' ' + service.name}
        title={t.edit}
        onClick={edit}
      >
        <Icon name="edit" width={16} height={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-gh service-action-icon"
        ref={trigger}
        aria-label={t.more + ' ' + service.name}
        aria-expanded={open}
        title={t.more}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="more" width={16} height={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="service-action-disclosure"
          role="group"
          aria-label={t.more + ' ' + service.name}
        >
          <button
            type="button"
            className="odm-btn odm-btn-gh service-action-delete"
            ref={deleteButton}
            aria-label={t.remove + ' ' + service.name}
            onClick={() => {
              setOpen(false)
              remove()
            }}
          >
            <Icon name="trash" width={15} height={15} aria-hidden="true" />
            {t.remove}
          </button>
        </div>
      )}
    </div>
  )
}

import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from '../../../../shared/components/Icon'
import { ErrorState } from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { checklistMessages } from './checklists.messages'
import './checklists.css'

export function ChecklistIconButton({
  icon,
  label,
  danger = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className={
        'odm-btn odm-btn-gh checklist-icon-button' +
        (danger ? ' checklist-danger' : '')
      }
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={icon} width={16} height={16} aria-hidden="true" />
    </button>
  )
}

export function ChecklistPagination({
  page,
  totalPages,
  first,
  last,
  busy = false,
  change,
}: {
  page: number
  totalPages?: number
  first: boolean
  last: boolean
  busy?: boolean
  change: (page: number) => void
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <nav className="checklist-pagination" aria-label={t.pagination}>
      <span>
        {t.page} {page + 1}
        {totalPages !== undefined ? ' / ' + Math.max(1, totalPages) : ''}
      </span>
      <div className="checklist-actions">
        <button
          type="button"
          className="odm-btn"
          disabled={busy || first}
          onClick={() => change(page - 1)}
        >
          <Icon name="arrow-left" width={15} height={15} aria-hidden="true" />
          {t.previous}
        </button>
        <button
          type="button"
          className="odm-btn"
          disabled={busy || last}
          onClick={() => change(page + 1)}
        >
          {t.next}
          <Icon name="arrow-right" width={15} height={15} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export function ChecklistLoadError({
  title,
  error,
  retry,
}: {
  title: string
  error: unknown
  retry: () => void
}) {
  // Preserve shared technical detail as secondary information, never the main heading.
  return <ErrorState title={title} error={error} onRetry={retry} />
}

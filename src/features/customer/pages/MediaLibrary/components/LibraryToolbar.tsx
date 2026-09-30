import { useI18n } from '../../../../../shared/i18n'
import type { MediaFilter } from '../../../lib/media/types'
import { libraryToolbarMessages } from './LibraryToolbar.messages'

type Props = { filter: MediaFilter; onChange: (patch: Partial<MediaFilter>) => void }

const KINDS = ['all', 'image', 'video'] as const

export function LibraryToolbar({ filter, onChange }: Props) {
  const { t } = useI18n(libraryToolbarMessages)
  return (
    <div className="ml-toolbar">
      <div className="ml-chips" role="group" aria-label={t.kindLabel}>
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`ml-chip${filter.kind === kind ? ' is-active' : ''}`}
            aria-pressed={filter.kind === kind}
            onClick={() => onChange({ kind })}
          >
            {t.kind[kind]}
          </button>
        ))}
      </div>
      <input
        type="search"
        className="ml-search"
        value={filter.query}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchLabel}
        onChange={(event) => onChange({ query: event.target.value })}
      />
    </div>
  )
}

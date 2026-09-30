import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { libraryEmptyMessages } from './LibraryEmpty.messages'

type Props = { filtered: boolean; onClear: () => void }

export function LibraryEmpty({ filtered, onClear }: Props) {
  const { t } = useI18n(libraryEmptyMessages)
  return (
    <EmptyState
      title={t.title}
      description={filtered ? t.filtered : t.none}
      action={
        filtered ? (
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClear}>
            {t.clear}
          </button>
        ) : undefined
      }
    />
  )
}

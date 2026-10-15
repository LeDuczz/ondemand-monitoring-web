import { useI18n } from '../../../../../shared/i18n'
import type { MediaFile } from '../../../types/mission'
import { MediaTable } from './MediaTable'
import { mediaFileTableMessages } from './MediaFileTable.messages'

/** Collapsible table of all files with per-row retry. */
export function MediaFileTable({
  files,
  retryingId,
  onRetry,
}: {
  files: MediaFile[]
  retryingId: string | null
  onRetry: (id: string) => void
}) {
  const { t } = useI18n(mediaFileTableMessages)
  return (
    <details className="upload-media-table-wrap">
      <summary>{t.fileTable(files.length)}</summary>
      <MediaTable files={files} retryingId={retryingId} onRetry={onRetry} />
    </details>
  )
}

import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { customerMediaApi } from '../../api/customerMediaApi'
import { MediaGrid, MediaPreviewModal } from '../common/media'
import { Pager } from '../common/Pager'
import { toMediaItem } from '../../lib/media/mapMedia'
import type { MediaItem } from '../../lib/media/types'
import { customerReportMessages } from './messages'

/** Mounted only after the requested Order/Mission pair has been authorized. */
export function CustomerMissionMediaGallery({
  missionId,
  missionCode,
}: {
  missionId: string
  missionCode: string
}) {
  const { t } = useI18n(customerReportMessages)
  const [page, setPage] = useState(0)
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const query = useApiQuery(
    async (signal) => {
      const data = await customerMediaApi.listMissionMedia(
        missionId,
        page,
        12,
        signal,
      )
      if (data.items.some((item) => item.missionId !== missionId))
        throw new Error('Invalid Mission media scope')
      return data
    },
    [missionId, page],
  )
  return (
    <section className="cr-section" aria-label={t.media}>
      <div className="cr-heading">
        <h2>{t.media}</h2>
        <button
          className="odm-btn odm-btn-gh"
          disabled={query.loading}
          onClick={() => {
            setPreview(null)
            query.reload()
          }}
        >
          {t.retry}
        </button>
      </div>
      <p className="cr-note">{t.mediaNote}</p>
      {query.loading && <p role="status">{t.loading}</p>}
      {query.error ? (
        <p role="alert">{t.error}</p>
      ) : (
        query.data && (
          <>
            {query.data.items.length === 0 ? (
              <p>{t.noMedia}</p>
            ) : (
              <MediaGrid
                items={query.data.items.map(toMediaItem)}
                onOpen={setPreview}
              />
            )}
            <Pager
              page={query.data.page}
              totalPages={query.data.totalPages}
              totalItems={query.data.totalItems}
              unit={t.media}
              onPage={(p) => {
                setPreview(null)
                setPage(p)
              }}
            />
          </>
        )
      )}
      {preview && !query.error && (
        <MediaPreviewModal
          item={preview}
          missionLabel={missionCode}
          onClose={() => setPreview(null)}
          showDetailLink={false}
        />
      )}
    </section>
  )
}

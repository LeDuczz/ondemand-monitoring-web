import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { EmptyState, PageHeader, StatCard } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { MediaPreviewModal } from '../../components/common/media'
import { customerHref } from '../../routes'
import { MissionMediaSection } from './components/MissionMediaSection'
import { useOrderMedia } from './hooks/useOrderMedia'
import './Media.css'
import { mediaPageMessages } from './MediaPage.messages'

/** Published media of an owned Order, including ongoing Missions. */
export function MediaPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(mediaPageMessages)
  const media = useOrderMedia(orderId)

  if (media.loading && !media.loaded) {
    return (
      <div className="om-page">
        <LoadingState />
      </div>
    )
  }
  if (!media.loaded || media.error) {
    return (
      <div className="om-page">
        <div className="ui-page-back om-state-back">
          <a href={customerHref({ screen: 'orderDetail', orderId })}>
            {t.backToOrder}
          </a>
        </div>
        <ErrorState
          title={t.errorTitle}
          error={undefined}
          onRetry={media.reload}
        />
      </div>
    )
  }

  const allItems = media.sections.flatMap((section) => section.items)
  const photos = allItems.filter((item) => item.kind === 'image').length
  const videos = allItems.filter((item) => item.kind === 'video').length

  return (
    <div className="om-page">
      <PageHeader
        back={
          <a href={customerHref({ screen: 'orderDetail', orderId })}>
            {t.backToOrder}
          </a>
        }
        title={t.title}
        subtitle={t.subtitle}
      />
      {media.sections.length > 0 && (
        <section className="om-toolbar-card" aria-label={t.title}>
          <div className="om-stats">
            <StatCard label={t.missions} value={media.sections.length} />
            <StatCard label={t.photos} value={photos} />
            <StatCard label={t.videos} value={videos} />
          </div>
        </section>
      )}
      {media.sections.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <a
              className="odm-btn odm-btn-gh"
              href={customerHref({ screen: 'mediaLibrary' })}
            >
              {t.openLibrary}
            </a>
          }
        />
      ) : (
        media.sections.map(({ mission, items }) => (
          <MissionMediaSection
            key={mission.id}
            mission={mission}
            items={items}
            onOpen={(item) => media.openPreview(item.id)}
          />
        ))
      )}
      {media.preview && (
        <MediaPreviewModal
          item={media.preview}
          missionLabel={media.previewLabel}
          onClose={media.closePreview}
          onPrev={media.prevPreview}
          onNext={media.nextPreview}
        />
      )}
    </div>
  )
}

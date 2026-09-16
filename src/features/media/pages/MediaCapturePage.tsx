import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { env } from '../../../config/env'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { FakeFlightControllerMediaClient } from '../api/fakeFlightControllerMediaClient'
import { RealFlightControllerMediaClient } from '../api/realFlightControllerMediaClient'
import type { FlightControllerMediaClient } from '../api/flightControllerMediaClient'
import {
  controlContextApi,
  type MissionControlContext,
} from '../api/controlContextApi'
import { useMediaCapture } from '../hooks/useMediaCapture'
import type { LocalMedia, MediaStatus } from '../types/media'

const client: FlightControllerMediaClient =
  env.mediaClientMode === 'fake'
    ? new FakeFlightControllerMediaClient()
    : new RealFlightControllerMediaClient()

const statusLabels: Record<MediaStatus, string> = {
  CAPTURING: 'Capturing',
  REVIEW_PENDING: 'Review pending',
  UPLOAD_PENDING: 'Upload pending',
  UPLOADING: 'Uploading',
  VALIDATING: 'Validating',
  RETRY_REQUIRED: 'Retry required',
  AVAILABLE: 'Available',
  MANUAL_UPLOAD_REQUIRED: 'Manual upload',
  DISCARDED: 'Discarded',
  FAILED: 'Failed',
}

const formatSize = (size: number) =>
  size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(size / 1024)} KB`
const formatTime = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
const formatDuration = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
function StatusBadge({ status }: { status: MediaStatus }) {
  return (
    <span className={`media-status media-status--${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}

function MediaPreview({
  item,
  mediaClient,
}: {
  item: LocalMedia
  mediaClient: FlightControllerMediaClient
}) {
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [previewError, setPreviewError] = useState(false)

  useEffect(() => {
    let disposed = false
    let allocatedUrl = ''
    setPreviewError(false)
    void mediaClient
      .getPreviewUrl(item)
      .then((url) => {
        if (disposed) {
          mediaClient.releasePreviewUrl(url)
          return
        }
        allocatedUrl = url
        setPreviewUrl(url)
      })
      .catch(() => {
        if (!disposed) setPreviewError(true)
      })
    return () => {
      disposed = true
      if (allocatedUrl) mediaClient.releasePreviewUrl(allocatedUrl)
    }
  }, [item, mediaClient])

  return (
    <div
      className={`media-preview media-preview--${item.mediaType.toLowerCase()}`}
    >
      {previewUrl && item.mediaType === 'VIDEO' ? (
        <video src={previewUrl} controls preload="metadata">
          <track kind="captions" />
        </video>
      ) : previewUrl ? (
        <img
          src={previewUrl}
          alt={`${item.mediaType.toLowerCase()} preview for ${item.fileName}`}
        />
      ) : previewError ? (
        <span className="media-preview-error">Preview unavailable</span>
      ) : (
        <Icon name={item.mediaType === 'VIDEO' ? 'camera' : 'file-text'} />
      )}
      <span className="media-preview-type">{item.mediaType}</span>
    </div>
  )
}

function MediaDetails({ item }: { item: LocalMedia }) {
  return (
    <dl className="media-details">
      <div>
        <dt>Local media ID</dt>
        <dd>{item.localMediaId}</dd>
      </div>
      <div>
        <dt>Backend media ID</dt>
        <dd>{item.backendMediaId ?? 'Not uploaded'}</dd>
      </div>
      <div>
        <dt>Checksum</dt>
        <dd>{item.checksumSha256}</dd>
      </div>
      <div>
        <dt>Content type</dt>
        <dd>{item.contentType}</dd>
      </div>
    </dl>
  )
}

function MediaCard({
  item,
  onDiscard,
  onUpload,
  mediaClient,
  canUpload,
}: {
  item: LocalMedia
  onDiscard: (item: LocalMedia) => void
  onUpload: (item: LocalMedia) => void
  mediaClient: FlightControllerMediaClient
  canUpload: boolean
}) {
  const canReview =
    item.status === 'REVIEW_PENDING' || item.status === 'RETRY_REQUIRED'
  return (
    <article className="media-card">
      <MediaPreview item={item} mediaClient={mediaClient} />
      <div className="media-card-body">
        <div className="media-card-title-row">
          <div>
            <h3>{item.fileName}</h3>
            <p>
              {item.mediaType} · {formatTime(item.capturedAt)}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div className="media-card-meta">
          <span>{formatSize(item.fileSize)}</span>
          <span>{item.missionId}</span>
          <span>{item.droneId}</span>
        </div>
        {item.errorMessage ? (
          <p className="media-error">
            <Icon name="x" />
            {item.errorMessage}
          </p>
        ) : null}
        <MediaDetails item={item} />
        {canReview ? (
          <div className="media-card-actions">
            <Button
              variant="secondary"
              icon="x"
              onClick={() => onDiscard(item)}
            >
              Discard
            </Button>
            <Button
              icon="arrow-up-right"
              disabled={!canUpload}
              onClick={() => onUpload(item)}
            >
              Approve & upload
            </Button>
          </div>
        ) : null}
        {item.status === 'AVAILABLE' ? (
          <div className="media-ready">
            <Icon name="check" />
            Available in backend media storage
          </div>
        ) : null}
      </div>
    </article>
  )
}

function MediaCaptureWorkspace({
  context,
}: {
  context: MissionControlContext
}) {
  const missionId = context.missionCode || context.missionId
  const droneId = context.droneId
  const controller = useMediaCapture(client, missionId, droneId)
  const [selectedMedia, setSelectedMedia] = useState<LocalMedia>()
  const [notice, setNotice] = useState<string>()
  const [showDiscardDialog, setShowDiscardDialog] = useState<LocalMedia>()
  const visibleMedia = useMemo(
    () => controller.media.filter((item) => item.status !== 'DISCARDED'),
    [controller.media],
  )
  const activeCommand = controller.activeCommand

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      setNotice(success)
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'The command could not be completed.',
      )
    }
  }

  const discard = async () => {
    if (!showDiscardDialog) return
    const item = showDiscardDialog
    setShowDiscardDialog(undefined)
    await run(
      () => controller.discard(item.localMediaId),
      `${item.fileName} was discarded. The local audit record was retained.`,
    )
  }

  const upload = async (item: LocalMedia) => {
    setSelectedMedia(item)
    await run(
      () => controller.upload(item.localMediaId),
      `Upload started for ${item.fileName}.`,
    )
  }

  return (
    <PortalLayout
      role="DRONE_OPERATOR"
      title="Media capture & review"
      subtitle="Capture evidence locally, review it, then upload only what is ready."
    >
      <div className="media-page">
        <section
          className="media-connection-panel"
          aria-labelledby="media-connection-title"
        >
          <div className="media-connection-main">
            <div
              className={`connection-indicator connection-indicator--${controller.connection.toLowerCase()}`}
              aria-hidden="true"
            />
            <div>
              <p className="eyebrow">Flight controller service</p>
              <h2 id="media-connection-title">
                {controller.connection === 'CONNECTED'
                  ? 'Connected and ready'
                  : controller.connection}
              </h2>
              <p>Control Gateway · {env.controlApiBaseUrl}</p>
            </div>
          </div>
          <div className="media-connection-context">
            <span>
              Mission <strong>{missionId}</strong>
            </span>
            <span>
              Drone <strong>{droneId}</strong>
            </span>
            <Button
              variant="secondary"
              icon="radio"
              onClick={() => void controller.connect()}
            >
              Reconnect
            </Button>
          </div>
        </section>

        <section
          className="media-command-bar"
          aria-labelledby="capture-controls-title"
        >
          <div>
            <p className="eyebrow">Operator controls</p>
            <h2 id="capture-controls-title">Capture evidence</h2>
            <p>New media stays local and enters review before any upload.</p>
          </div>
          <div className="media-command-actions">
            <Button
              icon="camera"
              disabled={
                controller.connection !== 'CONNECTED' ||
                !context.mediaCaptureAllowed
              }
              onClick={() =>
                void run(
                  controller.captureImage,
                  'Image captured and added to review.',
                )
              }
            >
              Capture image
            </Button>
            <Button
              variant="secondary"
              icon="radio"
              disabled={
                controller.connection !== 'CONNECTED' ||
                controller.recording ||
                !context.mediaCaptureAllowed
              }
              onClick={() =>
                void run(controller.startVideo, 'Video recording started.')
              }
            >
              Start video
            </Button>
            <Button
              variant="secondary"
              icon="x"
              disabled={
                controller.connection !== 'CONNECTED' ||
                !controller.recording ||
                !context.mediaCaptureAllowed
              }
              onClick={() =>
                void run(
                  controller.stopVideo,
                  'Video recording stopped and added to review.',
                )
              }
            >
              Stop video
            </Button>
          </div>
          {controller.recording ? (
            <div className="recording-state" role="status">
              <span className="recording-dot" />
              Recording {formatDuration(controller.recordingSeconds)}
            </div>
          ) : null}
        </section>

        {notice ? (
          <div className="media-notice" role="status">
            <Icon name="check" />
            {notice}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotice(undefined)}
            >
              <Icon name="x" />
            </button>
          </div>
        ) : null}

        <section
          className="media-gallery-section"
          aria-labelledby="media-gallery-title"
        >
          <div className="media-section-heading">
            <div>
              <p className="eyebrow">Local media library</p>
              <h2 id="media-gallery-title">
                Review before upload <span>{visibleMedia.length}</span>
              </h2>
            </div>
            <span className="media-library-note">
              <Icon name="shield" />
              Local files remain available after upload failure
            </span>
          </div>
          {visibleMedia.length === 0 ? (
            <div className="media-empty">
              <Icon name="camera" />
              <h3>No media captured yet</h3>
              <p>
                Capture an image or start a video to create the first review
                item.
              </p>
            </div>
          ) : (
            <div className="media-grid">
              {visibleMedia.map((item) => (
                <MediaCard
                  key={item.localMediaId}
                  item={item}
                  onDiscard={setShowDiscardDialog}
                  onUpload={(media) => void upload(media)}
                  mediaClient={client}
                  canUpload={context.mediaUploadAllowed}
                />
              ))}
            </div>
          )}
        </section>

        {activeCommand ? (
          <section
            className="upload-tracker"
            aria-live="polite"
            aria-labelledby="upload-tracker-title"
          >
            <div>
              <p className="eyebrow">Live command stream</p>
              <h2 id="upload-tracker-title">Upload progress</h2>
              <p>Watching command {activeCommand.commandId.slice(0, 12)}…</p>
            </div>
            <div className="upload-steps">
              {(
                [
                  'ACCEPTED',
                  'RUNNING',
                  'UPLOAD_PENDING',
                  'UPLOADING',
                  'VALIDATING',
                  'AVAILABLE',
                ] as const
              ).map((step) => (
                <span
                  className={
                    step === activeCommand.state ||
                    (step === 'AVAILABLE' &&
                      activeCommand.state === 'SUCCEEDED')
                      ? 'is-current'
                      : ''
                  }
                  key={step}
                >
                  {step.replace('_', ' ')}
                </span>
              ))}
            </div>
            <StatusBadge
              status={activeCommand.media?.status ?? 'UPLOAD_PENDING'}
            />
          </section>
        ) : null}
      </div>

      {showDiscardDialog ? (
        <div className="media-dialog-backdrop" role="presentation">
          <div
            className="media-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-title"
          >
            <span className="media-dialog-icon">
              <Icon name="x" />
            </span>
            <h2 id="discard-title">Discard this media?</h2>
            <p>
              <strong>{showDiscardDialog.fileName}</strong> will be removed from
              local storage. The audit record will remain available.
            </p>
            <div className="media-dialog-actions">
              <Button
                variant="secondary"
                onClick={() => setShowDiscardDialog(undefined)}
              >
                Keep media
              </Button>
              <Button onClick={() => void discard()}>Discard media</Button>
            </div>
          </div>
        </div>
      ) : null}
      {selectedMedia ? (
        <span className="sr-only">
          Selected upload: {selectedMedia.fileName}
        </span>
      ) : null}
    </PortalLayout>
  )
}

function requestedMission() {
  const query = window.location.hash.split('?')[1] ?? ''
  return new URLSearchParams(query).get('missionId') ?? ''
}

export function MediaCapturePage() {
  const [missionInput, setMissionInput] = useState(requestedMission)
  const [context, setContext] = useState<MissionControlContext>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const openMission = async (missionId: string) => {
    const normalized = missionId.trim()
    if (!normalized) return
    setLoading(true)
    setError(undefined)
    try {
      const resolved = await controlContextApi.get(normalized)
      setContext(resolved)
      const query = new URLSearchParams({ missionId: normalized })
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}#portal/drone-operator/media?${query}`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to open mission.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = requestedMission()
    if (initial) void openMission(initial)
  }, [])

  if (context) return <MediaCaptureWorkspace context={context} />

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void openMission(missionInput)
  }

  return (
    <PortalLayout
      role="DRONE_OPERATOR"
      title="Media capture & review"
      subtitle="Select an assigned mission before connecting to its Flight Controller."
    >
      <form className="media-mission-selector" onSubmit={submit}>
        <div>
          <p className="eyebrow">Mission context</p>
          <h2>Open an assigned mission</h2>
          <p>The backend will resolve and verify the assigned drone.</p>
        </div>
        <label>
          Mission ID or code
          <input
            value={missionInput}
            onChange={(event) => setMissionInput(event.target.value)}
            placeholder="FLOW4-MISSION-001"
            autoComplete="off"
          />
        </label>
        {error ? <p className="media-error">{error}</p> : null}
        <Button disabled={loading || !missionInput.trim()}>
          {loading ? 'Opening…' : 'Open mission'}
        </Button>
      </form>
    </PortalLayout>
  )
}

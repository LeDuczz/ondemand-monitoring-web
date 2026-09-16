import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { AuthApiError } from '../../auth/api/authApi'
import {
  customerMediaApi,
  type AvailableMedia,
  type MediaMetadata,
} from '../api/customerMediaApi'

const formatSize = (size?: number) =>
  size ? `${(size / (1024 * 1024)).toFixed(1)} MB` : 'Size unavailable'
const formatTime = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))

function CustomerMediaItem({
  item,
  onSelect,
  selected,
}: {
  item: AvailableMedia
  onSelect: (item: AvailableMedia) => void
  selected: boolean
}) {
  return (
    <button
      className={`customer-media-item ${selected ? 'is-selected' : ''}`}
      type="button"
      onClick={() => onSelect(item)}
      aria-pressed={selected}
    >
      <span
        className={`customer-media-thumb customer-media-thumb--${item.type.toLowerCase()}`}
        aria-hidden="true"
      >
        <Icon name={item.type === 'VIDEO' ? 'camera' : 'file-text'} />
        {item.type === 'VIDEO' ? <small>VIDEO</small> : <small>PHOTO</small>}
      </span>
      <span className="customer-media-item-copy">
        <strong>
          {item.originalFileName ?? `${item.type.toLowerCase()}-${item.id}`}
        </strong>
        <small>{formatTime(item.capturedAt)}</small>
        <small>
          {formatSize(item.fileSize)} · {item.deviceCode ?? 'Drone unavailable'}
        </small>
      </span>
      <Icon name="arrow-right" />
    </button>
  )
}

function CustomerMediaViewer({
  metadata,
  item,
}: {
  metadata: MediaMetadata
  item: AvailableMedia
}) {
  return (
    <section
      className="customer-media-viewer"
      aria-labelledby="customer-media-viewer-title"
    >
      <div className="customer-media-viewer-frame">
        {metadata.type === 'VIDEO' ? (
          <video
            controls
            preload="metadata"
            src={metadata.url}
            aria-label={`Inspection video ${item.originalFileName ?? item.id}`}
          />
        ) : (
          <img
            src={metadata.url}
            alt={`Inspection evidence ${item.originalFileName ?? item.id}`}
          />
        )}
      </div>
      <div className="customer-media-viewer-heading">
        <div>
          <p className="eyebrow">Available evidence</p>
          <h2 id="customer-media-viewer-title">
            {item.originalFileName ?? item.id}
          </h2>
          <p>
            Verified by backend storage event · Available for customer review
          </p>
        </div>
        <a
          className="button button--secondary"
          href={metadata.url}
          download={item.originalFileName}
        >
          <Icon name="arrow-up-right" />
          Download
        </a>
      </div>
      <dl className="customer-media-meta">
        <div>
          <dt>Mission</dt>
          <dd>{metadata.missionId}</dd>
        </div>
        <div>
          <dt>Drone</dt>
          <dd>{metadata.droneId ?? '—'}</dd>
        </div>
        <div>
          <dt>Captured</dt>
          <dd>{formatTime(metadata.capturedAt)}</dd>
        </div>
        <div>
          <dt>Content</dt>
          <dd>{metadata.contentType}</dd>
        </div>
      </dl>
    </section>
  )
}

export function CustomerMediaPage() {
  const [missionId, setMissionId] = useState(requestedMission)
  const [missionInput, setMissionInput] = useState(requestedMission)
  const [items, setItems] = useState<AvailableMedia[]>([])
  const [selected, setSelected] = useState<AvailableMedia>()
  const [metadata, setMetadata] = useState<MediaMetadata>()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!missionId) return
    setState('loading')
    setError('')
    try {
      const available = (await customerMediaApi.list(missionId)).filter(
        (item) => item.type === 'IMAGE' || item.type === 'VIDEO',
      )
      setItems(available)
      setSelected((current) =>
        current && available.some((item) => item.id === current.id)
          ? current
          : available[0],
      )
      setState('ready')
    } catch (requestError) {
      setError(
        requestError instanceof AuthApiError
          ? requestError.message
          : 'Media could not be loaded. Check your connection and try again.',
      )
      setState('error')
    }
  }, [missionId])

  useEffect(() => {
    if (missionId) void load()
  }, [load])

  useEffect(() => {
    if (!selected) {
      setMetadata(undefined)
      return
    }
    let active = true
    setMetadata(undefined)
    void customerMediaApi
      .getMetadata(selected.id)
      .then((result) => {
        if (active) setMetadata(result)
      })
      .catch(() => {
        if (active)
          setError('The media metadata could not be loaded. Please retry.')
      })
    return () => {
      active = false
    }
  }, [selected])

  const openMission = (event: FormEvent) => {
    event.preventDefault()
    const normalized = missionInput.trim()
    if (!normalized) return
    setItems([])
    setSelected(undefined)
    setMetadata(undefined)
    setMissionId(normalized)
    const query = new URLSearchParams({ missionId: normalized })
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}#portal/customer/media?${query}`,
    )
  }

  if (!missionId) {
    return (
      <PortalLayout
        role="CUSTOMER"
        title="Media library"
        subtitle="Review verified inspection evidence from your monitoring missions."
      >
        <form className="media-mission-selector" onSubmit={openMission}>
          <div>
            <p className="eyebrow">Mission evidence</p>
            <h2>Open a mission library</h2>
            <p>Only media available to your account will be returned.</p>
          </div>
          <label>
            Mission ID or code
            <input
              value={missionInput}
              onChange={(event) => setMissionInput(event.target.value)}
              placeholder="Enter a mission ID"
              autoComplete="off"
            />
          </label>
          <Button disabled={!missionInput.trim()}>Open media library</Button>
        </form>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout
      role="CUSTOMER"
      title="Media library"
      subtitle="Review verified inspection evidence from your monitoring missions."
    >
      <div className="customer-media-page">
        <div className="customer-media-context">
          <div>
            <p className="eyebrow">Mission evidence</p>
            <h2>{missionId}</h2>
            <p>
              Only media confirmed as AVAILABLE by the backend is shown here.
            </p>
          </div>
          <Button
            variant="secondary"
            icon="radio"
            onClick={() => void load()}
            disabled={state === 'loading'}
          >
            {state === 'loading' ? 'Refreshing…' : 'Refresh library'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setMissionId('')
              setMissionInput('')
              window.history.replaceState(
                null,
                '',
                `${window.location.pathname}#portal/customer/media`,
              )
            }}
          >
            Change mission
          </Button>
        </div>
        {state === 'error' ? (
          <div
            className="customer-media-state customer-media-state--error"
            role="alert"
          >
            <Icon name="x" />
            <h2>We could not load this library</h2>
            <p>{error}</p>
            <Button onClick={() => void load()} icon="arrow-right">
              Try again
            </Button>
          </div>
        ) : null}
        {state === 'loading' ? (
          <div className="customer-media-state" role="status">
            <span className="media-spinner" />
            <h2>Loading verified media…</h2>
            <p>Checking the latest available inspection evidence.</p>
          </div>
        ) : null}
        {state === 'ready' && items.length === 0 ? (
          <div className="customer-media-state">
            <Icon name="file-text" />
            <h2>No verified media yet</h2>
            <p>
              Inspection evidence will appear here after the backend confirms
              the storage upload.
            </p>
          </div>
        ) : null}
        {state === 'ready' && items.length > 0 ? (
          <div className="customer-media-layout">
            <section
              className="customer-media-list"
              aria-labelledby="customer-media-list-title"
            >
              <div className="customer-media-list-heading">
                <div>
                  <p className="eyebrow">Verified library</p>
                  <h2 id="customer-media-list-title">
                    Available media <span>{items.length}</span>
                  </h2>
                </div>
              </div>
              {items.map((item) => (
                <CustomerMediaItem
                  key={item.id}
                  item={item}
                  selected={item.id === selected?.id}
                  onSelect={setSelected}
                />
              ))}
            </section>
            {selected && metadata ? (
              <CustomerMediaViewer item={selected} metadata={metadata} />
            ) : (
              <div
                className="customer-media-viewer customer-media-viewer--loading"
                role="status"
              >
                <span className="media-spinner" />
                <p>Preparing secure preview…</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </PortalLayout>
  )
}

function requestedMission() {
  const query = window.location.hash.split('?')[1] ?? ''
  return new URLSearchParams(query).get('missionId') ?? ''
}

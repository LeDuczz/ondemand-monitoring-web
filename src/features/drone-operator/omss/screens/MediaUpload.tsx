import { useCallback, useEffect, useState } from 'react'
import { operatorMediaApi, type LocalMedia } from '../../../media/api/operatorMediaApi'
import type { Mission } from '../types'

interface Props {
  mission: Mission
  onDone: () => void
  onManual: () => void
}

export default function MediaUpload({ mission, onDone, onManual }: Props) {
  const operationalMissionId = mission.backendId ?? mission.id
  const [items, setItems] = useState<LocalMedia[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const local = await operatorMediaApi.list(operationalMissionId)
      setItems(local)
      setError(null)
      const ids = local.filter((item) => item.backendMediaId).map((item) => item.backendMediaId!)
      const results = await Promise.allSettled(ids.map((id) => operatorMediaApi.status(id)))
      setStatus((previous) => {
        const next = { ...previous }
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') next[ids[index]] = result.value.status
        })
        return next
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot load local media')
    } finally {
      setLoading(false)
    }
  }, [operationalMissionId])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function discard(item: LocalMedia) {
    if (!window.confirm(`Discard ${item.fileName} from the Flight Controller?`)) return
    setBusyId(item.localMediaId)
    try {
      await operatorMediaApi.discard(item.localMediaId)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Discard failed')
    } finally {
      setBusyId(null)
    }
  }

  async function approve(item: LocalMedia) {
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.upload(item)
      setStatus((previous) => ({ ...previous, [mediaId]: 'VALIDATING' }))
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed')
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Review captured media</h1>
        <p style={{ color: 'var(--text-2)' }}>
          Files remain on the Flight Controller until you discard them. Approve sends the original
          directly to S3; the Customer sees it only after backend validation.
        </p>
        <div style={{ display: 'flex', gap: 10, margin: '20px 0' }}>
          <button onClick={() => void refresh()}>Refresh</button>
          <button onClick={onManual}>Manual upload tasks</button>
          <button onClick={onDone}>Back to missions</button>
        </div>
        {error && <p role="alert" style={{ color: 'var(--red-text)' }}>{error}</p>}
        {loading && <p>Loading local media…</p>}
        {!loading && items.length === 0 && <p>No captures for this mission yet.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {items.map((item) => {
            const backendStatus = item.backendMediaId ? status[item.backendMediaId] : undefined
            const effective = backendStatus ?? item.status
            const canApprove = !busyId && ['REVIEW_PENDING', 'UPLOAD_FAILED', 'UPLOAD_PENDING', 'RETRY_REQUIRED', 'MANUAL_UPLOAD_REQUIRED'].includes(effective)
            return (
              <article key={item.localMediaId} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                {item.mediaType === 'IMAGE' ? (
                  <img src={operatorMediaApi.previewUrl(item.localMediaId)} alt={item.fileName} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', background: '#222' }} />
                ) : (
                  <video src={operatorMediaApi.previewUrl(item.localMediaId)} controls preload="metadata" style={{ width: '100%', aspectRatio: '16 / 9', background: '#222' }} />
                )}
                <div style={{ padding: 16 }}>
                  <strong style={{ overflowWrap: 'anywhere' }}>{item.fileName}</strong>
                  <p>{item.mediaType} · {(item.fileSize / 1024 / 1024).toFixed(2)} MB · {effective} · {item.missionCode ?? item.missionId}</p>
                  {item.previewError && <p role="alert" style={{ color: 'var(--red-text)' }}>{item.previewError}</p>}
                  {item.backendMediaId && <p style={{ overflowWrap: 'anywhere' }}>Backend media: {item.backendMediaId}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={!canApprove} onClick={() => void approve(item)}>
                      {busyId === item.localMediaId ? 'Uploading…' : 'Approve & upload'}
                    </button>
                    <button disabled={!!busyId || !(['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(item.status) || backendStatus === 'AVAILABLE')} onClick={() => void discard(item)}>
                      {backendStatus === 'AVAILABLE' ? 'Remove local copy' : 'Discard'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { customerMediaApi, type AvailableMedia } from '../../media/api/customerMediaApi'

export function CustomerMediaGallery() {
  const [missionId, setMissionId] = useState('')
  const [items, setItems] = useState<AvailableMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!missionId.trim()) return
    setLoading(true)
    try {
      setItems(await customerMediaApi.list(missionId.trim()))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot load mission media')
    } finally {
      setLoading(false)
    }
  }

  async function open(item: AvailableMedia) {
    try {
      const fresh = await customerMediaApi.getMetadata(item.mediaId)
      window.open(fresh.downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot open media')
    }
  }

  return (
    <section style={{ margin: '32px auto', padding: 24, maxWidth: 1100 }}>
      <h2>Mission media</h2>
      <p>Validated photos and videos are visible here after the operator approves the upload.</p>
      <form onSubmit={(event) => { event.preventDefault(); void load() }} style={{ display: 'flex', gap: 8 }}>
        <label htmlFor="customer-media-mission">Mission ID or code</label>
        <input id="customer-media-mission" value={missionId} onChange={(event) => setMissionId(event.target.value)} />
        <button type="submit" disabled={loading || !missionId.trim()}>{loading ? 'Loading…' : 'View media'}</button>
      </form>
      {error && <p role="alert" style={{ color: 'var(--red-text)' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
        {items.map((item) => (
          <article key={item.mediaId} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {item.mediaType === 'IMAGE'
              ? <img src={item.downloadUrl} alt={item.fileName} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
              : <video src={item.downloadUrl} controls preload="metadata" style={{ width: '100%', aspectRatio: '16 / 9' }} />}
            <div style={{ padding: 12 }}>
              <strong>{item.fileName}</strong>
              <p>{item.mediaType} · {(item.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={() => void open(item)}>Open or download</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

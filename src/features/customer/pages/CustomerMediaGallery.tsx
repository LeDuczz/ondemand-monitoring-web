import { useEffect, useState } from 'react'
import { customerMediaApi, type AvailableMedia } from '../../media/api/customerMediaApi'

export function CustomerMediaGallery() {
  const [missionFilter, setMissionFilter] = useState('')
  const [items, setItems] = useState<AvailableMedia[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [media, notifications] = await Promise.all([
        customerMediaApi.listMine(), customerMediaApi.myNotifications(),
      ])
      setItems(media)
      setNotificationCount(notifications.length)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot load mission media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 30000)
    return () => window.clearInterval(timer)
  }, [])

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
      <p>Validated photos and videos are visible here after the operator approves the upload. {notificationCount} ready notifications.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <label htmlFor="customer-media-mission">Filter mission</label>
        <input id="customer-media-mission" value={missionFilter} onChange={(event) => setMissionFilter(event.target.value)} />
        <button type="button" onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--red-text)' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
        {items.filter((item) => item.missionId.toLowerCase().includes(missionFilter.toLowerCase())).map((item) => (
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

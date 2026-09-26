import { useCallback, useEffect, useState } from 'react'
import { operatorMediaApi, type LocalMedia } from '../../../media/api/operatorMediaApi'
import { PcBackupPicker } from '../../../media/components/PcBackupPicker'

interface Props {
  missionId: string
  onComplete: () => void
  onBack: () => void
}

export default function ManualUpload({ missionId, onComplete, onBack }: Props) {
  const [items, setItems] = useState<LocalMedia[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const local = await operatorMediaApi.reviewItems(missionId)
      const statuses = await Promise.all(local.map(async (item) => {
        if (!item.backendMediaId) return null
        try { return await operatorMediaApi.status(item.backendMediaId) }
        catch { return null }
      }))
      setItems(local.filter((item, index) => item.manualTaskId &&
        ['MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PENDING', 'VALIDATING'].includes(statuses[index]?.status ?? item.status)))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot load manual upload tasks')
    }
  }, [missionId])

  useEffect(() => { void refresh() }, [refresh])

  async function retry(item: LocalMedia) {
    setBusy(item.localMediaId)
    try {
      await operatorMediaApi.upload(item, true)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Manual upload failed')
    } finally {
      setBusy(null)
    }
  }

  async function uploadPc(item: LocalMedia, file: File) {
    setBusy(item.localMediaId)
    setError(null)
    try {
      await operatorMediaApi.uploadPcBackup(item, file)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'PC backup upload failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="fade-in" style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
      <h1>Manual media upload</h1>
      <p>These files require manual recovery. Retry the Flight Controller original or select an exact backup from PC.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => void refresh()}>Refresh</button>
        <button onClick={onBack}>Back to review</button>
        <button onClick={onComplete}>Back to missions</button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--red-text)' }}>{error}</p>}
      {items.length === 0 && <p>No manual upload task for this mission.</p>}
      {items.map((item) => (
        <article key={item.localMediaId} style={{ padding: 16, marginTop: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
          <strong>{item.fileName}</strong>
          <p>{item.mediaType} · {(item.fileSize / 1024 / 1024).toFixed(2)} MB · local ID {item.localMediaId}</p>
          <button disabled={!!busy || item.localAvailable === false || item.status === 'VALIDATING'} onClick={() => void retry(item)}>
            {busy === item.localMediaId ? 'Uploading…' : 'Start manual retry'}
          </button>
          {item.reason && <p>{item.reason}</p>}
          {item.status !== 'VALIDATING' && <PcBackupPicker contentType={item.contentType} disabled={!!busy}
            onSelect={(file) => void uploadPc(item, file)} />}
        </article>
      ))}
    </section>
  )
}

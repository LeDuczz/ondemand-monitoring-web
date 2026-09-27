import { useCallback, useEffect, useState } from 'react'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../media/api/operatorMediaApi'
import { useI18n } from '../../../../shared/i18n'
import { manualUploadMessages } from '../i18n/manualUpload'

interface Props {
  missionId: string
  onComplete: () => void
  onBack: () => void
}

export default function ManualUpload({ missionId, onComplete, onBack }: Props) {
  const { t } = useI18n(manualUploadMessages)
  const [items, setItems] = useState<LocalMedia[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const local = await operatorMediaApi.list(missionId)
      const statuses = await Promise.all(
        local.map(async (item) => {
          if (!item.backendMediaId) return null
          try {
            return await operatorMediaApi.status(item.backendMediaId)
          } catch {
            return null
          }
        }),
      )
      setItems(
        local.filter(
          (_, index) => statuses[index]?.status === 'MANUAL_UPLOAD_REQUIRED',
        ),
      )
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.cannotLoadTasks)
    }
  }, [missionId, t.cannotLoadTasks])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function retry(item: LocalMedia) {
    setBusy(item.localMediaId)
    try {
      await operatorMediaApi.upload(item)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.uploadFailed)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      className="fade-in"
      style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}
    >
      <h1>{t.title}</h1>
      <p>{t.description}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => void refresh()}>{t.refresh}</button>
        <button onClick={onBack}>{t.backToReview}</button>
        <button onClick={onComplete}>{t.backToMissions}</button>
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--red-text)' }}>
          {error}
        </p>
      )}
      {items.length === 0 && <p>{t.noTasks}</p>}
      {items.map((item) => (
        <article
          key={item.localMediaId}
          style={{
            padding: 16,
            marginTop: 12,
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <strong>{item.fileName}</strong>
          <p>
            {item.mediaType} · {(item.fileSize / 1024 / 1024).toFixed(2)} MB ·{' '}
            {t.localId} {item.localMediaId}
          </p>
          <button disabled={!!busy} onClick={() => void retry(item)}>
            {busy === item.localMediaId ? t.uploading : t.startRetry}
          </button>
        </article>
      ))}
    </section>
  )
}

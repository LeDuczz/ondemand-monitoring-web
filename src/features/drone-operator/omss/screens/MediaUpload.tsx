import { useCallback, useEffect, useState } from 'react'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../media/api/operatorMediaApi'
import { useI18n } from '../../../../shared/i18n'
import { mediaUploadMessages } from '../i18n/mediaUpload'
import type { Mission } from '../types'

interface Props {
  mission: Mission
  onDone: () => void
  onManual: () => void
}

export default function MediaUpload({ mission, onDone, onManual }: Props) {
  const { t } = useI18n(mediaUploadMessages)
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
      const ids = local
        .filter((item) => item.backendMediaId)
        .map((item) => item.backendMediaId!)
      const results = await Promise.allSettled(
        ids.map((id) => operatorMediaApi.status(id)),
      )
      setStatus((previous) => {
        const next = { ...previous }
        results.forEach((result, index) => {
          if (result.status === 'fulfilled')
            next[ids[index]] = result.value.status
        })
        return next
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.cannotLoad)
    } finally {
      setLoading(false)
    }
  }, [operationalMissionId, t.cannotLoad])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function discard(item: LocalMedia) {
    if (!window.confirm(t.discardConfirm(item.fileName))) return
    setBusyId(item.localMediaId)
    try {
      await operatorMediaApi.discard(item.localMediaId)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.discardFailed)
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
      setError(cause instanceof Error ? cause.message : t.uploadFailed)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>{t.title}</h1>
        <p style={{ color: 'var(--text-2)' }}>{t.description}</p>
        <div style={{ display: 'flex', gap: 10, margin: '20px 0' }}>
          <button onClick={() => void refresh()}>{t.refresh}</button>
          <button onClick={onManual}>{t.manualUploadTasks}</button>
          <button onClick={onDone}>{t.backToMissions}</button>
        </div>
        {error && (
          <p role="alert" style={{ color: 'var(--red-text)' }}>
            {error}
          </p>
        )}
        {loading && <p>{t.loading}</p>}
        {!loading && items.length === 0 && <p>{t.noCaptures}</p>}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((item) => {
            const backendStatus = item.backendMediaId
              ? status[item.backendMediaId]
              : undefined
            const effective = backendStatus ?? item.status
            const canApprove =
              !busyId &&
              [
                'REVIEW_PENDING',
                'UPLOAD_FAILED',
                'UPLOAD_PENDING',
                'RETRY_REQUIRED',
                'MANUAL_UPLOAD_REQUIRED',
              ].includes(effective)
            return (
              <article
                key={item.localMediaId}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--surface)',
                }}
              >
                {item.mediaType === 'IMAGE' ? (
                  <img
                    src={operatorMediaApi.previewUrl(item.localMediaId)}
                    alt={item.fileName}
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      objectFit: 'contain',
                      background: '#222',
                    }}
                  />
                ) : (
                  <video
                    src={operatorMediaApi.previewUrl(item.localMediaId)}
                    controls
                    preload="metadata"
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: '#222',
                    }}
                  />
                )}
                <div style={{ padding: 16 }}>
                  <strong style={{ overflowWrap: 'anywhere' }}>
                    {item.fileName}
                  </strong>
                  <p>
                    {item.mediaType} ·{' '}
                    {(item.fileSize / 1024 / 1024).toFixed(2)} MB · {effective}{' '}
                    · {item.missionCode ?? item.missionId}
                  </p>
                  {item.previewError && (
                    <p role="alert" style={{ color: 'var(--red-text)' }}>
                      {item.previewError}
                    </p>
                  )}
                  {item.backendMediaId && (
                    <p style={{ overflowWrap: 'anywhere' }}>
                      {t.backendMedia}: {item.backendMediaId}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={!canApprove}
                      onClick={() => void approve(item)}
                    >
                      {busyId === item.localMediaId
                        ? t.uploading
                        : t.approveAndUpload}
                    </button>
                    <button
                      disabled={
                        !!busyId ||
                        !(
                          ['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(
                            item.status,
                          ) || backendStatus === 'AVAILABLE'
                        )
                      }
                      onClick={() => void discard(item)}
                    >
                      {backendStatus === 'AVAILABLE'
                        ? t.removeLocalCopy
                        : t.discard}
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

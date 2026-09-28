import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { customerApi } from '../api/customerApi'
import type { MediaAsset } from '../types/orders'
import { customerHref } from '../routes'
import { mediaLibraryPageMessages } from './MediaLibraryPage.messages'

function fmtBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} KB`
  return `${n} B`
}

export function MediaLibraryPage() {
  const { t, locale } = useI18n(mediaLibraryPageMessages)
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null,
  )
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getMediaLibrary({ signal }),
    [],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const visibleAssets: MediaAsset[] = data.assets.filter((a) => {
    if (selectedMissionId && a.missionId !== selectedMissionId) return false
    if (typeFilter !== 'ALL' && a.mediaType !== typeFilter) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(visibleAssets.map((a) => a.id)))
  }

  function clearSelect() {
    setSelected(new Set())
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* Sidebar — mission selector */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--sf)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          padding: '12px 0',
        }}
      >
        <div
          style={{
            padding: '0 14px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--tx3)',
          }}
        >
          {t.missionsHeading}
        </div>
        <button
          type="button"
          onClick={() => setSelectedMissionId(null)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '8px 14px',
            background:
              selectedMissionId === null
                ? 'var(--blue-muted, #eff6ff)'
                : 'none',
            border: 'none',
            borderLeft:
              selectedMissionId === null
                ? '3px solid var(--blue-solid)'
                : '3px solid transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--tx)',
          }}
        >
          {t.all}
          <span style={{ float: 'right', fontSize: 11, color: 'var(--tx3)' }}>
            {data.assets.length}
          </span>
        </button>
        {data.missions.map((m) => (
          <button
            key={m.missionId}
            type="button"
            onClick={() => setSelectedMissionId(m.missionId)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 14px',
              background:
                selectedMissionId === m.missionId
                  ? 'var(--blue-muted, #eff6ff)'
                  : 'none',
              border: 'none',
              borderLeft:
                selectedMissionId === m.missionId
                  ? '3px solid var(--blue-solid)'
                  : '3px solid transparent',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--tx)',
            }}
          >
            <div style={{ fontWeight: 600 }}>{m.missionCode}</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
              {m.orderCode}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--tx3)',
                float: 'right',
                marginTop: -22,
              }}
            >
              {m.photoCount + m.videoCount}
            </div>
          </button>
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {t.title}
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['ALL', 'PHOTO', 'VIDEO'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                className={`odm-btn ${typeFilter === filterKey ? 'odm-btn-p' : 'odm-btn-gh'}`}
                style={{ fontSize: 12 }}
                onClick={() => setTypeFilter(filterKey)}
              >
                {t.typeFilter[filterKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-select toolbar */}
        {selected.size > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--blue-muted, #eff6ff)',
              border: '1px solid var(--blue-solid)',
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            <span>{t.selectedCount(selected.size)}</span>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              style={{ fontSize: 12, padding: '3px 10px' }}
              onClick={() => alert(t.downloadMock(selected.size))}
            >
              {t.download}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{ fontSize: 12, padding: '3px 10px' }}
              onClick={clearSelect}
            >
              {t.clearSelection}
            </button>
          </div>
        )}

        {visibleAssets.length === 0 ? (
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                marginBottom: 10,
                fontSize: 12,
                color: 'var(--tx3)',
              }}
            >
              <span>{t.fileCount(visibleAssets.length)}</span>
              <button
                type="button"
                style={{
                  fontSize: 12,
                  color: 'var(--blue-solid)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={selectAll}
              >
                {t.selectAll}
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
              }}
            >
              {visibleAssets.map((asset) => {
                const isSelected = selected.has(asset.id)
                return (
                  <div
                    key={asset.id}
                    style={{
                      background: 'var(--sf)',
                      border: isSelected
                        ? '2px solid var(--blue-solid)'
                        : '1px solid var(--bd)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => toggleSelect(asset.id)}
                  >
                    {/* Thumbnail placeholder */}
                    <div
                      style={{
                        height: 90,
                        background: 'var(--bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        position: 'relative',
                      }}
                    >
                      {asset.mediaType === 'VIDEO' ? '🎬' : '📷'}
                      {asset.isNew && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: 'var(--blue-solid)',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                          }}
                        >
                          {t.newBadge}
                        </span>
                      )}
                      {isSelected && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: 'var(--blue-solid)',
                            color: '#fff',
                            fontSize: 12,
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '6px 8px' }}>
                      <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                        {fmtBytes(asset.fileSizeBytes)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--tx3)',
                          marginTop: 2,
                        }}
                      >
                        {new Date(asset.capturedAt).toLocaleDateString(locale)}
                      </div>
                    </div>
                    {/* Detail link */}
                    <a
                      href={customerHref({
                        screen: 'mediaDetail',
                        mediaId: asset.id,
                      })}
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        fontSize: 10,
                        color: 'var(--blue-solid)',
                        textDecoration: 'none',
                        background: 'var(--sf)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        border: '1px solid var(--bd)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.detail}
                    </a>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

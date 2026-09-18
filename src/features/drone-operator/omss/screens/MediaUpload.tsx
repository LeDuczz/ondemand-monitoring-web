import { useState, useEffect } from 'react'
import type { Mission } from '../types'

interface Props {
  mission: Mission
  onDone: () => void
  onManual: () => void
}
interface FileItem {
  id: string
  name: string
  type: 'photo' | 'video' | 'log'
  sizeMB: number
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  retries: number
}

function buildFiles(): FileItem[] {
  const f: FileItem[] = []
  for (let i = 1; i <= 14; i++)
    f.push({
      id: `v${i}`,
      name: `VID_${3000 + i}.MP4`,
      type: 'video',
      sizeMB: 180 + i * 12,
      progress: 0,
      status: 'pending',
      retries: 0,
    })
  for (let i = 1; i <= 48; i++)
    f.push({
      id: `p${i}`,
      name: `DJI_${4000 + i}.JPG`,
      type: 'photo',
      sizeMB: 7 + (i % 5),
      progress: 0,
      status: 'pending',
      retries: 0,
    })
  f.push({
    id: 'log1',
    name: 'flight_telemetry.bin',
    type: 'log',
    sizeMB: 3.2,
    progress: 0,
    status: 'pending',
    retries: 0,
  })
  return f
}
function fmt(mb: number) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
}

export default function MediaUpload({ mission, onDone, onManual }: Props) {
  const [files, setFiles] = useState<FileItem[]>(buildFiles)
  const [paused, setPaused] = useState(false)

  const done = files.filter((f) => f.status === 'done').length
  const errors = files.filter((f) => f.status === 'error').length
  const totalMB = files.reduce((s, f) => s + f.sizeMB, 0)
  const uploadedMB = files.reduce(
    (s, f) => s + (f.sizeMB * f.progress) / 100,
    0,
  )
  const pct = Math.round((uploadedMB / totalMB) * 100)
  const allDone = done === files.length

  useEffect(() => {
    if (paused || allDone) return
    const pending = files.find((f) => f.status === 'pending')
    const uploading = files.find((f) => f.status === 'uploading')
    if (!uploading && pending)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === pending.id ? { ...f, status: 'uploading' } : f,
        ),
      )
  }, [files, paused, allDone])

  useEffect(() => {
    if (paused) return
    const uploading = files.find((f) => f.status === 'uploading')
    if (!uploading) return
    const id = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== 'uploading') return f
          const next = Math.min(
            100,
            f.progress + 3 + (f.id.startsWith('v') ? 1 : 2),
          )
          if (next >= 100) {
            const fail = f.retries === 0 && (f.id === 'v5' || f.id === 'p12')
            return {
              ...f,
              progress: fail ? 0 : 100,
              status: fail ? 'error' : 'done',
              retries: f.retries + 1,
            }
          }
          return { ...f, progress: next }
        }),
      )
    }, 200)
    return () => clearInterval(id)
  }, [files, paused])

  function retry(fid: string) {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fid ? { ...f, status: 'pending', progress: 0 } : f,
      ),
    )
  }

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 760 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 6px',
              }}
            >
              Media upload
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
              {mission.id} · {files.length} files · {fmt(totalMB)} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPaused((p) => !p)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-2)',
                background: 'var(--surface)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onManual}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-2)',
                background: 'var(--surface)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-2)',
                cursor: 'pointer',
              }}
            >
              USB fallback
            </button>
          </div>
        </div>

        {/* Progress */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            marginBottom: 16,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}
            >
              Upload progress
            </span>
            <span
              style={{
                fontSize: 14,
                fontFamily: 'var(--font-data)',
                color: allDone ? 'var(--green)' : 'var(--text-2)',
              }}
            >
              {fmt(uploadedMB)} / {fmt(totalMB)}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--border)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: allDone ? 'var(--green)' : 'var(--accent)',
                borderRadius: 3,
                transition: 'width .3s',
              }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 16,
            }}
          >
            {[
              { l: 'Completed', v: done, c: 'var(--green-text)' },
              {
                l: 'Uploading',
                v: files.filter((f) => f.status === 'uploading').length,
                c: 'var(--accent)',
              },
              {
                l: 'Pending',
                v: files.filter((f) => f.status === 'pending').length,
                c: 'var(--text-2)',
              },
              {
                l: 'Failed',
                v: errors,
                c: errors > 0 ? 'var(--red)' : 'var(--text-3)',
              },
            ].map((t) => (
              <div key={t.l}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-3)',
                    marginBottom: 3,
                  }}
                >
                  {t.l}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontFamily: 'var(--font-data)',
                    fontWeight: 700,
                    color: t.c,
                  }}
                >
                  {t.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {errors > 0 && (
          <div
            style={{
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              borderRadius: 8,
              padding: '10px 16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--red-text)' }}>
              {errors} file{errors > 1 ? 's' : ''} failed — check connectivity
              and retry.
            </span>
            <button
              onClick={() =>
                files
                  .filter((f) => f.status === 'error')
                  .forEach((f) => retry(f.id))
              }
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid var(--red-border)',
                background: 'transparent',
                color: 'var(--red-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry all
            </button>
          </div>
        )}

        {/* File list */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 60px 70px 80px',
              gap: 12,
              padding: '10px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-2)',
            }}
          >
            {['', 'File name', 'Type', 'Size', 'Status'].map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {files.map((f, i) => (
              <div
                key={f.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr 60px 70px 80px',
                  gap: 12,
                  padding: '10px 20px',
                  borderBottom:
                    i < files.length - 1 ? '1px solid var(--border)' : 'none',
                  background:
                    f.status === 'uploading'
                      ? 'var(--accent-bg)'
                      : 'transparent',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color:
                      f.status === 'done'
                        ? 'var(--green)'
                        : f.status === 'error'
                          ? 'var(--red)'
                          : f.status === 'uploading'
                            ? 'var(--accent)'
                            : 'var(--text-3)',
                  }}
                >
                  {f.status === 'done'
                    ? '✓'
                    : f.status === 'error'
                      ? '✕'
                      : f.status === 'uploading'
                        ? '↑'
                        : '—'}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontFamily: 'var(--font-data)',
                      color:
                        f.status === 'done'
                          ? 'var(--text-3)'
                          : f.status === 'error'
                            ? 'var(--red-text)'
                            : 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 280,
                    }}
                  >
                    {f.name}
                  </div>
                  {f.status === 'uploading' && (
                    <div
                      style={{
                        marginTop: 3,
                        height: 2,
                        background: 'var(--border)',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${f.progress}%`,
                          height: '100%',
                          background: 'var(--accent)',
                          transition: 'width .2s',
                        }}
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {f.type}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-data)',
                    color: 'var(--text-2)',
                  }}
                >
                  {fmt(f.sizeMB)}
                </div>
                <div>
                  {f.status === 'error' ? (
                    <button
                      onClick={() => retry(f.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--red-border)',
                        background: 'transparent',
                        color: 'var(--red-text)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-data)',
                        color:
                          f.status === 'done'
                            ? 'var(--green)'
                            : f.status === 'uploading'
                              ? 'var(--accent)'
                              : 'var(--text-3)',
                      }}
                    >
                      {f.status === 'uploading'
                        ? `${Math.round(f.progress)}%`
                        : f.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {allDone && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                background: 'var(--green-bg)',
                border: '1px solid var(--green-border)',
                borderRadius: 8,
                padding: '14px',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--green-text)',
                }}
              >
                All media uploaded successfully
              </div>
            </div>
            <button
              onClick={onDone}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Finalise and return to missions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

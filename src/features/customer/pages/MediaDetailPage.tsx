import { ErrorState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerApi } from '../api/customerApi'
import { fmtDateTime } from '../lib/orderStatus'
import { customerHref } from '../routes'

function fmtBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} KB`
  return `${n} B`
}

export function MediaDetailPage({ mediaId }: { mediaId: string }) {
  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getMediaDetail(mediaId, signal),
    [mediaId],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const { asset, downloadUrl, urlExpiredAt, prevMediaId, nextMediaId } = data
  const urlExpired = urlExpiredAt ? new Date(urlExpiredAt) < new Date() : false

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={customerHref({ screen: 'mediaLibrary' })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          ← Thư viện kết quả
        </a>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Viewer */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {/* Preview placeholder */}
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--bd)',
              borderRadius: 10,
              minHeight: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              marginBottom: 12,
              position: 'relative',
            }}
          >
            {urlExpired ? (
              <div style={{ textAlign: 'center', fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                <div style={{ fontWeight: 600 }}>URL đã hết hạn</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>
                  Liên hệ hỗ trợ để cấp lại đường dẫn.
                </div>
              </div>
            ) : asset.mediaType === 'VIDEO' ? (
              <div style={{ textAlign: 'center' }}>
                <div>🎬</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Video preview</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                  {asset.durationSec ? `${asset.durationSec}s` : ''}{' '}
                  {asset.widthPx && asset.heightPx ? `${asset.widthPx}×${asset.heightPx}` : ''}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div>📷</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Photo preview</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                  {asset.widthPx && asset.heightPx ? `${asset.widthPx}×${asset.heightPx} px` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {prevMediaId ? (
              <a
                href={customerHref({ screen: 'mediaDetail', mediaId: prevMediaId })}
                className="odm-btn odm-btn-gh"
              >
                ← Trước
              </a>
            ) : (
              <button type="button" className="odm-btn odm-btn-gh" disabled>
                ← Trước
              </button>
            )}
            {nextMediaId ? (
              <a
                href={customerHref({ screen: 'mediaDetail', mediaId: nextMediaId })}
                className="odm-btn odm-btn-gh"
              >
                Sau →
              </a>
            ) : (
              <button type="button" className="odm-btn odm-btn-gh" disabled>
                Sau →
              </button>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div
          style={{
            width: 240,
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '16px',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Thông tin file</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Loại</div>
              <div>{asset.mediaType === 'PHOTO' ? 'Ảnh' : 'Video'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Kích thước</div>
              <div>{fmtBytes(asset.fileSizeBytes)}</div>
            </div>
            {asset.widthPx && asset.heightPx && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Độ phân giải</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>
                  {asset.widthPx} × {asset.heightPx}
                </div>
              </div>
            )}
            {asset.durationSec && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Thời lượng</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{asset.durationSec}s</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Chụp lúc</div>
              <div style={{ fontSize: 12 }}>{fmtDateTime(asset.capturedAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Lần bay</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{asset.missionCode}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>Đơn hàng</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{asset.orderCode}</div>
            </div>
          </div>

          {/* Download */}
          <div style={{ marginTop: 16 }}>
            {urlExpired ? (
              <div style={{ fontSize: 12, color: 'var(--red-solid)' }}>
                🔒 URL hết hạn lúc {urlExpiredAt ? fmtDateTime(urlExpiredAt) : ''}
              </div>
            ) : downloadUrl ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="odm-btn odm-btn-p"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Tải xuống
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

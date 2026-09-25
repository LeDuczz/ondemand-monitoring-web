import { operatorHref } from '../routes'

export function RevokedBanner({ onReconfirm }: { onReconfirm: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--red-bg)',
          color: 'var(--red-fg)',
          border: '1px solid var(--red-dot)',
        }}
      >
        <div>
          <span style={{ fontWeight: 700 }}>
            Quyền điều khiển đã bị thu hồi.
          </span>{' '}
          Quản lý đã thu hồi bàn giao lúc 13:29 (control_handover.status =
          REVOKED). Bạn phải xác nhận lại trước khi tiếp tục.
        </div>
      </div>
      <div className="odm-card">
        <div
          className="odm-card-body"
          style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Trạng thái bàn giao
            </div>
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              Không được phép cất cánh khi chưa xác nhận lại.
            </div>
          </div>
          <span className="odm-badge odm-badge-red odm-badge-lg">
            <span className="odm-badge-dot" aria-hidden="true" />
            Đã thu hồi
          </span>
        </div>
      </div>
      <button type="button" className="odm-btn odm-btn-p" onClick={onReconfirm}>
        Xác nhận lại
      </button>
    </div>
  )
}

export function ConfirmedBanner({ missionId, onRevoke }: { missionId?: string; onRevoke: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--green-bg)',
          color: 'var(--green-fg)',
          border: '1px solid var(--green-dot)',
        }}
      >
        <span>
          Bạn đã xác nhận bàn giao quyền điều khiển · control_handover.status =
          CONFIRMED
        </span>
        <a
          className="odm-btn odm-btn-sm"
          href={operatorHref({ screen: 'flight', missionId })}
        >
          Tiếp tục tới buồng lái
        </a>
      </div>
      {/* Demo-only affordance to exercise the REVOKED state without a real dispatcher action. */}
      <button
        type="button"
        className="odm-btn"
        style={{ alignSelf: 'flex-start', fontSize: 11.5, color: 'var(--tx3)' }}
        onClick={onRevoke}
      >
        (Demo) Giả lập quản lý thu hồi quyền
      </button>
    </div>
  )
}

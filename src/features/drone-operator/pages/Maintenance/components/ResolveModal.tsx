import { formatTicketDescription } from '../../../../manager/lib/ticketText'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import { maintenanceDeviceLabel } from '../maintenanceHelpers'
import { resolveModalMessages } from './ResolveModal.messages'

export function ResolveModal({
  ticket: selectedTicket,
  notes,
  onNotesChange,
  targetDroneStatus,
  onTargetDroneStatusChange,
  error,
  saving,
  onClose,
  onSubmit,
}: {
  ticket: MaintenanceTicketDto
  notes: string
  onNotesChange: (value: string) => void
  targetDroneStatus: string
  onTargetDroneStatusChange: (value: string) => void
  error: string | null
  saving: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const { t } = useI18n(resolveModalMessages)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => onClose()}
    >
      <div
        className="odm-card"
        style={{
          padding: 24,
          width: 500,
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {t.modalTitle}
          </h3>
          <button
            type="button"
            className="odm-btn"
            onClick={() => onClose()}
            style={{ padding: '2px 8px', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            background: '#f8fafc',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid #e2e8f0',
            fontSize: 13,
          }}
        >
          <div>
            {t.modalTicketPrefix}{' '}
            <b className="odm-mono">{selectedTicket.ticketCode}</b> ·{' '}
            {t.modalDronePrefix} <b>{maintenanceDeviceLabel(selectedTicket)}</b>
          </div>
          <div
            style={{ color: '#64748b', marginTop: 2, whiteSpace: 'pre-line' }}
          >
            {formatTicketDescription(selectedTicket.description ?? '')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 6,
              }}
            >
              {t.notesLabel}
            </label>
            <textarea
              className="odm-input"
              rows={4}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={t.notesPlaceholder}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 8,
                padding: 10,
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 6,
              }}
            >
              {t.droneStatusLabel}
            </label>
            <select
              className="odm-input"
              value={targetDroneStatus}
              onChange={(e) => onTargetDroneStatusChange(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <option value="AVAILABLE">
                {t.droneStatusOptions.AVAILABLE}
              </option>
              <option value="IDLE_CHARGING">
                {t.droneStatusOptions.IDLE_CHARGING}
              </option>
              <option value="MAINTENANCE">
                {t.droneStatusOptions.MAINTENANCE}
              </option>
            </select>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="odm-btn"
              onClick={() => onClose()}
              disabled={saving}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onSubmit}
              disabled={saving}
              style={{
                fontWeight: 600,
                height: 38,
                padding: '0 18px',
                borderRadius: 8,
              }}
            >
              {saving ? t.processing : t.confirmRestore}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

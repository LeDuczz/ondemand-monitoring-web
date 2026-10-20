import { useEffect, useState } from 'react'
import { missionsApi } from '../../api/missionsApi'
import type { FlightPermitStatus, MissionResponse } from '../../types/missions'

const labels: Record<FlightPermitStatus, string> = {
  NOT_REQUESTED: 'Chưa xin phép',
  PENDING: 'Đang chờ cấp phép',
  APPROVED: 'Đã được cấp phép',
  REJECTED: 'Bị từ chối',
}

export function FlightPermitCard({
  mission,
  onChanged,
}: {
  mission: MissionResponse
  onChanged: () => void
}) {
  const status = mission.flightPermitStatus ?? 'NOT_REQUESTED'
  const [note, setNote] = useState(mission.flightPermitNote ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(
    () => setNote(mission.flightPermitNote ?? ''),
    [mission.flightPermitNote],
  )

  async function save(nextStatus: FlightPermitStatus) {
    setError('')
    if (file && file.size > 5 * 1024 * 1024) {
      setError('File giấy phép không được vượt quá 5 MB.')
      return
    }
    setBusy(true)
    try {
      await missionsApi.updateFlightPermit(mission.id, {
        status: nextStatus,
        note: note.trim() || null,
        fileName: file?.name ?? null,
        contentType: file?.type ?? null,
        dataUrl: file ? await readFile(file) : null,
      })
      setFile(null)
      onChanged()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể cập nhật giấy phép bay.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="odm-or-card"
      aria-label={`Giấy phép bay ${mission.missionCode}`}
    >
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          Giấy phép bay · {mission.missionCode}
        </span>
        <span
          className={`odm-or-pill ${status === 'APPROVED' ? 'odm-or-pill-green' : 'odm-or-pill-amber'}`}
        >
          {labels[status]}
        </span>
      </header>
      <div className="odm-or-card-body" style={{ display: 'grid', gap: 12 }}>
        <p className="odm-or-muted" style={{ margin: 0 }}>
          Mission chỉ được bắt đầu sau khi giấy phép được xác nhận là đã cấp.
        </p>
        <label>
          <strong style={{ display: 'block', marginBottom: 6 }}>Ghi chú</strong>
          <textarea
            value={note}
            maxLength={1000}
            rows={3}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ví dụ: Đã gửi thông tin xin phép"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </label>
        <div>
          <strong style={{ display: 'block', marginBottom: 6 }}>
            File giấy phép (không bắt buộc)
          </strong>
          <input
            id={`flight-permit-file-${mission.id}`}
            type="file"
            accept="application/pdf,image/*"
            disabled={busy}
            aria-label="Chọn tệp giấy phép"
            style={{ display: 'none' }}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label
              className="odm-or-btn-outline"
              htmlFor={`flight-permit-file-${mission.id}`}
              aria-disabled={busy}
            >
              Chọn tệp
            </label>
            <span className="odm-or-muted">
              {file?.name ?? 'Chưa chọn tệp'}
            </span>
          </div>
        </div>
        {mission.flightPermitFileName ? (
          <div>
            File hiện tại:{' '}
            {mission.flightPermitDataUrl ? (
              <a
                href={mission.flightPermitDataUrl}
                download={mission.flightPermitFileName}
              >
                {mission.flightPermitFileName}
              </a>
            ) : (
              mission.flightPermitFileName
            )}
          </div>
        ) : (
          <div className="odm-or-muted">File giấy phép: Chưa có</div>
        )}
        {error ? (
          <p
            role="alert"
            style={{ color: 'var(--red-solid, #dc2626)', margin: 0 }}
          >
            {error}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {status === 'NOT_REQUESTED' ? (
            <button
              className="odm-or-btn odm-or-btn-blue"
              disabled={busy}
              onClick={() => save('PENDING')}
            >
              Bắt đầu chờ giấy phép
            </button>
          ) : null}
          {status !== 'APPROVED' ? (
            <button
              className="odm-or-btn odm-or-btn-blue"
              disabled={busy}
              onClick={() => save('APPROVED')}
            >
              Xác nhận đã được cấp phép
            </button>
          ) : (
            <button
              className="odm-or-btn-outline"
              disabled={busy}
              onClick={() => save('APPROVED')}
            >
              Lưu thông tin giấy phép
            </button>
          )}
          {status !== 'REJECTED' && status !== 'APPROVED' ? (
            <button
              className="odm-or-btn-outline"
              disabled={busy}
              onClick={() => save('REJECTED')}
            >
              Ghi nhận bị từ chối
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Không thể đọc file giấy phép.'))
    reader.readAsDataURL(file)
  })
}

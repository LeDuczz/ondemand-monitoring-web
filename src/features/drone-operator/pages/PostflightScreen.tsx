import { useState } from 'react'

import { operatorApi } from '../api/operatorApi'
import { postflightSummary } from '../lib/postflightSummary'
import { operatorHref } from '../routes'
import type {
  FaultType,
  MaintenanceSeverity,
  PostflightItem,
  PostflightItemKey,
  PreflightItemResult,
} from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { MaintenanceTicketDialog } from './MaintenanceTicketDialog'

const MISSION_ID = 'MSN-2609-0142-1'
const DRONE_CODE = 'DRN-02'

const ITEMS: { key: PostflightItemKey; label: string; detail: string }[] = [
  { key: 'battery_ok', label: 'Pin', detail: 'còn 34%' },
  { key: 'motor_ok', label: 'Động cơ', detail: '' },
  { key: 'camera_ok', label: 'Camera', detail: '' },
  { key: 'gps_ok', label: 'GPS', detail: '' },
  { key: 'communication_ok', label: 'Liên lạc', detail: '' },
  {
    key: 'physical_condition_ok',
    label: 'Tình trạng vật lý',
    detail: 'cánh quạt, khung, gimbal',
  },
]

type ResultsState = Partial<Record<PostflightItemKey, PreflightItemResult>>

/** OPR-09W — Postflight check: 6 mục Đạt/Không đạt + ticket bảo trì + hoàn tất mission. */
export function PostflightScreen() {
  const [results, setResults] = useState<ResultsState>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const [completed, setCompleted] = useState<{ overallOk: boolean } | null>(null)

  const items: PostflightItem[] = ITEMS.filter((d) => results[d.key]).map(
    (d) => ({ key: d.key, result: results[d.key] as PreflightItemResult }),
  )
  const summary = postflightSummary(items, ITEMS.length)
  const failItems = ITEMS.filter((d) => results[d.key] === 'fail')

  function handleSetResult(key: PostflightItemKey, result: PreflightItemResult) {
    setResults((r) => ({ ...r, [key]: result }))
  }

  async function handleComplete() {
    setSaving(true)
    try {
      const record = await operatorApi.savePostflight(MISSION_ID, {
        items,
        notes,
      })
      setCompleted({ overallOk: record.overallOk })
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTicket(
    issueType: FaultType,
    severity: MaintenanceSeverity,
    description: string,
  ) {
    setTicketSubmitting(true)
    try {
      await operatorApi.createMaintenanceTicket(MISSION_ID, {
        issueType,
        severity,
        description,
      })
      setTicketCreated(true)
      setShowTicketDialog(false)
    } finally {
      setTicketSubmitting(false)
    }
  }

  if (completed) {
    return (
      <div className="odm-card" style={{ marginBottom: 0 }}>
        <FlightStepHeader title="Postflight check" missionId={MISSION_ID} active={7} />
        <div style={{ padding: '18px 22px', maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'var(--green-bg)',
              border: '1.5px solid var(--green-dot)',
              color: 'var(--green-fg)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>Mission đã hoàn tất</div>
            <div className="odm-mono" style={{ fontSize: 12, marginTop: 4 }}>
              {MISSION_ID}
            </div>
            <dl style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row label="mission.status" value="Hoàn thành" />
              <Row
                label="postflight_check"
                value={`Đã lưu · overall_ok = ${completed.overallOk}`}
              />
              <Row label={`drone.status (${DRONE_CODE})`} value="Sẵn sàng" />
              <Row label="Media" value="20 tệp đang chờ xác thực" />
            </dl>
            <a
              className="odm-btn odm-btn-ok"
              href={operatorHref({ screen: 'missions' })}
              style={{ marginTop: 16, minWidth: 200, display: 'inline-flex' }}
            >
              Về danh sách mission
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Postflight check"
        missionId={MISSION_ID}
        active={7}
        right={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 32,
              padding: '0 12px',
              borderRadius: 16,
              background: 'var(--sf3)',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
            }}
          >
            {DRONE_CODE} Hải Âu
          </span>
        }
      />
      <div style={{ padding: '18px 22px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            className="odm-mono"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)' }}
          >
            {summary.nOk}/{summary.nTotal} mục đạt
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ITEMS.map((def) => {
              const result = results[def.key] ?? null
              const failed = result === 'fail'
              return (
                <div
                  key={def.key}
                  style={{
                    background: failed ? 'var(--red-bg)' : 'var(--sf)',
                    border: `1.5px solid ${failed ? 'var(--red-dot)' : 'var(--bd)'}`,
                    borderRadius: 12,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{def.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
                      {def.detail ? `${def.detail} · ` : ''}
                      <span className="odm-mono">{def.key}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="odm-btn"
                    onClick={() => handleSetResult(def.key, 'ok')}
                    style={{
                      minWidth: 78,
                      background: result === 'ok' ? 'var(--green-solid)' : undefined,
                      color: result === 'ok' ? 'var(--green-on)' : undefined,
                      borderColor: result === 'ok' ? 'var(--green-solid)' : undefined,
                    }}
                  >
                    Đạt
                  </button>
                  <button
                    type="button"
                    className="odm-btn"
                    onClick={() => handleSetResult(def.key, 'fail')}
                    style={{
                      minWidth: 96,
                      background: failed ? 'var(--red-solid)' : undefined,
                      color: failed ? 'var(--red-on)' : undefined,
                      borderColor: failed ? 'var(--red-solid)' : undefined,
                    }}
                  >
                    Không đạt
                  </button>
                </div>
              )
            })}
          </div>

          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12.5, color: 'var(--tx3)', display: 'block', marginBottom: 6 }}>
              notes
            </span>
            <textarea
              className="odm-input"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm (tuỳ chọn)"
            />
          </label>

          {failItems.length > 0 ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--yellow-bg)',
                color: 'var(--yellow-fg)',
                border: '1.5px solid var(--yellow-dot)',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                Có mục không đạt: {failItems.map((f) => f.label).join(', ')}
              </div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                Nên tạo ticket bảo trì để quản lý xử lý trước khi drone nhận mission
                mới. Thông tin được điền sẵn.
              </div>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                style={{ marginTop: 10 }}
                onClick={() => setShowTicketDialog(true)}
                disabled={ticketCreated}
              >
                {ticketCreated ? 'Đã tạo ticket' : 'Tạo ticket bảo trì'}
              </button>
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="odm-btn odm-btn-ok"
              style={{ minWidth: 200 }}
              disabled={saving}
              onClick={handleComplete}
            >
              {saving ? 'Đang lưu...' : 'Hoàn tất mission'}
            </button>
          </div>
        </div>
      </div>

      {showTicketDialog ? (
        <MaintenanceTicketDialog
          droneCode={DRONE_CODE}
          missionId={MISSION_ID}
          defaultIssueType="OTHER"
          defaultDescription={`Không đạt: ${failItems.map((f) => f.label).join(', ')}`}
          submitting={ticketSubmitting}
          onCancel={() => setShowTicketDialog(false)}
          onConfirm={handleCreateTicket}
        />
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
      <span className="odm-mono" style={{ color: 'var(--tx3)' }}>
        {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

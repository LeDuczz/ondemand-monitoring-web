import { useState } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionApi } from '../../mission/api/missionApi'
import { droneApi } from '../../staff/api/droneApi'
import { operatorApi } from '../../staff/api/operatorApi'
import { managerHref } from '../routes'

/** Real resource assignment in the existing manager shell; no invented ranking data. */
export function LiveDispatchPage({ missionId }: { missionId: string }) {
  const mission = useApiQuery(() => missionApi.getMissionById(missionId), [missionId])
  const drones = useApiQuery(() => droneApi.getAvailable(), [missionId])
  const operators = useApiQuery(() => operatorApi.getAvailable(), [missionId])
  const [droneId, setDroneId] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function assign() {
    if (!droneId || !operatorId) { setError('Chọn drone và operator trước khi phân công.'); return }
    setBusy(true)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneId, operatorId)
      mission.reload()
      drones.reload()
      operators.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không phân công được nguồn lực')
    } finally {
      setBusy(false)
    }
  }

  if (mission.loading || drones.loading || operators.loading) {
    return <div className="odm-mgr-dash">Đang tải nguồn lực khả dụng…</div>
  }
  if (mission.error || drones.error || operators.error || !mission.data) {
    return <StateView state="error" title="Không tải được dữ liệu phân công"
      error={mission.error ?? drones.error ?? operators.error}
      onRetry={() => { mission.reload(); drones.reload(); operators.reload() }} />
  }

  const current = mission.data
  const assignable = current.status === 'RESOURCE_ASSIGNING' || current.status === 'CREATED'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">Phân công nguồn lực</h1>
          <div className="odm-mgr-dash-date">Mission {current.missionCode} · {current.orderTitle ?? current.orderId}</div>
        </div>
        <a className="odm-btn" href={managerHref({ screen: 'orderQueue' })}>Về hàng đợi</a>
      </div>
      <div className="odm-card" style={{ marginBottom: 14 }}>
        <div className="odm-card-header">Mission {current.missionCode}</div>
        <div className="odm-card-body odm-mgr-review-location-grid">
          <div><div className="odm-mgr-review-hint">Khách hàng</div>{current.customerName ?? '—'}</div>
          <div><div className="odm-mgr-review-hint">Địa điểm</div>{current.address ?? '—'}</div>
          <div><div className="odm-mgr-review-hint">Trạng thái</div>{current.status}</div>
        </div>
      </div>
      {!assignable ? (
        <div className="odm-card"><div className="odm-card-body">
          Mission đã được gán: drone {current.droneCode ?? '—'}, operator {current.operatorId ?? '—'}.
        </div></div>
      ) : (
        <>
          <div className="odm-card" style={{ marginBottom: 14 }}>
            <div className="odm-card-header">Bước 1 — Chọn drone AVAILABLE</div>
            <div className="odm-card-body">
              <select className="odm-inp" aria-label="Chọn drone" value={droneId} onChange={(event) => setDroneId(event.target.value)}>
                <option value="">Chọn drone</option>
                {(drones.data ?? []).map((drone) => <option key={drone.id} value={drone.id}>{drone.label}</option>)}
              </select>
              {!drones.data?.length && <p>Không có drone AVAILABLE.</p>}
            </div>
          </div>
          <div className="odm-card" style={{ marginBottom: 14 }}>
            <div className="odm-card-header">Bước 2 — Chọn operator khả dụng</div>
            <div className="odm-card-body">
              <select className="odm-inp" aria-label="Chọn operator" value={operatorId} onChange={(event) => setOperatorId(event.target.value)}>
                <option value="">Chọn operator</option>
                {(operators.data ?? []).map((operator) => <option key={operator.id} value={operator.id}>{operator.fullName} ({operator.email})</option>)}
              </select>
              {!operators.data?.length && <p>Không có operator khả dụng.</p>}
            </div>
          </div>
          {error && <div role="alert" className="odm-mgr-modal-error">{error}</div>}
          <div className="odm-mgr-dispatch-bottombar">
            <span style={{ flex: 1 }}>Backend sẽ kiểm tra pin, đường bay và tính khả thi khi gán.</span>
            <button type="button" className="odm-btn odm-btn-ok" disabled={busy || !droneId || !operatorId} onClick={() => void assign()}>
              {busy ? 'Đang phân công…' : 'Phân công'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

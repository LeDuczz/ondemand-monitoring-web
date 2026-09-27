import { useState } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerMissionHistoryApi } from '../api/customerMissionHistoryApi'
import { customerHref } from '../routes'

export const HISTORY_STATUS_LABEL = {
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
}
export function historyDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

export function MissionHistoryPage() {
  const [page, setPage] = useState(0)
  const query = useApiQuery(
    (signal) => customerMissionHistoryApi.list(page, signal),
    [page],
  )
  return (
    <section>
      <h2>Lịch sử mission</h2>
      <p>Các phiên mission đã kết thúc thuộc đơn của bạn.</p>
      <button
        className="odm-btn"
        type="button"
        disabled={query.loading}
        onClick={query.reload}
      >
        Làm mới
      </button>
      {query.loading ? <p role="status">Đang tải lịch sử...</p> : null}
      {query.error ? (
        <p role="alert">
          Không tải được lịch sử mission.{' '}
          <button className="odm-btn" type="button" onClick={query.reload}>
            Thử lại
          </button>
        </p>
      ) : null}
      {!query.loading && !query.error && query.data ? (
        <div
          className="odm-card"
          style={{ marginTop: 16, padding: 16, overflowX: 'auto' }}
        >
          {query.data.items.length === 0 ? (
            <p>Chưa có mission nào trong lịch sử.</p>
          ) : (
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Đơn hàng</th>
                  <th>Trạng thái</th>
                  <th>Hoàn thành</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((mission) => (
                  <tr key={mission.id}>
                    <td>{mission.missionCode}</td>
                    <td>{mission.orderTitle}</td>
                    <td>{HISTORY_STATUS_LABEL[mission.status]}</td>
                    <td>{historyDate(mission.completedAt)}</td>
                    <td>
                      <a
                        className="odm-btn odm-btn-sm"
                        href={customerHref({
                          screen: 'missionHistoryDetail',
                          missionId: mission.id,
                        })}
                      >
                        Xem chi tiết và media
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 16,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className="odm-btn"
              disabled={query.data.first}
              onClick={() => setPage((value) => value - 1)}
            >
              Trang trước
            </button>
            <span>
              {query.data.totalItems} mission · Trang{' '}
              {query.data.totalPages ? query.data.page + 1 : 0} /{' '}
              {query.data.totalPages}
            </span>
            <button
              type="button"
              className="odm-btn"
              disabled={query.data.last}
              onClick={() => setPage((value) => value + 1)}
            >
              Trang sau
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

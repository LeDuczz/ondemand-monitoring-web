import { useState } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { MissionUploadedMedia } from '../../media/components/MissionUploadedMedia'
import {
  customerMissionHistoryApi,
  customerMissionMediaApi,
} from '../api/customerMissionHistoryApi'
import { customerHref } from '../routes'
import { HISTORY_STATUS_LABEL, historyDate } from './MissionHistoryPage'

export function MissionHistoryDetailPage({ missionId }: { missionId: string }) {
  return <Detail key={missionId} missionId={missionId} />
}
function Detail({ missionId }: { missionId: string }) {
  const query = useApiQuery(
    (signal) => customerMissionHistoryApi.get(missionId, signal),
    [missionId],
  )
  const [revision, setRevision] = useState(0)
  const progress = useApiQuery(
    (signal) => customerMissionHistoryApi.mediaStatus(missionId, signal),
    [missionId, revision],
  )
  return (
    <section>
      <a className="odm-btn" href={customerHref({ screen: 'missionHistory' })}>
        Về lịch sử mission
      </a>
      {query.loading ? <p role="status">Đang tải mission...</p> : null}
      {query.error ? (
        <p role="alert">
          Không thể xem mission này.{' '}
          <button className="odm-btn" type="button" onClick={query.reload}>
            Thử lại
          </button>
        </p>
      ) : null}
      {!query.loading && !query.error && query.data ? (
        <>
          <div className="odm-card" style={{ padding: 16, marginTop: 16 }}>
            <h2>
              {query.data.missionCode} · {query.data.orderTitle}
            </h2>
            <p>Trạng thái: {HISTORY_STATUS_LABEL[query.data.status]}</p>
            <p>Địa điểm: {query.data.address ?? '—'}</p>
            <p>Bắt đầu: {historyDate(query.data.startedAt)}</p>
            <p>Hoàn thành: {historyDate(query.data.completedAt)}</p>
            <p>{query.data.description}</p>
            <a
              className="odm-btn"
              href={customerHref({
                screen: 'orderDetail',
                orderId: query.data.orderId,
              })}
            >
              Xem đơn hàng
            </a>
          </div>
          <div style={{ marginTop: 16 }}>
            {progress.loading ? (
              <p role="status">Đang kiểm tra trạng thái kết quả...</p>
            ) : null}
            {progress.error ? (
              <p role="alert">Không tải được trạng thái kết quả.</p>
            ) : null}
            {progress.data ? (
              <>
                <p>{progress.data.availableCount} file sẵn sàng.</p>
                {progress.data.processingCount > 0 ? (
                  <p role="status">
                    Kết quả đang được xử lý: {progress.data.processingCount}{' '}
                    file đang chờ upload, thử lại hoặc xác thực.
                  </p>
                ) : null}
                {progress.data.rejectedCount > 0 ? (
                  <p>
                    {progress.data.rejectedCount} file chưa đạt xác thực và
                    không được công bố.
                  </p>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className="odm-btn"
              disabled={progress.loading}
              onClick={() => setRevision((value) => value + 1)}
            >
              Cập nhật trạng thái kết quả
            </button>
          </div>
          <MissionUploadedMedia
            key={revision}
            missionId={query.data.id}
            reader={customerMissionMediaApi}
          />
        </>
      ) : null}
    </section>
  )
}

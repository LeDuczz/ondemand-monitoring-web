import { useI18n } from '../../../../../shared/i18n'
import { MissionStatusBadge } from '../../../components/common/MissionStatusBadge'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { MissionRow } from '../../../lib/missionHistory/types'
import { customerHref } from '../../../routes'
import { missionHistoryTableMessages } from './MissionHistoryTable.messages'

const DASH = '—'

export function MissionHistoryTable({ rows }: { rows: MissionRow[] }) {
  const { t, locale } = useI18n(missionHistoryTableMessages)
  const c = t.columns
  return (
    <table className="mh-table">
      <thead>
        <tr>
          <th className="mh-col-mission">{c.mission}</th>
          <th className="mh-col-order">{c.order}</th>
          <th className="mh-col-status">{c.status}</th>
          <th className="mh-col-finished">{c.finished}</th>
          <th className="mh-col-results">{c.results}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const href = customerHref({ screen: 'missionHistoryDetail', missionId: row.id })
          return (
            <tr key={row.id}>
              <td className="mh-col-mission">
                <a className="mh-code" href={href}>
                  {row.code}
                </a>
              </td>
              <td className="mh-col-order" data-label={c.order}>
                {row.orderTitle}
                {row.address && <div className="mh-muted">{row.address}</div>}
              </td>
              <td className="mh-col-status">
                <MissionStatusBadge status={row.status} />
              </td>
              <td className="mh-nowrap mh-col-finished" data-label={c.finished}>
                {row.completedAt ? fmtDateTime(row.completedAt, locale) : DASH}
              </td>
              <td className="mh-col-results">
                <a className="mh-link" href={href}>
                  {t.view}
                </a>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

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
          <th>{c.mission}</th>
          <th>{c.order}</th>
          <th>{c.status}</th>
          <th>{c.finished}</th>
          <th>{c.results}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const href = customerHref({ screen: 'missionHistoryDetail', missionId: row.id })
          return (
            <tr key={row.id}>
              <td>
                <a className="mh-code" href={href}>
                  {row.code}
                </a>
              </td>
              <td>
                {row.orderTitle}
                {row.address && <div className="mh-muted">{row.address}</div>}
              </td>
              <td>
                <MissionStatusBadge status={row.status} />
              </td>
              <td className="mh-nowrap">
                {row.completedAt ? fmtDateTime(row.completedAt, locale) : DASH}
              </td>
              <td>
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

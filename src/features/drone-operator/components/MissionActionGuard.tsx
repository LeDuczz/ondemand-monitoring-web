import type { ReactNode } from 'react'
import { missionApi } from '../../mission/api/missionApi'
import {
  mayPerformMissionAction,
  type MissionAction,
} from '../../mission/types/permissions'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../shared/i18n'
import { operatorHref } from '../routes'

export function MissionActionGuard({
  missionId,
  action,
  children,
}: {
  missionId?: string
  action: MissionAction
  children: ReactNode
}) {
  const { lang } = useLanguage()
  const query = useApiQuery(
    () =>
      missionId
        ? missionApi.getPermissions(missionId)
        : Promise.reject(new Error('Select a mission first.')),
    [missionId, action],
  )
  if (query.loading)
    return (
      <p role="status">
        {lang === 'vi'
          ? 'Đang kiểm tra quyền nhiệm vụ…'
          : 'Checking mission permissions…'}
      </p>
    )
  if (
    query.error ||
    !query.data ||
    !mayPerformMissionAction(query.data, action)
  ) {
    return (
      <section>
        <p role="alert">
          {(query.error instanceof Error ? query.error.message : undefined) ??
            (lang === 'vi'
              ? 'Bạn chưa được phân công hoặc chưa có quyền thực hiện thao tác này.'
              : 'Your accepted mission assignment does not permit this action.')}
        </p>
        <a
          href={
            missionId
              ? operatorHref({ screen: 'missionDetail', missionId })
              : operatorHref({ screen: 'missions' })
          }
        >
          {lang === 'vi' ? 'Quay lại nhiệm vụ' : 'Back to mission'}
        </a>
        <button type="button" onClick={query.reload}>
          {lang === 'vi' ? 'Kiểm tra lại' : 'Retry'}
        </button>
      </section>
    )
  }
  return children
}

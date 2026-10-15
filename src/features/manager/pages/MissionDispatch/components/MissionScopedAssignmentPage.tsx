import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { missionScopedAssignmentPageMessages } from './MissionScopedAssignmentPage.messages'

/** Mission list entry resolves Order context, but never asks to select the known Mission again. */
export function MissionScopedAssignmentPage({
  missionId,
}: {
  missionId: string
}) {
  const { t } = useI18n(missionScopedAssignmentPageMessages)

  const query = useApiQuery(
    (signal) => missionsApi.getMissionResponse(missionId, signal),
    [missionId],
  )
  const close = () => {
    window.location.hash = managerHref({ screen: 'missions' })
  }
  if (query.loading) return <p role="status">{t.loadingAssignment}</p>
  if (query.error || query.data?.id !== missionId || !query.data.orderId)
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">{t.couldNotLoadTheMission}</p>
        <button className="odm-btn" onClick={query.reload}>
          {t.retry}
        </button>
        <button className="odm-btn" onClick={close}>
          {t.backToMissionList}
        </button>
      </section>
    )
  return (
    <OrderResourceAssignmentWizard
      key={missionId}
      orderId={query.data.orderId}
      initialMissionId={missionId}
      returnLabel={t.backToMissionList}
      onClose={close}
    />
  )
}

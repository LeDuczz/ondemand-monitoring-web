import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { Card } from '../../../../../shared/components/ui'
import '../missionDispatch.css'
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
  if (query.loading)
    return (
      <Card>
        <p className="odm-dp-help" role="status">
          {t.loadingAssignment}
        </p>
      </Card>
    )
  if (query.error || query.data?.id !== missionId || !query.data.orderId)
    return (
      <Card>
        <div className="odm-dp-notice">
          <p role="alert">{t.couldNotLoadTheMission}</p>
          <button className="odm-btn" onClick={query.reload}>
            {t.retry}
          </button>
          <button className="odm-btn" onClick={close}>
            {t.backToMissionList}
          </button>
        </div>
      </Card>
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

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { managerHref } from '../../../routes'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionScopedAssignmentMessages } from './MissionScopedAssignment.messages'

/** Mission list entry resolves Order context, but never asks to select the known Mission again. */
export function MissionScopedAssignmentPage({
  missionId,
}: {
  missionId: string
}) {
  const { t } = useI18n(missionScopedAssignmentMessages)
  const query = useApiQuery(
    (signal) => missionsApi.getMissionResponse(missionId, signal),
    [missionId],
  )
  const close = () => {
    window.location.hash = managerHref({ screen: 'missions' })
  }
  if (query.loading) return <p role="status">{t.loading}</p>
  if (query.error || query.data?.id !== missionId || !query.data.orderId)
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">{t.loadError}</p>
        <Button onClick={query.reload}>{t.retry}</Button>
        <Button onClick={close}>{t.backToMissions}</Button>
      </section>
    )
  return (
    <OrderResourceAssignmentWizard
      key={missionId}
      orderId={query.data.orderId}
      initialMissionId={missionId}
      returnLabel={t.backToMissions}
      onClose={close}
    />
  )
}

import { MissionBackLink } from './MissionBackLink'
import { StateView } from '../../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailErrorMessages } from './MissionDetailError.messages'

export function MissionDetailError({ error }: { error: string | null }) {
  const { t } = useI18n(missionDetailErrorMessages)
  return (
    <div className="odm-or">
      <MissionBackLink />
      <section className="odm-or-card">
        <StateView
          state="error"
          title={t.loadError}
          error={error ?? undefined}
        />
      </section>
    </div>
  )
}

import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import { Modal } from '../../../../shared/components/ui'
import {
  checklistsApi,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { ChecklistLoadError } from './ChecklistUi'
import { ChecklistContentForm } from './ChecklistContentForm'
import { ChecklistHistoryPanel } from './ChecklistHistoryPanel'
import { ServiceApplyForm } from './ServiceChecklistPricingModal'

type Tab = 'content' | 'service' | 'history'

/** The service whose template the checklist is being configured in. */
export type ConfigServiceContext = {
  id: string
  name: string
  rows: ServiceChecklist[]
  row: ServiceChecklist
}

/**
 * The one place a checklist is edited. Opened from the library (shared content and history) or from a
 * service template (adds the "applies to this service" tab and the private-copy offer), so the same screen
 * answers both "what is this checklist" and "how does this service use it".
 */
export function ChecklistConfigModal({
  checklist,
  service,
  close,
  saved,
}: {
  /** The library row; omit to create a new checklist, or when only `service` is known. */
  checklist?: ChecklistDefinition
  service?: ConfigServiceContext
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const creating = !checklist && !service
  const checklistId = checklist?.id ?? service?.row.checklistId
  const [tab, setTab] = useState<Tab>(service ? 'service' : 'content')
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'content', label: t.tabContent },
    ...(service ? [{ id: 'service' as const, label: t.tabService }] : []),
    ...(checklistId ? [{ id: 'history' as const, label: t.tabHistory }] : []),
  ]
  return (
    <Modal
      width={640}
      icon="clipboard"
      title={creating ? t.add : t.configTitle}
      subtitle={
        service
          ? `${service.name} · ${service.row.content}`
          : checklist?.content
      }
      onClose={close}
    >
      {!creating && (
        <div
          className="checklist-tabs"
          role="tablist"
          aria-label={t.configTitle}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`checklist-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="checklist-tabpanel"
              className={
                'checklist-tab' + (tab === item.id ? ' is-active' : '')
              }
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div
        id="checklist-tabpanel"
        role={creating ? undefined : 'tabpanel'}
        aria-labelledby={creating ? undefined : `checklist-tab-${tab}`}
      >
        {tab === 'content' &&
          (checklist || creating ? (
            <ChecklistContentForm
              key={checklist?.id ?? 'new'}
              row={checklist}
              close={close}
              saved={saved}
            />
          ) : (
            service && (
              <ServiceContentTab
                service={service}
                close={close}
                saved={saved}
              />
            )
          ))}
        {tab === 'service' && service && (
          <ServiceApplyForm
            serviceId={service.id}
            rows={service.rows}
            row={service.row}
            close={close}
            saved={saved}
          />
        )}
        {tab === 'history' && checklistId && (
          <ChecklistHistoryPanel checklistId={checklistId} />
        )}
      </div>
    </Modal>
  )
}

/** Shared content opened from a service: loads the library checklist and offers a private copy when it is shared. */
function ServiceContentTab({
  service,
  close,
  saved,
}: {
  service: ConfigServiceContext
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.get(service.row.checklistId, signal),
    [service.row.checklistId],
  )
  if (query.loading) return <LoadingState />
  if (query.error !== undefined || !query.data)
    return (
      <ChecklistLoadError
        title={t.catalogLoadError}
        error={query.error}
        retry={query.reload}
      />
    )
  const definition = query.data
  return (
    <ChecklistContentForm
      key={definition.id}
      row={definition}
      close={close}
      saved={saved}
      extra={
        (definition.usedByServiceCount ?? 0) > 1 ? (
          <ForkOffer
            serviceId={service.id}
            checklistId={definition.id}
            done={saved}
          />
        ) : undefined
      }
    />
  )
}

/** "Only change it for this service": copies the shared checklist for this service instead of editing the original. */
function ForkOffer({
  serviceId,
  checklistId,
  done,
}: {
  serviceId: string
  checklistId: string
  done: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function fork() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.fork(serviceId, checklistId)
      done()
    } catch (cause) {
      setError(checklistError(cause, t))
      setBusy(false)
    }
  }
  return (
    <div className="checklist-fork">
      <strong>{t.forkTitle}</strong>
      <p className="checklist-field-meta">{t.forkHint}</p>
      {confirming ? (
        <div className="checklist-form-actions">
          <span>{t.forkConfirm}</span>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={busy}
            onClick={() => void fork()}
          >
            {busy ? t.forking : t.fork}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="odm-btn"
          onClick={() => setConfirming(true)}
        >
          {t.fork}
        </button>
      )}
      {error && (
        <p className="checklist-banner is-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

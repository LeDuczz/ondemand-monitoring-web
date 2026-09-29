import { useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { Modal } from '../../../../../shared/components/ui'
import {
  emptyServiceForm,
  mapService,
  readApiError,
  serviceToForm,
  toServiceRequest,
} from '../../../lib/catalogMappers'
import type { AdminService } from '../../../types/catalog'
import { EditLoader } from './EditLoader'
import { FormField } from '../../../../../shared/components/ui'
import { FormFooter } from '../../../../../shared/components/ui'
import { serviceModalMessages } from './ServiceModal.messages'

type Props = {
  /** Existing service (edit) or undefined (create). */
  service?: AdminService
  onClose: () => void
  onSaved: () => void
}

function ServiceForm({ service, onClose, onSaved }: Props) {
  const { t } = useI18n(serviceModalMessages)
  const [values, setValues] = useState(
    service ? serviceToForm(service) : emptyServiceForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) {
      setErrors({ name: t.required })
      return
    }
    setBusy(true)
    setSubmitError(null)
    setErrors({})
    try {
      const body = toServiceRequest(values)
      if (service) await catalogApi.updateService(service.id, body)
      else await catalogApi.createService(body)
      onSaved()
    } catch (err) {
      const { message, fields } = readApiError(err, t.genericError)
      setErrors(fields)
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      width={540}
      icon="plus"
      title={service ? t.editTitle : t.createTitle}
      subtitle={service ? t.editSubtitle : t.createSubtitle}
      onClose={onClose}
      footer={<FormFooter formId="adm-service-form" busy={busy} onClose={onClose} />}
    >
      <form id="adm-service-form" onSubmit={handleSubmit} noValidate>
        <FormField id="adm-svc-name" label={t.name} required error={errors.name}>
          <input
            id="adm-svc-name"
            className="odm-inp"
            value={values.name}
            placeholder={t.namePlaceholder}
            aria-invalid={!!errors.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </FormField>
        <FormField id="adm-svc-desc" label={t.description} error={errors.description}>
          <textarea
            id="adm-svc-desc"
            className="odm-inp"
            rows={4}
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
          />
        </FormField>
        <label className="adm-check">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
          />
          <span>
            {t.isActive}
            <small>{t.isActiveHint}</small>
          </span>
        </label>
        {submitError && (
          <div role="alert" className="adm-alert is-danger">
            {submitError}
          </div>
        )}
      </form>
    </Modal>
  )
}

export function ServiceModal({ service, onClose, onSaved }: Props) {
  const { t } = useI18n(serviceModalMessages)
  return (
    <EditLoader
      title={t.editTitle}
      onClose={onClose}
      load={
        service
          ? (signal) => catalogApi.getService(service.id, signal).then(mapService)
          : undefined
      }
    >
      {(fresh) => (
        <ServiceForm service={fresh ?? service} onClose={onClose} onSaved={onSaved} />
      )}
    </EditLoader>
  )
}

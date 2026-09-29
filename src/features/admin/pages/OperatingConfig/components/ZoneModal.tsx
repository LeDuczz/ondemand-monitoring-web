import { useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { FormFooter } from '../../../components/common/FormFooter'
import { Modal } from '../../../components/common/Modal'
import type { NoFlyZone } from '../../../types/operatingConfig'
import { toFormState, toPayload, type ZoneFormState } from './zoneForm'
import { ZoneFormFields } from './ZoneFormFields'
import { zoneModalMessages } from './ZoneModal.messages'

type Props = {
  zone?: NoFlyZone
  onClose: () => void
  onSaved: () => void
}

export function ZoneModal({ zone, onClose, onSaved }: Props) {
  const { t } = useI18n(zoneModalMessages)
  const [form, setForm] = useState<ZoneFormState>(() => toFormState(zone))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: t.required })
      return
    }
    setErrors({})
    setBusy(true)
    setSubmitError(null)
    try {
      const payload = toPayload(form, zone)
      if (zone) await adminApi.updateNoFlyZone(zone.id, payload)
      else await adminApi.createNoFlyZone(payload)
      onSaved()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      width={560}
      icon="map-pin"
      tone="warning"
      title={zone ? t.editTitle : t.addTitle}
      subtitle={t.subtitle}
      onClose={onClose}
      footer={<FormFooter formId="adm-nfz-form" busy={busy} onClose={onClose} />}
    >
      <form id="adm-nfz-form" onSubmit={handleSubmit} noValidate>
        <ZoneFormFields
          form={form}
          errors={errors}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        />
        {submitError && (
          <div role="alert" className="adm-alert is-danger">
            {submitError}
          </div>
        )}
      </form>
    </Modal>
  )
}

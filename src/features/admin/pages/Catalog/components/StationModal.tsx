import { useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { Modal } from '../../../components/common/Modal'
import { readApiError } from '../../../lib/catalogMappers'
import type { AdminStation } from '../../../types/catalog'
import { FormField } from '../../../components/common/FormField'
import { FormFooter } from '../../../components/common/FormFooter'
import { stationModalMessages } from './StationModal.messages'

type Props = {
  station?: AdminStation
  onClose: () => void
  onSaved: () => void
}

export function StationModal({ station, onClose, onSaved }: Props) {
  const { t } = useI18n(stationModalMessages)
  const [code, setCode] = useState(station?.code ?? '')
  const [name, setName] = useState(station?.name ?? '')
  const [address, setAddress] = useState(station?.address ?? '')
  const [lat, setLat] = useState(String(station?.lat ?? 0))
  const [lon, setLon] = useState(String(station?.lon ?? 0))
  const [radius, setRadius] = useState(String(station?.maxServiceRadiusM ?? 5000))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!station && !code.trim()) next.code = t.required
    if (!name.trim()) next.name = t.required
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    setSubmitError(null)
    const fields = {
      name: name.trim(),
      address,
      lat: Number(lat),
      lon: Number(lon),
      maxServiceRadiusM: Number(radius),
    }
    try {
      if (station) await adminApi.updateStation(station.id, fields)
      else await adminApi.createStation({ code: code.trim(), ...fields })
      onSaved()
    } catch (err) {
      const parsed = readApiError(err, t.genericError)
      setErrors(parsed.fields)
      setSubmitError(parsed.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      width={560}
      icon="map-pin"
      title={station ? t.editTitle : t.createTitle}
      subtitle={t.subtitle}
      onClose={onClose}
      footer={<FormFooter formId="adm-station-form" busy={busy} onClose={onClose} />}
    >
      <form id="adm-station-form" onSubmit={handleSubmit} noValidate>
        {!station && (
          <FormField id="adm-st-code" label={t.code} required error={errors.code}>
            <input
              id="adm-st-code"
              className="odm-inp"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </FormField>
        )}
        <FormField id="adm-st-name" label={t.name} required error={errors.name}>
          <input
            id="adm-st-name"
            className="odm-inp"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField id="adm-st-addr" label={t.address}>
          <input
            id="adm-st-addr"
            className="odm-inp"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </FormField>
        <div className="adm-form-pair">
          <FormField id="adm-st-lat" label={t.lat}>
            <input id="adm-st-lat" className="odm-inp" type="number" step="0.0001" value={lat} onChange={(e) => setLat(e.target.value)} />
          </FormField>
          <FormField id="adm-st-lon" label={t.lon}>
            <input id="adm-st-lon" className="odm-inp" type="number" step="0.0001" value={lon} onChange={(e) => setLon(e.target.value)} />
          </FormField>
        </div>
        <FormField id="adm-st-radius" label={t.radius}>
          <input id="adm-st-radius" className="odm-inp" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
        </FormField>
        {submitError && (
          <div role="alert" className="adm-alert is-danger">
            {submitError}
          </div>
        )}
      </form>
    </Modal>
  )
}

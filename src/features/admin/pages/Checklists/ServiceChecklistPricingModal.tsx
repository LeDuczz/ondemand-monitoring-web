import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { FormField, Modal } from '../../../../shared/components/ui'
import { PriceBreakdownView } from '../../../../shared/components/odm/PriceBreakdownView'
import {
  checklistPricingApi,
  type AdminPreviewItem,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import {
  checklistsApi,
  type ServiceChecklist,
  type ServiceChecklistPricingInput,
} from '../../api/checklistsApi'
import { MAX_MEDIA_COUNT } from '../../lib/checklistPricing'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'

type Form = {
  basePrice: string
  images: string
  videos: string
  profile: string
  required: boolean
}

const PROFILE = /^[A-Za-z0-9_]*$/

/** Empty string inherits; anything else must be a whole number in range. */
function optionalWhole(value: string, max: number): number | null | 'invalid' {
  if (value.trim() === '') return null
  if (!/^\d+$/.test(value.trim())) return 'invalid'
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : 'invalid'
}

export function parseOverrides(
  form: Form,
): { ok: true; value: ServiceChecklistPricingInput } | { ok: false } {
  const base = optionalWhole(form.basePrice, 9_999_999_999_999)
  const images = optionalWhole(form.images, MAX_MEDIA_COUNT)
  const videos = optionalWhole(form.videos, MAX_MEDIA_COUNT)
  if (
    base === 'invalid' ||
    images === 'invalid' ||
    videos === 'invalid' ||
    form.profile.length > 60 ||
    !PROFILE.test(form.profile)
  )
    return { ok: false }
  return {
    ok: true,
    value: {
      basePriceOverride: base,
      includedImageCountOverride: images,
      includedVideoCountOverride: videos,
      pricingProfileOverride: form.profile.trim().toUpperCase() || null,
      required: form.required,
    },
  }
}

/**
 * Numbers equal to what the checklist already provides are saved as "inherit" so later checklist edits still flow through.
 * The pricing profile is not chosen here: it is always sent explicitly (the existing override, else the checklist's
 * profile, else DEFAULT).
 */
function inheritWhenUnchanged(
  value: ServiceChecklistPricingInput,
  row: ServiceChecklist,
): ServiceChecklistPricingInput {
  return {
    ...value,
    basePriceOverride:
      value.basePriceOverride === row.checklistBasePrice
        ? null
        : value.basePriceOverride,
    includedImageCountOverride:
      value.includedImageCountOverride === row.checklistIncludedImageCount
        ? null
        : value.includedImageCountOverride,
    includedVideoCountOverride:
      value.includedVideoCountOverride === row.checklistIncludedVideoCount
        ? null
        : value.includedVideoCountOverride,
  }
}

const inheritedProfile = (row: ServiceChecklist) =>
  (row.checklistPricingProfile ?? 'DEFAULT').toUpperCase()

export function ServiceChecklistPricingModal({
  serviceId,
  rows,
  row,
  close,
  saved,
}: {
  serviceId: string
  rows: ServiceChecklist[]
  row: ServiceChecklist
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [form, setForm] = useState<Form>({
    // Pre-filled with the effective value so nothing has to be typed; unchanged values are saved as "inherit".
    basePrice: (row.basePriceOverride ?? row.checklistBasePrice ?? 0).toString(),
    images: (
      row.includedImageCountOverride ??
      row.checklistIncludedImageCount ??
      0
    ).toString(),
    videos: (
      row.includedVideoCountOverride ??
      row.checklistIncludedVideoCount ??
      0
    ).toString(),
    profile: row.pricingProfileOverride ?? inheritedProfile(row),
    required: row.required === true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ServicePricePreview | null>(null)

  function candidate() {
    const parsed = parseOverrides(form)
    if (!parsed.ok) {
      setError(t.invalidPricing)
      return null
    }
    setError(null)
    return inheritWhenUnchanged(parsed.value, row)
  }

  async function check() {
    const value = candidate()
    if (!value || busy) return
    setBusy(true)
    try {
      const items: AdminPreviewItem[] = rows.map((other) =>
        other.checklistId === row.checklistId
          ? {
              checklistId: other.checklistId,
              basePrice: value.basePriceOverride ?? other.checklistBasePrice,
              includedImageCount:
                value.includedImageCountOverride ??
                other.checklistIncludedImageCount,
              includedVideoCount:
                value.includedVideoCountOverride ??
                other.checklistIncludedVideoCount,
              pricingProfile:
                value.pricingProfileOverride ??
                other.checklistPricingProfile ??
                undefined,
            }
          : { checklistId: other.checklistId },
      )
      setPreview(await checklistPricingApi.adminPreview({ serviceId, items }))
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    const value = candidate()
    if (!value || busy) return
    setBusy(true)
    try {
      await checklistsApi.updatePricing(serviceId, row.checklistId, {
        ...value,
        expectedVersion: row.version,
      })
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  const field = (
    id: string,
    label: string,
    key: 'basePrice' | 'images' | 'videos',
    inherited: number | undefined,
    step = 1,
  ) => (
    <FormField id={id} label={label}>
      <input
        id={id}
        className="odm-inp"
        type="number"
        min={0}
        step={step}
        inputMode="numeric"
        placeholder={`${t.inheritedValue}: ${inherited ?? 0}`}
        value={form[key]}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      />
    </FormField>
  )

  return (
    <Modal
      width={720}
      icon="clipboard"
      title={t.pricingTitle}
      subtitle={row.content}
      onClose={() => {
        if (!busy) close()
      }}
      footer={
        <>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            disabled={busy}
            onClick={close}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn"
            disabled={busy}
            onClick={() => void check()}
          >
            {t.whatIf}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? t.saving : t.save}
          </button>
        </>
      }
    >
      <div className="checklist-dialog">
        <p className="checklist-field-meta">{t.pricingOverrideHint}</p>
        {field(
          'svc-cl-base',
          t.basePrice,
          'basePrice',
          row.checklistBasePrice,
          1000,
        )}
        {field(
          'svc-cl-images',
          t.includedImages,
          'images',
          row.checklistIncludedImageCount,
        )}
        {field(
          'svc-cl-videos',
          t.includedVideos,
          'videos',
          row.checklistIncludedVideoCount,
        )}
        <label className="adm-check">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(event) =>
              setForm({ ...form, required: event.target.checked })
            }
          />
          <span>{t.requiredLabel}</span>
        </label>
        {error && (
          <p className="checklist-banner is-error" role="alert">
            {error}
          </p>
        )}
        {preview && <PriceBreakdownView preview={preview} />}
      </div>
    </Modal>
  )
}

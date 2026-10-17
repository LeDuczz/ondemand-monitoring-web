import { useState, type FormEvent } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import {
  Modal,
  PageHeader,
  Card,
  EmptyState,
  FormField,
  StatusBadge,
} from '../../../../shared/components/ui'
import {
  checklistsApi,
  type ChecklistDefinition,
} from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { Icon } from '../../../../shared/components/Icon'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import {
  pricingToForm,
  validatePricingForm,
  type ChecklistPricingErrors,
  type ChecklistPricingForm,
} from '../../lib/checklistPricing'
import { ChecklistPagination, ChecklistLoadError } from './ChecklistUi'

export function ChecklistCatalogPage() {
  const { t, lang } = useI18n(checklistMessages)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(0)
  const [editor, setEditor] = useState<ChecklistDefinition | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageId, setUsageId] = useState<string | null>(null)
  const query = useApiQuery(
    (signal) =>
      checklistsApi.list(
        search,
        active === '' ? undefined : active === 'true',
        page,
        signal,
      ),
    [search, active, page],
  )
  async function toggle(row: ChecklistDefinition) {
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.status(row.id, !row.isActive)
      query.reload()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="checklist-page">
      <PageHeader
        title={t.title}
        subtitle={t.catalogSubtitle}
        actions={
          <button
            className="odm-btn odm-btn-p"
            onClick={() => setEditor('new')}
          >
            <Icon name="plus" width={16} height={16} aria-hidden="true" />
            {t.add}
          </button>
        }
      />
      <Card flush>
        <div className="checklist-toolbar">
          <div className="checklist-search">
            <Icon name="search" width={16} height={16} aria-hidden="true" />
            <input
              className="odm-inp"
              type="search"
              aria-label={t.search}
              placeholder={t.search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <select
            className="odm-inp"
            aria-label={t.filter}
            value={active}
            onChange={(e) => {
              setActive(e.target.value)
              setPage(0)
            }}
          >
            <option value="">{t.all}</option>
            <option value="true">{t.active}</option>
            <option value="false">{t.inactive}</option>
          </select>
          <a
            className="odm-btn"
            href={adminHref({ screen: 'serviceChecklists' })}
          >
            <Icon name="clipboard" width={16} height={16} aria-hidden="true" />
            {t.template}
          </a>
        </div>
        {error && (
          <p className="checklist-banner is-error" role="alert">
            {error}
          </p>
        )}
        {query.loading && <LoadingState />}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.catalogLoadError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {!query.loading && query.error === undefined && query.data && (
          <>
            <div className="ui-table-scroll">
              <table className="odm-adm-table checklist-table">
                <thead>
                  <tr>
                    <th>{t.content}</th>
                    <th>{t.filter}</th>
                    <th>{t.priceColumn}</th>
                    <th>{t.usage}</th>
                    <th>{t.updated}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((row) => (
                    <tr key={row.id}>
                      <td className="adm-wrap checklist-content-cell">
                        {row.content}
                      </td>
                      <td>
                        <StatusBadge
                          tone={row.isActive ? 'success' : 'neutral'}
                        >
                          {row.isActive ? t.active : t.inactive}
                        </StatusBadge>
                      </td>
                      <td className="adm-cell-mono">
                        {formatVnd(row.basePrice ?? 0)}
                        <br />
                        {row.includedImageCount ?? 0} {t.imagesShort} ·{' '}
                        {row.includedVideoCount ?? 0} {t.videosShort}
                        {row.pricingProfile ? ` · ${row.pricingProfile}` : ''}
                      </td>
                      <td>
                        <button
                          className="odm-btn odm-btn-gh odm-btn-sm"
                          onClick={() => setUsageId(row.id)}
                        >
                          {t.usage}
                        </button>
                      </td>
                      <td className="adm-cell-mono">
                        {new Date(
                          row.updatedAt ?? row.createdAt,
                        ).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                      </td>
                      <td>
                        <div className="checklist-actions">
                          <button
                            className="odm-btn odm-btn-gh odm-btn-sm"
                            disabled={busy}
                            onClick={() => setEditor(row)}
                          >
                            <Icon
                              name="edit"
                              width={15}
                              height={15}
                              aria-hidden="true"
                            />
                            {t.edit}
                          </button>{' '}
                          <button
                            className={
                              'odm-btn odm-btn-gh odm-btn-sm' +
                              (row.isActive ? ' checklist-danger' : '')
                            }
                            disabled={busy}
                            onClick={() => void toggle(row)}
                          >
                            {row.isActive ? t.deactivate : t.reactivate}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data.items.length && <EmptyState title={t.empty} />}
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              change={setPage}
            />
          </>
        )}
      </Card>
      <p className="checklist-banner">{t.future}</p>
      {editor && (
        <ChecklistEditor
          row={editor === 'new' ? undefined : editor}
          close={() => setEditor(null)}
          saved={() => {
            setEditor(null)
            query.reload()
          }}
        />
      )}
      {usageId && (
        <ChecklistUsage
          key={usageId}
          id={usageId}
          close={() => setUsageId(null)}
        />
      )}
    </div>
  )
}

/** One entry per non-empty line, trimmed; the order is the order of the lines. */
const toLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

function ChecklistEditor({
  row,
  close,
  saved,
}: {
  row?: ChecklistDefinition
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [content, setContent] = useState(row?.content ?? '')
  const [difficulty, setDifficulty] = useState<
    NonNullable<ChecklistDefinition['difficulty']>
  >(row?.difficulty ?? 'BASIC')
  const [pricing, setPricing] = useState<ChecklistPricingForm>(
    pricingToForm(row ?? {}),
  )
  const [pricingErrors, setPricingErrors] = useState<ChecklistPricingErrors>({})
  const [description, setDescription] = useState(row?.description ?? '')
  const [steps, setSteps] = useState((row?.executionSteps ?? []).join('\n'))
  const [inputs, setInputs] = useState((row?.inputRequirements ?? []).join('\n'))
  const [outputs, setOutputs] = useState((row?.expectedOutputs ?? []).join('\n'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = content.trim()
    if (!value || value.length > 500) {
      setError(t.required)
      return
    }
    const checked = validatePricingForm(pricing)
    if (!checked.ok) {
      setPricingErrors(checked.errors)
      setError(t.invalidPricing)
      return
    }
    setPricingErrors({})
    const guidance = {
      description: description.trim(),
      executionSteps: toLines(steps),
      inputRequirements: toLines(inputs),
      expectedOutputs: toLines(outputs),
    }
    if (
      guidance.description.length > 4000 ||
      [
        guidance.executionSteps,
        guidance.inputRequirements,
        guidance.expectedOutputs,
      ].some(
        (list) => list.length > 30 || list.some((line) => line.length > 500),
      )
    ) {
      setError(t.guidanceInvalid)
      return
    }
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (row)
        await checklistsApi.update(row.id, value, difficulty, {
          ...checked.value,
          ...guidance,
        })
      else
        await checklistsApi.create(value, difficulty, {
          ...checked.value,
          ...guidance,
        })
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      width={560}
      icon="clipboard"
      title={row ? t.edit : t.add}
      subtitle={t.future}
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
            type="submit"
            form="checklist-editor"
            className="odm-btn odm-btn-p"
            disabled={busy}
          >
            {busy ? t.saving : t.save}
          </button>
        </>
      }
    >
      <form
        id="checklist-editor"
        className="checklist-dialog"
        noValidate
        onSubmit={(event) => void submit(event)}
      >
        <FormField id="checklist-content" label={t.content} required>
          <textarea
            id="checklist-content"
            className="odm-inp"
            required
            maxLength={500}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            aria-describedby="checklist-content-hint"
            aria-invalid={error !== null}
          />
        </FormField>
        <div id="checklist-content-hint" className="checklist-field-meta">
          <span>{t.contentHint}</span>
          <span>{content.length}/500</span>
        </div>
        <FormField id="checklist-description" label={t.descriptionLabel}>
          <textarea
            id="checklist-description"
            className="odm-inp"
            rows={3}
            maxLength={4000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-describedby="checklist-description-hint"
          />
        </FormField>
        <div id="checklist-description-hint" className="checklist-field-meta">
          <span>{t.descriptionHint}</span>
          <span>{description.length}/4000</span>
        </div>
        {(
          [
            ['steps', t.stepsLabel, t.stepsHint, steps, setSteps],
            ['inputs', t.inputsLabel, t.inputsHint, inputs, setInputs],
            ['outputs', t.outputsLabel, t.outputsHint, outputs, setOutputs],
          ] as const
        ).map(([key, label, hint, value, setValue]) => (
          <div key={key}>
            <FormField id={`checklist-${key}`} label={label}>
              <textarea
                id={`checklist-${key}`}
                className="odm-inp"
                rows={3}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-describedby={`checklist-${key}-hint`}
              />
            </FormField>
            <div id={`checklist-${key}-hint`} className="checklist-field-meta">
              <span>{hint}</span>
            </div>
          </div>
        ))}
        <FormField id="checklist-difficulty" label="Độ khó tính giá" required>
          <select
            id="checklist-difficulty"
            className="odm-inp"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as typeof difficulty)
            }
          >
            <option value="BASIC">Cơ bản</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
            <option value="VERY_HARD">Rất khó</option>
          </select>
        </FormField>
        <fieldset className="checklist-pricing">
          <legend>{t.pricingSection}</legend>
          <p className="checklist-field-meta">{t.pricingHint}</p>
          <p className="checklist-banner">
            {t.mediaPolicyHint}{' '}
            <a href={adminHref({ screen: 'operatingConfig' })}>
              {t.openPricingPolicy}
            </a>
          </p>
          <PricingNumber
            id="checklist-base-price"
            label={t.basePrice}
            field="basePrice"
            step={1000}
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
          <PricingNumber
            id="checklist-included-images"
            label={t.includedImages}
            field="includedImageCount"
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
          <PricingNumber
            id="checklist-included-videos"
            label={t.includedVideos}
            field="includedVideoCount"
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
          <PricingNumber
            id="checklist-video-duration"
            label={t.videoDuration}
            field="standardVideoDurationSeconds"
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
          <FormField
            id="checklist-pricing-profile"
            label={t.pricingProfile}
            error={pricingErrors.pricingProfile ? t.invalidPricing : undefined}
          >
            <input
              id="checklist-pricing-profile"
              className="odm-inp"
              list="checklist-pricing-profiles"
              maxLength={60}
              value={pricing.pricingProfile}
              aria-describedby="checklist-pricing-profile-hint"
              aria-invalid={pricingErrors.pricingProfile !== undefined}
              onChange={(event) =>
                setPricing({ ...pricing, pricingProfile: event.target.value })
              }
            />
            <datalist id="checklist-pricing-profiles">
              <option value="DEFAULT" />
            </datalist>
            <small id="checklist-pricing-profile-hint">
              {t.pricingProfileHint}
            </small>
          </FormField>
          <div className="checklist-field-meta">
            Chỉ bật chiều đo thực sự ảnh hưởng đến checklist này.
          </div>
          {(
            [
              ['areaPricingEnabled', 'Tính theo diện tích'],
              ['lengthPricingEnabled', 'Tính theo chiều dài'],
              ['altitudePricingEnabled', 'Tính theo độ cao'],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="checklist-field-meta">
              <input
                type="checkbox"
                checked={pricing[field]}
                onChange={(event) =>
                  setPricing({ ...pricing, [field]: event.target.checked })
                }
              />{' '}
              {label}
            </label>
          ))}
          <PricingNumber
            id="checklist-included-area"
            label="Diện tích đã bao gồm (ha)"
            field="includedAreaHa"
            step={0.001}
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
          <PricingNumber
            id="checklist-included-length"
            label="Chiều dài đã bao gồm (km)"
            field="includedLengthKm"
            step={0.001}
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
          <PricingNumber
            id="checklist-included-altitude"
            label="Độ cao đã bao gồm (m)"
            field="includedAltitudeM"
            step={0.01}
            pricing={pricing}
            errors={pricingErrors}
            setPricing={setPricing}
          />
        </fieldset>
        {error && (
          <p className="checklist-banner is-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function PricingNumber({
  id,
  label,
  field,
  step = 1,
  pricing,
  errors,
  setPricing,
}: {
  id: string
  label: string
  field: Exclude<
    keyof ChecklistPricingForm,
    'areaPricingEnabled' | 'lengthPricingEnabled' | 'altitudePricingEnabled'
  >
  step?: number
  pricing: ChecklistPricingForm
  errors: ChecklistPricingErrors
  setPricing: (next: ChecklistPricingForm) => void
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <FormField
      id={id}
      label={label}
      error={errors[field] ? t.invalidPricing : undefined}
    >
      <input
        id={id}
        className="odm-inp"
        type="number"
        min={0}
        step={step}
        inputMode="numeric"
        value={pricing[field]}
        aria-invalid={errors[field] !== undefined}
        onChange={(event) =>
          setPricing({ ...pricing, [field]: event.target.value })
        }
      />
    </FormField>
  )
}

function ChecklistUsage({ id, close }: { id: string; close: () => void }) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.services(id, signal),
    [id],
  )
  return (
    <Modal
      title={t.usage}
      icon="clipboard"
      onClose={close}
      footer={
        <button type="button" className="odm-btn" onClick={close}>
          {t.close}
        </button>
      }
    >
      {query.loading && <LoadingState />}
      {query.error !== undefined && (
        <ChecklistLoadError
          title={t.catalogLoadError}
          error={query.error}
          retry={query.reload}
        />
      )}
      {!query.loading && query.error === undefined && query.data && (
        <ul className="checklist-usage-list">
          {query.data.map((row) => (
            <li key={row.id}>
              <a
                href={adminHref({
                  screen: 'serviceChecklists',
                  serviceId: row.serviceId,
                })}
              >
                {row.serviceName}
                <Icon
                  name="arrow-right"
                  width={16}
                  height={16}
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      {query.data?.length === 0 && <EmptyState title={t.noneUsed} />}
    </Modal>
  )
}

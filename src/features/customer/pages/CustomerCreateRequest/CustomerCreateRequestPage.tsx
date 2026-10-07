import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { PortalLayout } from '../../../../shared/components/portal/PortalLayout'
import { useI18n } from '../../../../shared/i18n'
import { ConfirmSubmitModal } from '../CreateOrder/components/ConfirmSubmitModal'
import { CreatedSuccess } from '../CreateOrder/components/CreatedSuccess'
import { DeliverablesCard } from '../CreateOrder/components/DeliverablesCard'
import { LocationStep } from '../CreateOrder/components/LocationStep'
import { PricingEstimateCard } from '../CreateOrder/components/PricingEstimateCard'
import { RequestSummaryCard } from '../CreateOrder/components/RequestSummaryCard'
import { ScheduleCard } from '../CreateOrder/components/ScheduleCard'
import { ServicePicker } from '../CreateOrder/components/ServicePicker'
import '../CreateOrder/CreateOrder.css'
import { RequestBasicsCard } from './components/RequestBasicsCard'
import { SubmitBar } from './components/SubmitBar'
import { customerCreateRequestPageMessages } from './CustomerCreateRequestPage.messages'
import { useCreateRequest } from './hooks/useCreateRequest'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'

/**
 * Quick single-page variant of the create-order wizard, routed outside the
 * customer shell (`#portal/customer/request`). Posts a BE `OrderCreateRequest`.
 */
export function CustomerCreateRequestPage() {
  const { t } = useI18n(customerCreateRequestPageMessages)
  const r = useCreateRequest()
  const { form, errors, update, meta, submit } = r

  return (
    <PortalLayout role="CUSTOMER" title={t.pageTitle} subtitle={t.pageSubtitle}>
      {submit.createdId ? (
        <CreatedSuccess
          orderId={submit.createdId}
          orderCode={submit.createdCode}
        />
      ) : (
        <div className="co-page">
          {meta.loading && !meta.services.length && <LoadingState />}
          {Boolean(meta.error) && (
            <ErrorState
              title={t.metaErrorTitle}
              error={meta.error}
              onRetry={meta.reload}
            />
          )}

          <LocationStep form={form} errors={errors} update={update} />
          <div className="co-grid">
            <div className="co-stack">
              <RequestBasicsCard form={form} errors={errors} update={update} />
              <ServicePicker
                services={meta.services}
                loading={meta.loading}
                selectedId={form.serviceId}
                error={errors.serviceId}
                onSelect={(id) => update('serviceId', id)}
              />
              <ChecklistEditor
                checklist={r.checklist}
                disabled={submit.submitting}
                onReload={r.clearSubmitError}
              />
            </div>
            <div className="co-stack">
              <ScheduleCard
                form={form}
                errors={errors}
                update={update}
                preferredTimes={meta.preferredTimes}
              />
              <DeliverablesCard
                form={form}
                errors={errors}
                update={update}
                deliverables={meta.deliverables}
                loading={meta.deliverablesLoading}
                error={meta.deliverablesError}
                onRetry={meta.reloadDeliverables}
              />
            </div>
          </div>
          <div className="co-grid">
            <RequestSummaryCard
              form={form}
              service={r.service}
              time={r.time}
              deliverable={r.deliverable}
              consultation={null}
              aiAnalysisRequested={false}
            />
            <PricingEstimateCard
              estimate={meta.pricingEstimate}
              loading={meta.pricingLoading}
              hasService={Boolean(r.service)}
              aiAnalysisRequested={false}
            />
          </div>

          <SubmitBar
            error={submit.confirmOpen ? null : r.submitError}
            disabled={
              meta.loading ||
              submit.submitting ||
              (Boolean(form.serviceId) && !r.checklist.valid)
            }
            onSubmit={submit.openConfirm}
          />
          {submit.confirmOpen && (
            <ConfirmSubmitModal
              form={form}
              service={r.service}
              pricingEstimate={meta.pricingEstimate}
              submitting={submit.submitting}
              error={r.submitError}
              onConfirm={() => void submit.submit()}
              onClose={submit.closeConfirm}
            />
          )}
        </div>
      )}
    </PortalLayout>
  )
}

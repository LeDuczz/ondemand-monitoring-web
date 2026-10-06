import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import { ConfirmSubmitModal } from './components/ConfirmSubmitModal'
import { CreatedSuccess } from './components/CreatedSuccess'
import { LocationStep } from './components/LocationStep'
import { ReviewStep } from './components/ReviewStep'
import { ScheduleStep } from './components/ScheduleStep'
import { ServiceStep } from './components/ServiceStep'
import { StepTabs } from './components/StepTabs'
import { WizardFooter } from './components/WizardFooter'
import { createOrderPageMessages } from './CreateOrderPage.messages'
import './CreateOrder.css'
import { useCreateOrderWizard } from './hooks/useCreateOrderWizard'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'

/** Customer wizard: service goal, location, schedule, then deliverables and submit. */
export function CreateOrderPage() {
  const { t } = useI18n(createOrderPageMessages)
  const {
    f,
    meta,
    chat,
    wizard,
    submit,
    service,
    time,
    deliverable,
    checklist,
  } = useCreateOrderWizard()
  const { form, step } = f

  if (submit.createdId) {
    return (
      <CreatedSuccess
        orderId={submit.createdId}
        orderCode={submit.createdCode}
      />
    )
  }

  const footer = (
    <WizardFooter
      step={step}
      nextLabel={t.stepLabels[Math.min(4, step + 1) as 1 | 2 | 3 | 4]}
      submitDisabled={meta.loading || submit.submitting || !checklist.valid}
      onBack={wizard.back}
      onNext={wizard.next}
      onSubmit={submit.openConfirm}
    />
  )

  return (
    <div className="co-page">
      <PageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <a
            href={customerHref({ screen: 'orders' })}
            className="odm-btn odm-btn-gh"
          >
            {t.cancel}
          </a>
        }
      />
      <StepTabs step={step} labels={t.stepLabels} onSelect={wizard.goTo} />

      {meta.loading && !meta.services.length && <LoadingState />}
      {Boolean(meta.error) && (
        <ErrorState
          title={t.metaErrorTitle}
          error={meta.error}
          onRetry={meta.reload}
        />
      )}

      {step === 1 && (
        <ServiceStep
          form={form}
          errors={f.errors}
          update={f.update}
          services={meta.services}
          servicesLoading={meta.loading}
          chat={chat}
          consultation={chat.consultation}
          aiAnalysisRequested={f.aiAnalysisRequested}
          setAiAnalysisRequested={f.setAiAnalysisRequested}
          pricingEstimate={meta.pricingEstimate}
          pricingLoading={meta.pricingLoading}
          checklist={
            <ChecklistEditor
              checklist={checklist}
              disabled={submit.submitting}
              onReload={() => f.setSubmitError(null)}
            />
          }
          footer={footer}
        />
      )}
      {step === 2 && (
        <LocationStep form={form} errors={f.errors} update={f.update} />
      )}
      {step === 3 && (
        <ScheduleStep
          form={form}
          errors={f.errors}
          update={f.update}
          preferredTimes={meta.preferredTimes}
        />
      )}
      {step === 4 && (
        <ReviewStep
          form={form}
          errors={f.errors}
          update={f.update}
          service={service}
          time={time}
          deliverable={deliverable}
          deliverables={meta.deliverables}
          deliverablesLoading={meta.deliverablesLoading}
          consultation={chat.consultation}
          aiAnalysisRequested={f.aiAnalysisRequested}
          pricingEstimate={meta.pricingEstimate}
          pricingLoading={meta.pricingLoading}
          checklist={
            <ChecklistEditor
              variant="compact"
              checklist={checklist}
              disabled={submit.submitting}
              onReload={() => f.setSubmitError(null)}
            />
          }
          footer={footer}
        />
      )}

      {f.submitError && !submit.confirmOpen && (
        <div className="co-notice is-danger" role="alert">
          {f.submitError}
        </div>
      )}

      {step !== 1 && step !== 4 && footer}

      {submit.confirmOpen && (
        <ConfirmSubmitModal
          form={form}
          service={service}
          pricingEstimate={meta.pricingEstimate}
          submitting={submit.submitting}
          error={f.submitError}
          onConfirm={() => void submit.submit()}
          onClose={submit.closeConfirm}
        />
      )}
    </div>
  )
}

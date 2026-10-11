import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CustomerConsultation } from '../../../api/customerApi'
import { AI_IMAGE_ANALYSIS_DESCRIPTION } from '../../../lib/createOrder/payload'
import { useCreateOrderForm } from '../hooks/useCreateOrderForm'

const ready: CustomerConsultation = {
  id: 'c-1',
  status: 'READY_FOR_CONFIRMATION',
  recommendedServiceId: 'svc-2',
  requestTitle: 'Tiêu đề AI',
  requestSummary: 'Mô tả AI',
}
const services = [
  { id: 'svc-2', name: 'Giám sát công trình', basePrice: 3_200_000 },
]

describe('useCreateOrderForm', () => {
  it('starts at step 1 with defaults and restores a stored step', () => {
    expect(renderHook(() => useCreateOrderForm(null)).result.current.step).toBe(1)
    expect(renderHook(() => useCreateOrderForm({ step: 3 })).result.current.step).toBe(3)
    expect(renderHook(() => useCreateOrderForm({ step: 9 as never })).result.current.step).toBe(1)
  })

  it('update() sets a field and clears its error and the submit error', () => {
    const { result } = renderHook(() => useCreateOrderForm(null))
    act(() => {
      result.current.setErrors({ title: 'required' })
      result.current.setSubmitError('boom')
    })
    act(() => result.current.update('title', 'Hi'))
    expect(result.current.form.title).toBe('Hi')
    expect(result.current.errors.title).toBeUndefined()
    expect(result.current.submitError).toBeNull()
  })

  it('adds and removes the AI add-on sentence with the checkbox state', () => {
    const { result } = renderHook(() => useCreateOrderForm(null))
    act(() => result.current.setAiAnalysisRequested(true))
    expect(result.current.form.description).toContain(AI_IMAGE_ANALYSIS_DESCRIPTION)
    act(() => result.current.setAiAnalysisRequested(false))
    expect(result.current.form.description).toBe('')
  })

  it('applyConsultation fills an empty title/service but keeps a title the user typed', () => {
    const { result } = renderHook(() => useCreateOrderForm(null))
    act(() => result.current.applyConsultation(ready, services))
    expect(result.current.form).toMatchObject({
      title: 'Tiêu đề AI',
      description: 'Mô tả AI',
      serviceId: 'svc-2',
    })

    act(() => result.current.update('title', 'Của tôi'))
    act(() =>
      result.current.applyConsultation({ ...ready, requestTitle: 'Tiêu đề AI mới' }, services),
    )
    expect(result.current.form.title).toBe('Của tôi')
  })

  it('resetConsultationFields clears AI-derived text', () => {
    const { result } = renderHook(() => useCreateOrderForm(null))
    act(() => result.current.applyConsultation(ready, services))
    act(() => result.current.resetConsultationFields())
    expect(result.current.form.title).toBe('')
    expect(result.current.aiAnalysisRequested).toBe(false)
  })
})

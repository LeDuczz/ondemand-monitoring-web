import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import ManualUpload from './ManualUpload'

vi.mock('../../../media/api/operatorMediaApi', () => ({
  operatorMediaApi: {
    list: vi.fn().mockResolvedValue([]),
    status: vi.fn(),
    upload: vi.fn(),
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('ManualUpload', () => {
  it('renders Vietnamese text by default', async () => {
    render(
      <ManualUpload missionId="MS-1" onComplete={vi.fn()} onBack={vi.fn()} />,
    )
    await waitFor(() =>
      expect(screen.getByText('Tải thủ công tệp media')).toBeInTheDocument(),
    )
  })

  it('renders English text after switching language', async () => {
    render(
      <ManualUpload missionId="MS-1" onComplete={vi.fn()} onBack={vi.fn()} />,
    )
    act(() => setLanguage('en'))
    await waitFor(() =>
      expect(screen.getByText('Manual media upload')).toBeInTheDocument(),
    )
  })
})

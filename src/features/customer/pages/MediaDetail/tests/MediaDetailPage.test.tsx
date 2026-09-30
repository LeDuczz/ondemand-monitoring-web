import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { MediaDetailPage } from '../MediaDetailPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

async function firstIds() {
  const list = await customerMediaApi.listAvailable()
  return list.map((m) => m.mediaId)
}

describe('MediaDetailPage', () => {
  it('renders the Vietnamese file information heading', async () => {
    const [id] = await firstIds()
    render(<MediaDetailPage mediaId={id} />)
    expect(await screen.findByText('Thông tin tệp')).toBeInTheDocument()
  })

  it('renders the English heading when language is switched', async () => {
    const [id] = await firstIds()
    render(<MediaDetailPage mediaId={id} />)
    await screen.findByText('Thông tin tệp')
    act(() => setLanguage('en'))
    expect(await screen.findByText('File information')).toBeInTheDocument()
  })

  it('loads the asset from /api/media/{id}/download with a download link, viewer and mission code', async () => {
    const [id] = await firstIds()
    const spy = vi.spyOn(customerMediaApi, 'getDownload')
    render(<MediaDetailPage mediaId={id} />)
    expect(await screen.findByRole('link', { name: 'Tải xuống' })).toHaveAttribute('href', expect.stringContaining('data:image/svg+xml'))
    expect(spy).toHaveBeenCalledWith(id, expect.any(AbortSignal))
    expect(await screen.findAllByText('MSN-2609-0131-1')).not.toHaveLength(0)
  })

  it('links previous and next files of the same mission', async () => {
    const ids = await firstIds()
    render(<MediaDetailPage mediaId={ids[1]} />)
    await waitFor(() => expect(screen.getByRole('link', { name: '← Trước' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sau →' })).toBeInTheDocument()
  })

  it('shows an error with retry and recovers', async () => {
    const [id] = await firstIds()
    vi.spyOn(customerMediaApi, 'getDownload').mockRejectedValueOnce(new Error('boom'))
    render(<MediaDetailPage mediaId={id} />)
    expect(await screen.findByText('Không mở được tệp này')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Thông tin tệp')).toBeInTheDocument()
  })

  it('shows an error for an unknown media id', async () => {
    render(<MediaDetailPage mediaId="nope" />)
    expect(await screen.findByText('Không mở được tệp này')).toBeInTheDocument()
  })
})

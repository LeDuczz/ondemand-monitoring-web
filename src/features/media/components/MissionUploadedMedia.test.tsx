// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  operatorMissionMediaApi,
  type UploadedMissionMedia,
} from '../api/operatorMissionMediaApi'
import { MissionUploadedMedia } from './MissionUploadedMedia'

vi.mock('../api/operatorMissionMediaApi', () => ({
  operatorMissionMediaApi: { list: vi.fn(), get: vi.fn() },
}))

const image: UploadedMissionMedia = {
  mediaId: 'image',
  missionId: 'mission',
  deviceId: 'device-0050',
  mediaType: 'IMAGE',
  fileName: 'capture.jpg',
  contentType: 'image/jpeg',
  fileSize: 1024,
  capturedAt: '2026-09-27T00:00:00Z',
  availableAt: null,
  downloadUrl: 'https://example.test/image',
  urlExpiresAt: '2026-09-27T01:00:00Z',
}
const video = {
  ...image,
  mediaId: 'video',
  mediaType: 'VIDEO',
  fileName: 'clip.mp4',
  contentType: 'video/mp4',
}
const page = (items: UploadedMissionMedia[]) => ({
  items,
  page: 0,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})

describe('uploaded mission media gallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLDialogElement.prototype.showModal = vi.fn()
    HTMLDialogElement.prototype.close = vi.fn()
  })
  afterEach(cleanup)

  it('loads the selected mission and requests a fresh scoped video URL before playback', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(
      page([image, video]),
    )
    vi.mocked(operatorMissionMediaApi.get).mockResolvedValue({
      ...video,
      downloadUrl: 'https://example.test/fresh',
    })
    const { container } = render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('capture.jpg')
    expect(operatorMissionMediaApi.list).toHaveBeenCalledWith(
      'mission',
      0,
      expect.any(AbortSignal),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xem clip.mp4' }))
    await waitFor(() =>
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'https://example.test/fresh',
      ),
    )
    expect(operatorMissionMediaApi.get).toHaveBeenCalledWith(
      'mission',
      'video',
      expect.any(AbortSignal),
    )
  })

  it('shows an empty state rather than local files', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(page([]))
    render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('Mission chưa có ảnh/video upload thành công.')
  })

  it('shows errors and supports retry', async () => {
    vi.mocked(operatorMissionMediaApi.list)
      .mockRejectedValueOnce(new Error('Access denied'))
      .mockResolvedValue(page([]))
    render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('Access denied')
    fireEvent.click(screen.getByText('Thử lại'))
    await screen.findByText('Mission chưa có ảnh/video upload thành công.')
  })

  it('resets gallery when switching missions', async () => {
    vi.mocked(operatorMissionMediaApi.list)
      .mockResolvedValueOnce(page([image]))
      .mockResolvedValue(page([]))
    const view = render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('capture.jpg')
    view.rerender(<MissionUploadedMedia missionId="other" />)
    await screen.findByText('Mission chưa có ảnh/video upload thành công.')
    expect(screen.queryByText('capture.jpg')).toBeNull()
  })
})

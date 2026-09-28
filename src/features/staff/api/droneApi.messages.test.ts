import { describe, expect, it } from 'vitest'

import { droneApiMessages } from './droneApi.messages'

describe('droneApiMessages', () => {
  it('provides Vietnamese text', () => {
    expect(droneApiMessages.vi.unknownModel).toBe('Không rõ mẫu drone')
    expect(droneApiMessages.vi.loadFailed(500)).toBe(
      'Không tải được danh sách drone khả dụng (HTTP 500)',
    )
  })

  it('provides English text', () => {
    expect(droneApiMessages.en.unknownModel).toBe('Unknown model')
    expect(droneApiMessages.en.loadFailed(500)).toBe(
      'Failed to load available drones (HTTP 500)',
    )
  })
})

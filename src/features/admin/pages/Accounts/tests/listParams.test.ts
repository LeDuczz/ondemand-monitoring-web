import { describe, expect, it } from 'vitest'

import { buildListParams } from '../listParams'

describe('buildListParams', () => {
  it('maps filters onto the BE query', () => {
    expect(
      buildListParams({ search: ' an ', role: 'MANAGER', status: 'locked' }, 2),
    ).toEqual({
      page: 2,
      size: 20,
      sort: 'createdAt,desc',
      search: 'an',
      role: 'MANAGER',
      active: false,
    })
  })
})

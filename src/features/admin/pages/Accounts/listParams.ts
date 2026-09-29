import type { ListUsersParams, ManagedUserRole } from '../../api/adminUsersApi'

export type StatusFilter = '' | 'active' | 'locked' | 'unverified'

export type AccountsFilterState = {
  search: string
  role: ManagedUserRole | ''
  status: StatusFilter
}

export const ACCOUNTS_PAGE_SIZE = 20

/** Maps UI filter state onto the `GET /api/admin/users` query. */
export function buildListParams(
  filters: AccountsFilterState,
  page: number,
): ListUsersParams {
  const search = filters.search.trim()
  return {
    page,
    size: ACCOUNTS_PAGE_SIZE,
    sort: 'createdAt,desc',
    ...(search ? { search } : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status === 'active' ? { active: true } : {}),
    ...(filters.status === 'locked' ? { active: false } : {}),
    ...(filters.status === 'unverified' ? { emailVerified: false } : {}),
  }
}

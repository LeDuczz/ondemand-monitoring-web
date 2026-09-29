import { act } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { setLanguage } from '../../../shared/i18n'
import customerSeed from '../../../mocks/data/customer-orders.json'
import { customerApi } from '../api/customerApi'
import { CustomerApp } from '../CustomerApp'
import { CustomerCreateRequestPage } from '../pages/CustomerCreateRequest'

/**
 * Regression guard: after switching to English, no Vietnamese diacritic may
 * be left in the rendered text or in aria-label/title/placeholder/alt values
 * of any Customer page (including the sidebar shell and the chatbot).
 */
const VI_CHARS =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i

/**
 * Seed / BE data that is legitimately Vietnamese: every diacritic-bearing
 * string value of the mock customer seed (order titles, addresses, notes...)
 * plus the mock catalog names. UI copy is never added here.
 */
function collectSeedStrings(value: unknown, out: Set<string>) {
  if (typeof value === 'string') {
    if (VI_CHARS.test(value)) out.add(value)
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectSeedStrings(v, out))
  } else if (value && typeof value === 'object') {
    // Object keys are data too (e.g. AI finding evidence labels).
    for (const [key, v] of Object.entries(value)) {
      if (VI_CHARS.test(key)) out.add(key)
      collectSeedStrings(v, out)
    }
  }
}

/** Vietnamese string literals of the mock BE handlers (catalog, zones, missions). */
const MOCK_HANDLER_SOURCES = import.meta.glob(
  '../../../mocks/handlers/{catalogBe,customerCreateOrderBe,customerMissionHistoryBe}.ts',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>
function collectHandlerStrings(out: Set<string>) {
  for (const source of Object.values(MOCK_HANDLER_SOURCES)) {
    for (const match of source.matchAll(/'([^'\n]+)'/g)) {
      if (VI_CHARS.test(match[1])) out.add(match[1])
    }
  }
}
const SEED_STRINGS = (() => {
  // Text this test types into the form itself.
  const set = new Set<string>(['KCN Long Hậu', 'Đơn kiểm thử'])
  collectSeedStrings(customerSeed, set)
  collectHandlerStrings(set)
  return [...set].sort((x, y) => y.length - x.length)
})()

function stripSeed(text: string): string {
  let out = text
  for (const seed of SEED_STRINGS) out = out.split(seed).join('')
  return out
}

/** Every visible text node and text-bearing attribute of the document. */
function visibleStrings(): string[] {
  const out: string[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim()
    if (text) out.push(text)
  }
  document.querySelectorAll('*').forEach((el) => {
    for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
      const v = el.getAttribute(attr)
      if (v) out.push(`[${attr}] ${v}`)
    }
  })
  return out
}

/** Text left over after removing seed data that still has diacritics. */
function viLines(): string[] {
  return visibleStrings()
    .map(stripSeed)
    .filter((text) => VI_CHARS.test(text))
    .map((text) => text.trim().slice(0, 140))
}

async function settled() {
  await waitFor(() => {
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })
  await new Promise((resolve) => setTimeout(resolve, 30))
  await waitFor(() => {
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })
}

beforeEach(() => {
  resetMockDb()
  localStorage.clear()
  setLanguage('vi')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})
afterEach(() => {
  cleanup()
  resetMockDb()
  localStorage.clear()
  setLanguage('vi')
  vi.unstubAllGlobals()
})

type Route = { name: string; hash: string; vi: string; en: string }

const ROUTES: Route[] = [
  { name: 'Dashboard', hash: '#portal/customer', vi: 'Đơn hàng gần đây', en: 'Recent orders' },
  { name: 'Orders', hash: '#portal/customer/orders', vi: 'Đơn của tôi', en: 'My orders' },
  {
    name: 'OrderDetail',
    hash: '#portal/customer/orders/cus-ord-003',
    vi: 'Thông tin đơn hàng',
    en: 'Order information',
  },
  {
    name: 'CreateOrder',
    hash: '#portal/customer/orders/new',
    vi: 'Địa chỉ/khu vực',
    en: 'Address/area',
  },
  {
    name: 'Analysis',
    hash: '#portal/customer/orders/cus-ord-002/analysis',
    vi: 'Phân tích AI',
    en: 'AI analysis',
  },
  {
    name: 'Live',
    hash: '#portal/customer/orders/cus-ord-001/live',
    vi: 'Giám sát trực tiếp',
    en: 'Live monitoring',
  },
  { name: 'LiveHub', hash: '#portal/customer/live', vi: 'Xem trực tiếp', en: 'Live view' },
  {
    name: 'Media (order)',
    hash: '#portal/customer/orders/cus-ord-006/media',
    vi: 'Kết quả của đơn hàng',
    en: 'Order results',
  },
  {
    name: 'MediaLibrary',
    hash: '#portal/customer/media',
    vi: 'Thư viện kết quả',
    en: 'Result library',
  },
  {
    name: 'MissionHistory',
    hash: '#portal/customer/mission-history',
    vi: 'Lịch sử mission',
    en: 'Mission history',
  },
  {
    name: 'MissionHistoryDetail',
    hash: '#portal/customer/mission-history/msn-006-1',
    vi: 'Thông tin lần bay',
    en: 'Mission information',
  },
  {
    name: 'Notifications',
    hash: '#portal/customer/notifications',
    vi: 'Thông báo',
    en: 'Notifications',
  },
  { name: 'NotFound', hash: '#portal/customer/nope', vi: 'Không tìm thấy', en: 'Not found' },
]

/** Common English UI words that must not show up when the language is Vietnamese. */
const EN_UI_WORDS =
  /\b(the|and|your|please|loading|failed|retry|cancel|submit|error|view|details|back|next|previous|save|search|filter|status|order|orders|mission|missions|results|overview)\b/i
/** Product terms and data that legitimately stay in English inside Vietnamese copy. */
const EN_ALLOWED = ['mission', 'Mission', 'order', 'Order', 'Hue']

function enLines(): string[] {
  return visibleStrings()
    .map(stripSeed)
    .map((text) => EN_ALLOWED.reduce((acc, word) => acc.split(word).join(''), text))
    .filter((text) => !VI_CHARS.test(text) && EN_UI_WORDS.test(text))
    .map((text) => text.trim().slice(0, 140))
}

describe('Customer portal i18n (vi -> en)', () => {
  it.each(ROUTES)('$name has no Vietnamese left after switching to English', async (route) => {
    window.location.hash = route.hash
    render(<CustomerApp />)
    // Reverse check: in Vietnamese the main labels are Vietnamese.
    expect((await screen.findAllByText(route.vi, { exact: false })).length).toBeGreaterThan(0)
    await settled()

    act(() => setLanguage('en'))
    expect((await screen.findAllByText(route.en, { exact: false })).length).toBeGreaterThan(0)
    await settled()

    expect(viLines()).toEqual([])
  })

  it.each(ROUTES.filter((r) => r.name !== 'NotFound'))(
    '$name shows no English UI words in Vietnamese',
    async (route) => {
      window.location.hash = route.hash
      render(<CustomerApp />)
      expect((await screen.findAllByText(route.vi, { exact: false })).length).toBeGreaterThan(0)
      await settled()
      expect(enLines()).toEqual([])
    },
  )

  it('error states are localized', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockRejectedValue(new Error('boom'))
    window.location.hash = '#portal/customer/orders'
    render(<CustomerApp />)
    await screen.findAllByText('Đơn của tôi')
    await settled()
    act(() => setLanguage('en'))
    await screen.findAllByText('My orders')
    await settled()
    expect(viLines()).toEqual([])
  })

  it('CustomerApp shell (sidebar, chatbot) is English', async () => {
    window.location.hash = '#portal/customer'
    render(<CustomerApp />)
    await settled()
    act(() => setLanguage('en'))
    await settled()
    const chatbotToggle = document.querySelector('.odm-chatbot-fab, [class*="chatbot"] button')
    if (chatbotToggle) fireEvent.click(chatbotToggle)
    expect(viLines()).toEqual([])
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0)
  })

  it('CreateOrder wizard: every step is English', async () => {
    window.location.hash = '#portal/customer/orders/new'
    render(<CustomerApp />)
    act(() => setLanguage('en'))
    fireEvent.change(await screen.findByLabelText(/Address\/area/), {
      target: { value: 'KCN Long Hậu' },
    })
    await settled()
    expect(viLines()).toEqual([])

    // Validation errors on the first step.
    fireEvent.change(screen.getByLabelText(/Address\/area/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    await settled()
    expect(viLines()).toEqual([])

    fireEvent.change(screen.getByLabelText(/Address\/area/), {
      target: { value: 'KCN Long Hậu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    await screen.findByRole('button', { name: /Giám sát công trình/ })

    // Step 2 validation errors, then a valid service and title.
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    await settled()
    expect(viLines()).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: /Giám sát công trình/ }))
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Đơn kiểm thử' } })
    await settled()
    expect(viLines()).toEqual([])

    // Step 3 (schedule and deliverables).
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    const deliverable = (await screen.findByLabelText(/Deliverable type/)) as HTMLSelectElement
    await waitFor(() => expect(deliverable.value).not.toBe(''))
    await settled()
    expect(viLines()).toEqual([])

    // Step 4 (review) and the confirm dialog.
    fireEvent.click(screen.getByRole('button', { name: /^Continue:/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Submit request' }))
    await screen.findByRole('dialog')
    await settled()
    expect(viLines()).toEqual([])
  })

  it('CustomerCreateRequest (PortalLayout) is English', async () => {
    render(<CustomerCreateRequestPage />)
    expect(await screen.findByText('Tạo yêu cầu giám sát')).toBeInTheDocument()
    await settled()
    act(() => setLanguage('en'))
    expect(await screen.findByText('Create Monitoring Request')).toBeInTheDocument()
    await settled()
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))
    await settled()
    expect(viLines()).toEqual([])
  })
})

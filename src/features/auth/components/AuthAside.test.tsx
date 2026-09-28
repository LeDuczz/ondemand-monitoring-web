import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { AuthAside } from './AuthAside'

describe('AuthAside', () => {
  it('renders the aside with an accessible label', () => {
    render(<AuthAside />)
    expect(
      screen.getByRole('complementary', {
        name: 'OnDemand Monitor - dịch vụ giám sát bằng drone theo yêu cầu',
      }),
    ).toBeInTheDocument()
  })

  it('renders the brand name and subtitle', () => {
    render(<AuthAside />)
    expect(screen.getByText('OnDemand Monitor')).toBeInTheDocument()
    expect(
      screen.getByText('Dịch vụ giám sát bằng drone theo yêu cầu'),
    ).toBeInTheDocument()
  })

  it('renders the 3 value props as real, readable text', () => {
    render(<AuthAside />)
    expect(
      screen.getByText('Chọn vị trí và bán kính giám sát ngay trên bản đồ'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'AI kiểm tra tính khả thi, gợi ý ngày thay thế trước khi gửi duyệt',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Xem trực tiếp khi drone bay và nhận ảnh, video đã xác thực',
      ),
    ).toBeInTheDocument()
  })

  it('renders English text when language is switched', () => {
    render(<AuthAside />)
    act(() => setLanguage('en'))
    expect(
      screen.getByRole('complementary', {
        name: 'OnDemand Monitor - on-demand drone monitoring service',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('On-demand drone monitoring service'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Pick a location and monitoring radius right on the map',
      ),
    ).toBeInTheDocument()
  })
})

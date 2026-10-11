import { act, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import type { FlightAreaAssessment, FlightAreaRiskLevel } from '../../../api/customerApi'
import { FlightAreaAssessmentCard } from '../components/FlightAreaAssessmentCard'
import type { FlightAreaAssessmentState } from '../hooks/useFlightAreaAssessment'

const DISCLAIMER =
  'Đánh giá sơ bộ. Điều kiện bay cuối cùng được xác nhận trong quá trình lập kế hoạch và pre-flight.'

function data(overrides: Partial<FlightAreaAssessment> = {}, level: FlightAreaRiskLevel = 'FAVORABLE'): FlightAreaAssessment {
  return {
    location: { latitude: 10.6398245, longitude: 106.7172615, radiusMeters: 300 },
    elevation: {
      available: true,
      terrainElevationMeters: 18.2,
      reference: 'AMSL',
      requestedAltitudeAglMeters: 60,
      estimatedFlightAltitudeAmslMeters: 78.2,
      provider: 'Open-Meteo',
    },
    restrictedZones: {
      dataAvailable: true,
      pointInsideRestrictedZone: false,
      monitoringAreaIntersectsRestrictedZone: false,
      nearestRestrictedZoneDistanceMeters: 850,
      affectedZones: [],
    },
    osmContext: {
      available: true,
      queryRadiusMeters: 300,
      buildingCount: 34,
      towerCount: 1,
      mastCount: 0,
      powerTowerCount: 2,
      aerodromeNearby: false,
      helipadNearby: false,
      importantFeatures: [],
    },
    assessment: { level, findings: [], disclaimer: DISCLAIMER },
    ...overrides,
  }
}

function state(value: Partial<FlightAreaAssessmentState>): FlightAreaAssessmentState {
  return { status: 'ready', data: null, retry: vi.fn(), ...value }
}

beforeEach(() => act(() => setLanguage('vi')))
afterEach(() => vi.restoreAllMocks())

describe('FlightAreaAssessmentCard', () => {
  it('shows terrain, requested and estimated altitude with their references', () => {
    render(<FlightAreaAssessmentCard state={state({ data: data() })} requestedAltitudeAglM={60} />)

    expect(screen.getByText('Độ cao địa hình').nextSibling).toHaveTextContent('18 m AMSL')
    expect(screen.getByText('Độ cao mong muốn').nextSibling).toHaveTextContent('60 m AGL')
    expect(screen.getByText('Cao độ bay ước tính').nextSibling).toHaveTextContent('78 m AMSL')
  })

  it('shows zones and nearby structures', () => {
    render(<FlightAreaAssessmentCard state={state({ data: data() })} requestedAltitudeAglM={60} />)

    expect(screen.getByText('Vùng hạn chế').nextSibling).toHaveTextContent('Không phát hiện')
    expect(screen.getByText('Vùng hạn chế gần nhất').nextSibling).toHaveTextContent('850 m')
    expect(screen.getByText('Công trình').nextSibling).toHaveTextContent('34')
    expect(screen.getByText('Tháp / cột').nextSibling).toHaveTextContent('3')
    expect(screen.getByText('Sân bay gần khu vực').nextSibling).toHaveTextContent('Không')
  })

  it.each([
    ['FAVORABLE', 'Thuận lợi'],
    ['NEEDS_REVIEW', 'Cần kiểm tra'],
    ['HIGH_RISK', 'Rủi ro cao'],
  ] as const)('labels %s as "%s" and never as safe', (level, label) => {
    const { container } = render(
      <FlightAreaAssessmentCard state={state({ data: data({}, level) })} requestedAltitudeAglM={60} />,
    )

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.textContent?.toLowerCase()).not.toMatch(/an toàn|\bsafe\b/)
  })

  it('always shows the preliminary-assessment disclaimer', () => {
    render(<FlightAreaAssessmentCard state={state({ data: data() })} requestedAltitudeAglM={60} />)

    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
  })

  it('lists the most severe findings first', () => {
    const findings = [
      { code: 'BUILDINGS_PRESENT', severity: 'INFO' as const, message: 'Có 34 công trình.' },
      { code: 'RESTRICTED_ZONE_INTERSECTION', severity: 'HIGH' as const, message: 'Vùng giám sát giao với khu vực hạn chế ZONE-003.' },
      { code: 'AERODROME_NEARBY', severity: 'WARNING' as const, message: 'Phát hiện sân bay.' },
    ]
    render(
      <FlightAreaAssessmentCard
        state={state({ data: data({ assessment: { level: 'HIGH_RISK', findings, disclaimer: DISCLAIMER } }, 'HIGH_RISK') })}
        requestedAltitudeAglM={60}
      />,
    )

    const items = within(screen.getByText('Cảnh báo và ghi chú').parentElement as HTMLElement).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('ZONE-003'),
      expect.stringContaining('sân bay'),
      expect.stringContaining('34 công trình'),
    ])
  })

  it('says "no data" instead of inventing values when sources are unavailable', () => {
    render(
      <FlightAreaAssessmentCard
        state={state({
          data: data({
            elevation: { available: false, errorCode: 'PROVIDER_UNAVAILABLE' },
            osmContext: {
              available: false,
              errorCode: 'PROVIDER_TIMEOUT',
              buildingCount: 0,
              towerCount: 0,
              mastCount: 0,
              powerTowerCount: 0,
              aerodromeNearby: false,
              helipadNearby: false,
              importantFeatures: [],
            },
          }, 'NEEDS_REVIEW'),
        })}
        requestedAltitudeAglM={60}
      />,
    )

    expect(screen.getByText('Độ cao địa hình').nextSibling).toHaveTextContent('Không có dữ liệu')
    expect(screen.getByText('Cao độ bay ước tính').nextSibling).toHaveTextContent('Không có dữ liệu')
    expect(screen.getByText('Công trình').nextSibling).toHaveTextContent('Không có dữ liệu')
    expect(screen.getByText('Sân bay gần khu vực').nextSibling).toHaveTextContent('Không có dữ liệu')
  })

  it('reports an intersecting restricted zone plainly', () => {
    render(
      <FlightAreaAssessmentCard
        state={state({
          data: data({
            restrictedZones: {
              dataAvailable: true,
              pointInsideRestrictedZone: false,
              monitoringAreaIntersectsRestrictedZone: true,
              nearestRestrictedZoneDistanceMeters: 0,
              affectedZones: [],
            },
          }, 'HIGH_RISK'),
        })}
        requestedAltitudeAglM={60}
      />,
    )

    expect(screen.getByText('Vùng hạn chế').nextSibling).toHaveTextContent('Vùng giám sát giao vùng hạn chế')
  })

  it('shows a skeleton on the first load and a prompt when there is no valid point', () => {
    const { rerender } = render(
      <FlightAreaAssessmentCard state={state({ status: 'loading' })} requestedAltitudeAglM={60} />,
    )
    expect(screen.getByRole('status', { name: 'Đang đánh giá khu vực…' })).toBeInTheDocument()

    rerender(<FlightAreaAssessmentCard state={state({ status: 'idle' })} requestedAltitudeAglM={60} />)
    expect(screen.getByText(/Chọn một điểm hợp lệ/)).toBeInTheDocument()
  })

  it('keeps showing the last result while refreshing', () => {
    render(
      <FlightAreaAssessmentCard state={state({ status: 'loading', data: data() })} requestedAltitudeAglM={60} />,
    )

    expect(screen.getByText('Thuận lợi')).toBeInTheDocument()
    expect(screen.getByText('Đang cập nhật…')).toBeInTheDocument()
  })

  it('offers a retry after a failure', () => {
    const retry = vi.fn()
    render(<FlightAreaAssessmentCard state={state({ status: 'error', retry })} requestedAltitudeAglM={60} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải đánh giá khu vực bay.')
    screen.getByRole('button', { name: 'Thử lại' }).click()
    expect(retry).toHaveBeenCalledOnce()
  })
})

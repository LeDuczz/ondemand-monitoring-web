// Offline mock for `GET /api/flight-area-assessment` (ApiResponse envelope, same DTO as the BE).
// It deliberately fabricates no measurement: with no backend there is no terrain, zone or
// OpenStreetMap data, so every source answers "unavailable" and the level is NEEDS_REVIEW.
import type { FlightAreaAssessment } from '../../features/customer/api/customerApi'
import { fail, isRealApiRoute, ok, passThrough, registerMockRoutes } from '../mockServer'

const DISCLAIMER =
  'Đánh giá sơ bộ. Điều kiện bay cuối cùng được xác nhận trong quá trình lập kế hoạch và pre-flight.'

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/flight-area-assessment',
    handler: ({ query }) => {
      // Hybrid mode (VITE_REAL_API_ROUTES) or an E2E interceptor: let the request leave the mock.
      if (isRealApiRoute('GET', '/api/flight-area-assessment')) return passThrough()
      const latitude = Number(query.get('latitude'))
      const longitude = Number(query.get('longitude'))
      const radiusMeters = Number(query.get('radiusMeters'))
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
        return fail(400, 'INVALID_REQUEST', 'latitude is out of range')
      }
      if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
        return fail(400, 'INVALID_REQUEST', 'longitude is out of range')
      }
      if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
        return fail(400, 'INVALID_REQUEST', 'radiusMeters must be greater than 0')
      }
      const altitude = Number(query.get('requestedAltitudeAgl'))
      const assessment: FlightAreaAssessment = {
        location: { latitude, longitude, radiusMeters },
        elevation: {
          available: false,
          reference: 'AMSL',
          requestedAltitudeAglMeters: Number.isFinite(altitude) && altitude > 0 ? altitude : null,
          errorCode: 'MOCK_MODE',
        },
        restrictedZones: {
          dataAvailable: false,
          pointInsideRestrictedZone: false,
          monitoringAreaIntersectsRestrictedZone: false,
          affectedZones: [],
        },
        osmContext: {
          available: false,
          errorCode: 'MOCK_MODE',
          buildingCount: 0,
          towerCount: 0,
          mastCount: 0,
          powerTowerCount: 0,
          aerodromeNearby: false,
          helipadNearby: false,
          importantFeatures: [],
        },
        assessment: {
          level: 'NEEDS_REVIEW',
          findings: [
            {
              code: 'MOCK_MODE',
              severity: 'INFO',
              message: 'Chế độ mock: không có dữ liệu thật về địa hình, vùng hạn chế hay khu vực xung quanh.',
            },
          ],
          disclaimer: DISCLAIMER,
        },
      }
      return ok(assessment)
    },
  },
])

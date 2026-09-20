# Drone Operator Portal — Change Log (OPR-01 → OPR-09)

**Branch:** `feat/drone-operator-flow`  
**Base:** merged from `feat/mock-api-foundation` (mock API infrastructure)  
**Date:** 2026-09-20

---

## Summary

Full implementation of the Drone Operator Portal (OPR-01 through OPR-09) for OMSS. All UI is in Vietnamese. InFlightControl and SimulationZones were kept untouched.

---

## New Files

### Mock data (`src/mocks/data/`)
| File | Description |
|------|-------------|
| `operator-missions.json` | 8 missions (2 pending, 2 upcoming, 2 completed, 1 in-flight, 1 cancelled) + operator profile + GCS devices |
| `operator-availability.json` | Week 39 slot data (AVAILABLE/BUSY/OFF) + mission overlays for 3 missions |
| `operator-media.json` | 20 media files for MSN-2609-0142-1 (16 JPG + 4 MP4, mixed statuses) |

### Mock handlers (`src/mocks/handlers/`)
| File | Routes | Tests |
|------|--------|-------|
| `operatorMissions.ts` | GET /profile, GET /missions, GET /missions/:id, POST /accept, POST /reject | 7 tests |
| `operatorAvailability.ts` | GET /availability, PUT /availability | 5 tests |
| `operatorFlight.ts` | POST /connect, /handover, /preflight, /postflight, /maintenance-ticket, GET /media, POST /media/:id/retry | 10 tests |

All 22 handler tests pass.

### API module
- `src/features/drone-operator/api/operatorApi.ts` — typed wrappers around apiRequest for all operator endpoints

### New screen components
| File | Screen | Notes |
|------|--------|-------|
| `screens/AvailabilityPage.tsx` | OPR-03 | Weekly grid, drag-select, mission overlays |
| `screens/PreflightChecklist.tsx` | OPR-06 | 9 items, 2 groups, PASS/FAIL summary |

### New shared components
| File | Used in |
|------|---------|
| `components/MissionCard.tsx` | OPR-01 MissionList |
| `components/RejectDialog.tsx` | OPR-02 MissionDetail |
| `components/PreflightItem.tsx` | OPR-06 PreflightChecklist, OPR-09 PostflightCheck |
| `components/MaintenanceTicketDialog.tsx` | OPR-09 PostflightCheck |

---

## Modified Files

### `src/features/drone-operator/omss/types.ts`
Added types: `AvailabilityStatus`, `AvailabilitySlot`, `MissionOverlay`, `GCSDevice`, `FlightConnection`, `MediaFileStatus`, `MediaFile`, `MaintenanceFaultType`, `OperatorProfile`, `OperatorMission`.  
Added to `Screen` union: `'availability'`.  
Added to `NavId` union: `'availability'`.

### `src/features/drone-operator/omss/screens/MissionList.tsx`
**Rewrite** (OPR-01): 3 tabs with badge counts, Vietnamese breadcrumb + cert warning, MissionCard cards, empty/loading/error states.

### `src/features/drone-operator/omss/screens/MissionDetail.tsx`
**Rewrite** (OPR-02): 2-column layout, map placeholder with waypoints, info panel with all fields, manager amber notes card, accept/reject footer, RejectDialog integration.

### `src/features/drone-operator/omss/screens/GCSConnection.tsx`
**Rewrite** (OPR-04): stepper, token input, QR button placeholder, GCS radio list, 3-step async status tracker, expired/failed states.

### `src/features/drone-operator/omss/screens/ControlHandover.tsx`
**Rewrite** (OPR-05): drone status strip, 4 safety checkboxes (Vietnamese text), final confirmation checkbox, disabled CTA until all checked, REVOKED warning state.

### `src/features/drone-operator/omss/screens/MediaUpload.tsx`
**Rewrite** (OPR-08): summary strip, file table (20 rows) with progress bars, retry logic (maxAttempts), max-retry warning, offline banner.

### `src/features/drone-operator/omss/screens/PostflightCheck.tsx`
**Rewrite** (OPR-09): 6 items with PreflightItem, fail warning with failed item names, MaintenanceTicketDialog trigger, completed state card.

### `src/features/drone-operator/omss/OperatorWorkspace.tsx`
- Added `AvailabilityPage`, `PreflightChecklist` imports
- Added `opMissions` + `selectedOpMission` state (seeded from JSON)
- New handlers: `handleOpMissionView`, `handleOpAccept`, `handleOpReject`
- Updated `handleNavChange` for `'availability'`
- Routes new screens via `selectedOpMission` guard; legacy screens still accessible via demo bar
- `activeMission` bridge converts legacy `Mission` → `OperatorMission` for new screens

### `src/features/drone-operator/omss/components/Sidebar.tsx`
- Added `CalendarIcon` SVG icon
- Added `{ id: 'availability', label: 'Lịch rảnh', screen: 'availability', icon: <CalendarIcon /> }` to OPERATOR_NAV
- Renamed "My missions" → "Mission của tôi"

### `src/mocks/index.ts`
Added 3 import lines for new handler modules.

---

## Kept Untouched
- `screens/InFlightControl.tsx` (2106 lines, OPR-07)
- `screens/SimulationZones.tsx`
- `screens/AcceptReject.tsx` (legacy, still reachable via demo bar)
- All existing tests (107 total, all pass)

---

## Type Safety
- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → 107 tests pass (12 test files)

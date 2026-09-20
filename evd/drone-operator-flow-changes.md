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

---

## Design-system fix (post-review)

The 12 new drone operator files were originally written against the **ODM design
system** (`var(--tx)`, `var(--sf)`, `var(--blue-solid)`, `.odm-btn`, `.odm-input`,
`shared/components/odm/StatusBadge`) — tokens/classes that only exist inside the
`.odm { ... }` scope in `src/styles/odm.css`. `OperatorWorkspace` renders outside
that scope (`<div className={isDark ? 'dark-ws' : ''}>`) and has its own design
system in `src/features/drone-operator/omss/operator.css`, so every new screen
rendered with black default text, invisible borders/backgrounds, and unstyled
buttons/inputs.

Fixed by remapping all 12 files to `operator.css` tokens/classes:
- Token remap: `var(--tx/tx2/tx3)` → `var(--text/-2/-3)`, `var(--bd)` → `var(--border)`,
  `var(--sf/sf2/sf3)` → `var(--surface/-2)`, `var(--blue-solid)` → `var(--blue)`,
  `var(--yellow-solid)` → `var(--amber)`, `var(--red-solid)` → `var(--red)`,
  `var(--green-solid)` → `var(--green)`, `var(--ink)` → `var(--text)`.
- Fixed invalid CSS `'var(--yellow-solid)1a'` in `MissionList.tsx` (cert warning
  banner) → `var(--amber-bg)` background + `var(--amber-border)` border.
- Added `.op-btn` / `.op-btn-primary` / `.op-btn-ghost` / `.op-btn-danger` /
  `.op-input` utility classes to `operator.css`, replacing `.odm-btn`/`.odm-input`
  across all 12 files (RejectDialog's confirm button now uses `op-btn-danger`
  instead of an inline red-background override).
- Created `components/OpBadge.tsx` (tones: gray/blue/green/amber/orange/red,
  driven by `operator.css` tokens) to replace
  `shared/components/odm/StatusBadge` imports in `MissionCard.tsx`,
  `MissionDetail.tsx`, `GCSConnection.tsx`, `MediaUpload.tsx`, and
  `ControlHandover.tsx`; `tone="yellow"` usages switched to `tone="amber"`.
- `operator.css` dark mode (`.dark-ws` selector) left untouched and still
  applies to the new screens since they now consume the same tokens.

Files touched: `screens/MissionList.tsx`, `screens/MissionDetail.tsx`,
`screens/AvailabilityPage.tsx`, `screens/GCSConnection.tsx`,
`screens/ControlHandover.tsx`, `screens/PreflightChecklist.tsx`,
`screens/MediaUpload.tsx`, `screens/PostflightCheck.tsx`,
`components/MissionCard.tsx`, `components/RejectDialog.tsx`,
`components/PreflightItem.tsx`, `components/MaintenanceTicketDialog.tsx`,
`operator.css` (new utilities appended), `components/OpBadge.tsx` (new).

No logic/layout changes — design-system only. Verified:
`grep -rE "var\(--(tx|bd|sf|blue-solid|yellow-solid|red-solid|green-solid)|odm-btn|odm-input|shared/components/odm" screens/ components/` → empty.
`npx tsc --noEmit` → 0 errors. `npx vitest run` → 107 tests pass (12 files),
same count as before the fix.

Note: `AvailabilityPage.tsx` (344 lines) and `GCSConnection.tsx` (263 lines)
were already over the 250-line guideline before this fix; this pass only did
in-place token/class substitution (equal insertions/deletions in `git diff
--stat`), so their line counts are unchanged. Splitting them was out of scope
since this task is design-system-only and must not change structure.

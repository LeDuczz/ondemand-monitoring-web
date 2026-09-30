// PROPOSED shared constants for the MNG-04 create-mission flow. No numeric
// source in [BE]/[BRIEF]/[TK] gives real altitude-ceiling or flight-plan
// failure thresholds — these are picked deterministic values so the mock
// server (`managerMissions.ts`) and the client warning UI
// (`CreateMissionPage`) agree on the same numbers. Documented as a
// deviation in evd/P5-manager-mission-dispatch.md.
export const SERVICE_MAX_ALTITUDE_M = 120
export const NO_FLY_CEILING_M = 150

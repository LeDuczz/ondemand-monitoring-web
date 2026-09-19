// Domain enum types, copied verbatim from the backend so the UI never
// invents a status value. Sources:
// [BE] .../order/enums/OrderStatus.java
// [BE] .../mission/enums/MissionStatus.java
// [BE] .../drone/enums/DroneStatus.java
// [BRIEF] evd/design/FA26SE039_Design_Brief.md §A4 (ai_analysis_session,
//   feasibility_rule), §A5 (maintenance_ticket.severity), §A8 (media_asset.media_status)

/** One of the 6 status-colour tones from [BRIEF Phần B]. */
export type StatusTone = 'gray' | 'yellow' | 'blue' | 'green' | 'orange' | 'red'

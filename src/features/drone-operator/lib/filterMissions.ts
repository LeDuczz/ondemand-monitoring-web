import type { OperatorMission, OperatorMissionTab } from '../types/mission'

export function tabOfMission(mission: OperatorMission, _now: Date): OperatorMissionTab {
  if (mission.status === 'PENDING') return 'pending'
  if (mission.status === 'COMPLETED' || mission.status === 'REJECTED') return 'history'
  return 'upcoming'
}

export function missionsByTab(
  missions: OperatorMission[],
  tab: OperatorMissionTab,
  now: Date,
): OperatorMission[] {
  return missions.filter((m) => tabOfMission(m, now) === tab)
}

/** Case/diacritics-insensitive search over mission code, title, location and drone. */
export function filterMissions(
  missions: OperatorMission[],
  query: string,
): OperatorMission[] {
  const q = normalize(query.trim())
  if (!q) return missions
  return missions.filter((m) => {
    const haystack = normalize(
      [m.id, m.title, m.location, m.droneCode ?? '', m.droneName ?? ''].join(' '),
    )
    return haystack.includes(q)
  })
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

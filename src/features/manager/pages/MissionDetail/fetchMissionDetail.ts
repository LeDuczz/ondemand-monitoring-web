import { missionsApi } from '../../api/missionsApi'
import {
  unwrapSettled,
  type DetailData,
} from '../../components/common/missionDetailHelpers'

/** Loads everything the detail page shows; `null` when the mission itself is unusable. */
export async function fetchMissionDetail(
  missionId: string,
  signal: AbortSignal,
): Promise<DetailData | null> {
  const [mission, preflight, postcheck, result, media, weather] =
    await Promise.allSettled([
      missionsApi.getMissionResponse(missionId, signal),
      missionsApi.getCurrentPreflight(missionId, signal),
      missionsApi.getCurrentPostDeviceCheck(missionId, signal),
      missionsApi.getMissionResult(missionId, signal),
      missionsApi.getMissionMedia(missionId, signal),
      missionsApi.getLatestWeatherCheck(missionId, signal),
    ])
  const fullMission = unwrapSettled(mission)
  if (!fullMission || fullMission.id !== missionId) return null
  return {
    mission: fullMission,
    order: null,
    preflight: unwrapSettled(preflight),
    postcheck: unwrapSettled(postcheck),
    result:
      unwrapSettled(result)?.missionId === missionId
        ? unwrapSettled(result)
        : null,
    media: (unwrapSettled(media) ?? []).filter(
      (item) => item.missionId === missionId,
    ),
    weather: unwrapSettled(weather),
  }
}

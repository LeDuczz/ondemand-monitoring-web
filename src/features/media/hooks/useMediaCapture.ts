import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FlightControllerMediaClient } from '../api/flightControllerMediaClient'
import type {
  FlightControllerConnection,
  LocalMedia,
  MediaCommandUpdate,
} from '../types/media'

const createCommandId = () => crypto.randomUUID()

export function useMediaCapture(
  client: FlightControllerMediaClient,
  missionId: string,
  droneId: string,
) {
  const [connection, setConnection] =
    useState<FlightControllerConnection>('DISCONNECTED')
  const [media, setMedia] = useState<LocalMedia[]>([])
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [activeCommand, setActiveCommand] = useState<MediaCommandUpdate>()
  const busyRef = useRef(false)
  const uploadingIdsRef = useRef(new Set<string>())

  const refreshMedia = useCallback(async () => {
    setMedia(await client.listMedia(missionId))
  }, [client, missionId])

  const connect = useCallback(async () => {
    setConnection('CONNECTING')
    try {
      await client.connect()
      setConnection('CONNECTED')
      await refreshMedia()
    } catch {
      setConnection('DISCONNECTED')
    }
  }, [client, refreshMedia])

  useEffect(() => {
    void connect()
    return () => {
      void client.disconnect()
    }
  }, [client, connect])

  useEffect(() => {
    if (!recording) return undefined
    const interval = window.setInterval(
      () => setRecordingSeconds((seconds) => seconds + 1),
      1000,
    )
    return () => window.clearInterval(interval)
  }, [recording])

  const runCommand = useCallback(
    async (action: () => Promise<MediaCommandUpdate>) => {
      if (busyRef.current) return
      busyRef.current = true
      try {
        return await action()
      } finally {
        busyRef.current = false
      }
    },
    [],
  )

  const captureImage = useCallback(async () => {
    const result = await runCommand(() =>
      client.captureImage(createCommandId(), missionId, droneId),
    )
    await refreshMedia()
    return result
  }, [client, droneId, missionId, refreshMedia, runCommand])

  const startVideo = useCallback(async () => {
    const result = await runCommand(() =>
      client.startVideo(createCommandId(), missionId, droneId),
    )
    if (result) {
      setRecording(true)
      setRecordingSeconds(0)
    }
    return result
  }, [client, droneId, missionId, runCommand])

  const stopVideo = useCallback(async () => {
    const result = await runCommand(() =>
      client.stopVideo(createCommandId(), missionId, droneId),
    )
    if (result) {
      setRecording(false)
      setRecordingSeconds(0)
      await refreshMedia()
    }
    return result
  }, [client, droneId, missionId, refreshMedia, runCommand])

  const discard = useCallback(
    async (localMediaId: string) => {
      const result = await runCommand(() =>
        client.discardMedia(createCommandId(), localMediaId),
      )
      await refreshMedia()
      return result
    },
    [client, refreshMedia, runCommand],
  )

  const upload = useCallback(
    async (localMediaId: string) => {
      if (uploadingIdsRef.current.has(localMediaId)) return
      uploadingIdsRef.current.add(localMediaId)
      const commandId = createCommandId()
      try {
        const result = await runCommand(() =>
          client.uploadMedia(commandId, localMediaId),
        )
        if (!result) {
          uploadingIdsRef.current.delete(localMediaId)
          return
        }
        setActiveCommand(result)
        const unsubscribe = client.watchCommand(commandId, (update) => {
          setActiveCommand(update)
          if (update.media)
            setMedia((items) =>
              items.map((item) =>
                item.localMediaId === localMediaId ? update.media! : item,
              ),
            )
          if (update.state === 'SUCCEEDED' || update.state === 'FAILED') {
            unsubscribe()
            uploadingIdsRef.current.delete(localMediaId)
            void refreshMedia()
          }
        })
        return result
      } catch (error) {
        uploadingIdsRef.current.delete(localMediaId)
        throw error
      }
    },
    [client, refreshMedia, runCommand],
  )

  return useMemo(
    () => ({
      connection,
      media,
      recording,
      recordingSeconds,
      activeCommand,
      connect,
      captureImage,
      startVideo,
      stopVideo,
      discard,
      upload,
    }),
    [
      activeCommand,
      captureImage,
      connect,
      connection,
      discard,
      media,
      recording,
      recordingSeconds,
      startVideo,
      stopVideo,
      upload,
    ],
  )
}

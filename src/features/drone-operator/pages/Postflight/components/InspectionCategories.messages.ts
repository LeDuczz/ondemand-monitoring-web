import { defineMessages } from '../../../../../shared/i18n'

export const inspectionCategoriesMessages = defineMessages({
  vi: {
    categories: {
      structure: {
        title: 'Cấu trúc & Khung vỏ',
        items: {
          physical_condition_ok: {
            label: 'Tình trạng vật lý & Khung vỏ',
            detail:
              'Cánh quạt, chân đáp, khung thân, gimbal camera không nứt gãy',
          },
        },
      },
      power: {
        title: 'Hệ thống động lực & Nguồn',
        items: {
          motor_ok: {
            label: 'Động cơ & Esc',
            detail: 'Âm thanh quay đều, không quá nhiệt, không kẹt vật thể',
          },
          battery_ok: {
            label: 'Pin & Tiếp điểm điện',
            detail: 'Không phồng rộp, nhiệt độ an toàn, tiếp điểm sạch',
          },
        },
      },
      sensors: {
        title: 'Cảm biến & Payload',
        items: {
          camera_ok: {
            label: 'Camera & Cảm biến giám sát',
            detail:
              'Ống kính sạch, ghi hình truyền tải ổn định suốt chuyến bay',
          },
        },
      },
      gcs: {
        title: 'Định vị & Liên lạc GCS',
        items: {
          gps_ok: {
            label: 'Hệ thống định vị GPS / RTK',
            detail: 'Khóa vệ tinh chính xác, không mất tọa độ trong chuyến bay',
          },
          communication_ok: {
            label: 'Liên lạc Telemetry & Video Link',
            detail: 'Đường truyền GCS ổn định, không mất kết nối bất thường',
          },
        },
      },
    },
  },
  en: {
    categories: {
      structure: {
        title: 'Structure & Airframe',
        items: {
          physical_condition_ok: {
            label: 'Physical condition & airframe',
            detail:
              'Propellers, landing gear, frame, camera gimbal free of cracks or damage',
          },
        },
      },
      power: {
        title: 'Propulsion & power system',
        items: {
          motor_ok: {
            label: 'Motors & ESCs',
            detail: 'Spins evenly, no overheating, no jammed debris',
          },
          battery_ok: {
            label: 'Battery & electrical contacts',
            detail: 'No swelling, safe temperature, clean contacts',
          },
        },
      },
      sensors: {
        title: 'Sensors & payload',
        items: {
          camera_ok: {
            label: 'Camera & monitoring sensors',
            detail:
              'Clean lens, stable recording and streaming throughout the flight',
          },
        },
      },
      gcs: {
        title: 'Positioning & GCS link',
        items: {
          gps_ok: {
            label: 'GPS / RTK positioning system',
            detail:
              'Accurate satellite lock, no position loss during the flight',
          },
          communication_ok: {
            label: 'Telemetry & video link',
            detail: 'Stable GCS link, no unexpected disconnects',
          },
        },
      },
    },
  },
})

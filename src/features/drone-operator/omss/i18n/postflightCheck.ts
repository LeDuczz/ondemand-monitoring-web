import { defineMessages } from '../../../../shared/i18n'

export const postflightCheckMessages = defineMessages({
  vi: {
    title: 'Kiểm tra sau bay',
    physicalInspectionOf: 'Kiểm tra vật lý',
    savedLandingTelemetry: 'Telemetry hạ cánh đã lưu',
    battery: 'Pin',
    altitude: 'Độ cao',
    speed: 'Tốc độ',
    completed: 'đã hoàn tất',
    categories: {
      airframe: 'Khung thân',
      propulsion: 'Hệ thống động cơ',
      electronics: 'Điện tử',
      data: 'Dữ liệu',
    },
    items: {
      a1: {
        label: 'Độ nguyên vẹn của khung',
        desc: 'Kiểm tra cánh tay, thân, giá đỡ động cơ xem có nứt hoặc hư hại do va chạm',
      },
      a2: {
        label: 'Tình trạng cánh quạt',
        desc: 'Kiểm tra tất cả cánh quạt xem có sứt mẻ, nứt hoặc mòn cạnh trước',
      },
      p1: {
        label: 'Nhiệt độ động cơ',
        desc: 'Tất cả động cơ mát trong ngưỡng bình thường (< 60°C)',
      },
      p2: {
        label: 'Vòng quay động cơ',
        desc: 'Tất cả động cơ quay tự do, không kẹt hay có tiếng nghiến',
      },
      e1: {
        label: 'Bộ pin',
        desc: 'Không phồng, biến dạng, hư hại do nhiệt hoặc có mùi lạ',
      },
      e4: {
        label: 'Pin còn lại',
        desc: 'Xác nhận dữ liệu pin sau bay đã được lưu và vẫn an toàn khi thao tác',
      },
      e2: {
        label: 'Camera và gimbal',
        desc: 'Ống kính sạch, các trục gimbal di chuyển trơn tru, không có ốc vít lỏng',
      },
      e3: {
        label: 'Càng hạ cánh',
        desc: 'Tất cả càng còn nguyên vẹn, không nứt, đệm giảm chấn còn tốt',
      },
      d1: {
        label: 'Dữ liệu bay đã lưu',
        desc: 'Xác nhận nhật ký telemetry và media đã lưu đúng vào bộ nhớ',
      },
    },
    pass: 'Đạt',
    warn: 'Cảnh báo',
    fail: 'Không đạt',
    inspectionNotes: 'Ghi chú kiểm tra (không bắt buộc)',
    notesPlaceholder: 'Mô tả hư hại, hao mòn, hoặc quan sát khác…',
    faultsDetected: 'Phát hiện lỗi — drone cần được đánh dấu để bảo trì.',
    allPassed: 'Tất cả mục đều đạt — có thể hoàn tất nhiệm vụ.',
    reportFault: 'Báo cáo lỗi và đánh dấu bảo trì',
    completeInspection: 'Hoàn tất kiểm tra',
    completeAllItems: (count: number) =>
      `Hoàn tất tất cả ${count} mục để tiếp tục`,
  },
  en: {
    title: 'Post-flight inspection',
    physicalInspectionOf: 'Physical inspection of',
    savedLandingTelemetry: 'Saved landing telemetry',
    battery: 'Battery',
    altitude: 'Altitude',
    speed: 'Speed',
    completed: 'completed',
    categories: {
      airframe: 'Airframe',
      propulsion: 'Propulsion',
      electronics: 'Electronics',
      data: 'Data',
    },
    items: {
      a1: {
        label: 'Frame integrity',
        desc: 'Check arms, body, and motor mounts for cracks or impact damage',
      },
      a2: {
        label: 'Propeller condition',
        desc: 'Inspect all propellers for chips, cracks, or leading-edge wear',
      },
      p1: {
        label: 'Motor temperature',
        desc: 'All motors cool within normal range (< 60°C)',
      },
      p2: {
        label: 'Motor rotation',
        desc: 'All motors spin freely without binding or grinding',
      },
      e1: {
        label: 'Battery pack',
        desc: 'No swelling, deformation, heat damage, or smell',
      },
      e4: {
        label: 'Remaining battery',
        desc: 'Confirm post-flight battery telemetry is saved and still safe for handling',
      },
      e2: {
        label: 'Camera and gimbal',
        desc: 'Lens clear, gimbal axes move smoothly, no loose fasteners',
      },
      e3: {
        label: 'Landing gear',
        desc: 'All struts intact, no cracks, damping pads in good condition',
      },
      d1: {
        label: 'Flight data saved',
        desc: 'Confirm telemetry logs and media saved correctly to storage',
      },
    },
    pass: 'Pass',
    warn: 'Warn',
    fail: 'Fail',
    inspectionNotes: 'Inspection notes (optional)',
    notesPlaceholder: 'Describe any damage, wear, or observations…',
    faultsDetected: 'Faults detected — drone must be flagged for maintenance.',
    allPassed: 'All items passed — mission can be completed.',
    reportFault: 'Report fault and flag for maintenance',
    completeInspection: 'Complete inspection',
    completeAllItems: (count: number) =>
      `Complete all ${count} items to continue`,
  },
})

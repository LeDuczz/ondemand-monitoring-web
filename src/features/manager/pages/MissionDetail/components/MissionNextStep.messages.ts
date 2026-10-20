import { defineMessages } from '../../../../../shared/i18n'

type Step = { tone: 'wait' | 'go' | 'done' | 'bad'; title: string; detail: string }

export const missionNextStepMessages = defineMessages({
  vi: {
    crewProgress: (accepted: number, crew: number) =>
      `${accepted}/${crew} nhân sự đã nhận. Mission sẽ được lên lịch khi tất cả xác nhận.`,
    crewWaiting: 'Mission sẽ được lên lịch khi nhân sự xác nhận.',
    steps: {
      RESOURCE_ASSIGNING: {
        tone: 'go',
        title: 'Cần phân công nguồn lực',
        detail: 'Gán đủ nhân sự và thiết bị để Mission được gửi cho đội bay.',
      },
      WAITING_CREW_CONFIRMATION: {
        tone: 'wait',
        title: 'Đang chờ đội bay xác nhận',
        detail: '',
      },
      WAITING_OPERATOR_ACCEPTANCE: {
        tone: 'wait',
        title: 'Đang chờ đội bay xác nhận',
        detail: '',
      },
      SCHEDULED: {
        tone: 'wait',
        title: 'Đã lên lịch',
        detail: 'Đội bay sẽ kết nối thiết bị và kiểm tra trước chuyến bay.',
      },
      FAILED_PREFLIGHT: {
        tone: 'bad',
        title: 'Không đạt kiểm tra trước bay',
        detail: 'Xem tab Kết quả check, xử lý rồi cho đội bay kiểm tra lại.',
      },
      PENDING_REVIEW: {
        tone: 'go',
        title: 'Chờ duyệt kết quả',
        detail: 'Xem media và checklist rồi duyệt hoặc yêu cầu bổ sung.',
      },
      FAILED: {
        tone: 'bad',
        title: 'Nhiệm vụ thất bại',
        detail: 'Có thể tạo Mission thay thế trong kế hoạch Order.',
      },
      CANCELLED: {
        tone: 'bad',
        title: 'Nhiệm vụ đã hủy',
        detail: 'Có thể tạo Mission thay thế trong kế hoạch Order.',
      },
    } as Record<string, Step>,
  },
  en: {
    crewProgress: (accepted: number, crew: number) =>
      `${accepted}/${crew} crew members accepted. The Mission is scheduled once everyone confirms.`,
    crewWaiting: 'The Mission is scheduled once the crew confirms.',
    steps: {
      RESOURCE_ASSIGNING: {
        tone: 'go',
        title: 'Resources need to be assigned',
        detail:
          'Assign enough staff and a device so the Mission can be sent to the crew.',
      },
      WAITING_CREW_CONFIRMATION: {
        tone: 'wait',
        title: 'Waiting for the crew to confirm',
        detail: '',
      },
      WAITING_OPERATOR_ACCEPTANCE: {
        tone: 'wait',
        title: 'Waiting for the crew to confirm',
        detail: '',
      },
      SCHEDULED: {
        tone: 'wait',
        title: 'Scheduled',
        detail: 'The crew will connect the device and run the preflight checks.',
      },
      FAILED_PREFLIGHT: {
        tone: 'bad',
        title: 'Preflight check failed',
        detail:
          'See the Check results tab, fix the issue and let the crew re-check.',
      },
      PENDING_REVIEW: {
        tone: 'go',
        title: 'Waiting for result review',
        detail: 'Review the media and checklist, then approve or request more.',
      },
      FAILED: {
        tone: 'bad',
        title: 'Mission failed',
        detail: 'You can create a replacement Mission in the Order plan.',
      },
      CANCELLED: {
        tone: 'bad',
        title: 'Mission cancelled',
        detail: 'You can create a replacement Mission in the Order plan.',
      },
    } as Record<string, Step>,
  },
})

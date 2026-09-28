import { defineMessages } from '../../../shared/i18n'

export const liveDispatchPageMessages = defineMessages({
  vi: {
    selectDroneAndOperator: 'Chọn drone và operator trước khi phân công.',
    assignFailed: 'Không phân công được nguồn lực',
    loadingResources: 'Đang tải nguồn lực khả dụng…',
    loadError: 'Không tải được dữ liệu phân công',
    title: 'Phân công nguồn lực',
    missionSummary: (code: string, order: string) =>
      `Mission ${code} · ${order}`,
    backToQueue: 'Về hàng đợi',
    missionHeader: (code: string) => `Mission ${code}`,
    customer: 'Khách hàng',
    location: 'Địa điểm',
    status: 'Trạng thái',
    alreadyAssigned: (drone: string, operator: string) =>
      `Mission đã được gán: drone ${drone}, operator ${operator}.`,
    step1: 'Bước 1 — Chọn drone AVAILABLE',
    chooseDroneAria: 'Chọn drone',
    chooseDroneOption: 'Chọn drone',
    noAvailableDrones: 'Không có drone AVAILABLE.',
    step2: 'Bước 2 — Chọn operator khả dụng',
    chooseOperatorAria: 'Chọn operator',
    chooseOperatorOption: 'Chọn operator',
    noAvailableOperators: 'Không có operator khả dụng.',
    footerHint: 'Backend sẽ kiểm tra pin, đường bay và tính khả thi khi gán.',
    assigning: 'Đang phân công…',
    assign: 'Phân công',
  },
  en: {
    selectDroneAndOperator: 'Choose a drone and an operator before assigning.',
    assignFailed: 'Could not assign the resources',
    loadingResources: 'Loading available resources…',
    loadError: 'Could not load the assignment data',
    title: 'Resource assignment',
    missionSummary: (code: string, order: string) =>
      `Mission ${code} · ${order}`,
    backToQueue: 'Back to queue',
    missionHeader: (code: string) => `Mission ${code}`,
    customer: 'Customer',
    location: 'Location',
    status: 'Status',
    alreadyAssigned: (drone: string, operator: string) =>
      `Mission already assigned: drone ${drone}, operator ${operator}.`,
    step1: 'Step 1 — Choose an AVAILABLE drone',
    chooseDroneAria: 'Choose a drone',
    chooseDroneOption: 'Choose a drone',
    noAvailableDrones: 'No AVAILABLE drones.',
    step2: 'Step 2 — Choose an available operator',
    chooseOperatorAria: 'Choose an operator',
    chooseOperatorOption: 'Choose an operator',
    noAvailableOperators: 'No available operators.',
    footerHint:
      'The backend will check battery, flight path, and feasibility on assignment.',
    assigning: 'Assigning…',
    assign: 'Assign',
  },
})

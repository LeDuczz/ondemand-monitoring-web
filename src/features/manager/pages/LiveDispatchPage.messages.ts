import { defineMessages } from '../../../shared/i18n'

export const liveDispatchPageMessages = defineMessages({
  vi: {
    selectDroneAndOperator: 'Chọn thiết bị và staff trước khi phân công.',
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
      `Mission đã được gán: thiết bị ${drone}, staff ${operator}.`,
    step1: 'Bước 1 — Chọn thiết bị AVAILABLE',
    chooseDroneAria: 'Chọn thiết bị',
    chooseDroneOption: 'Chọn thiết bị',
    noAvailableDrones: 'Không có thiết bị AVAILABLE.',
    step2: 'Bước 2 — Chọn staff khả dụng',
    chooseOperatorAria: 'Chọn staff',
    chooseOperatorOption: 'Chọn staff',
    noAvailableOperators: 'Không có staff khả dụng.',
    footerHint: 'Backend sẽ kiểm tra pin, đường bay và tính khả thi khi gán.',
    assigning: 'Đang phân công…',
    assign: 'Phân công',
  },
  en: {
    selectDroneAndOperator: 'Choose a device and a staff member before assigning.',
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
      `Mission already assigned: device ${drone}, staff ${operator}.`,
    step1: 'Step 1 — Choose an AVAILABLE device',
    chooseDroneAria: 'Choose a device',
    chooseDroneOption: 'Choose a device',
    noAvailableDrones: 'No AVAILABLE devices.',
    step2: 'Step 2 — Choose an available staff member',
    chooseOperatorAria: 'Choose staff',
    chooseOperatorOption: 'Choose staff',
    noAvailableOperators: 'No available staff.',
    footerHint:
      'The backend will check battery, flight path, and feasibility on assignment.',
    assigning: 'Assigning…',
    assign: 'Assign',
  },
})

import { defineMessages } from '../../../../../shared/i18n'

export const stopIntentPanelMessages = defineMessages({
  vi: {
    dungMission: (a0: string | number | null | undefined) =>
      `Dừng Mission ${a0}`,
    confirmMissionCancellation: 'Xác nhận hủy Mission',
    safeStopMission: 'Dừng Mission an toàn',
    closeActionPanel: 'Đóng bảng thao tác',
    checkingStatus: 'Đang kiểm tra trạng thái…',
    missionCoTheDuocHuy:
      'Mission có thể được hủy. Lịch sử đã ghi nhận sẽ được giữ lại.',
    doiBayChiuTrachNhiem:
      'Đội bay chịu trách nhiệm đưa Mission về trạng thái an toàn trước khi tiếp tục hủy.',
    afterCancellingYouCanCreate:
      'Sau khi hủy, bạn có thể tạo Mission thay thế.',
    reasonForStoppingCancellingThe: 'Lý do dừng / hủy Mission',
    noReasonInformationYet: 'Chưa có thông tin lý do.',
    chuaTaiDuocLyDo:
      'Chưa tải được lý do dừng. Làm mới trạng thái trước khi hủy Mission.',
    chuaTheHuyMissionLuc:
      'Chưa thể hủy Mission lúc này. Làm mới trạng thái để kiểm tra lại.',
    moDieuChinhKeHoach:
      'Mở điều chỉnh kế hoạch trước khi tiếp tục hủy Mission.',
    chuaDuDieuKienGiai:
      'Chưa đủ điều kiện giải phóng tài nguyên. Kiểm tra với đội bay và làm mới trạng thái.',
    processing: 'Đang xử lý…',
    requestSafeStop: 'Yêu cầu dừng an toàn',
    releaseResources: 'Giải phóng tài nguyên',
    cancelMission: 'Hủy Mission',
  },
  en: {
    dungMission: (a0: string | number | null | undefined) =>
      `Stop Mission ${a0}`,
    confirmMissionCancellation: 'Confirm Mission cancellation',
    safeStopMission: 'Safe stop Mission',
    closeActionPanel: 'Close action panel',
    checkingStatus: 'Checking status…',
    missionCoTheDuocHuy:
      'The Mission can be cancelled. Recorded history will be kept.',
    doiBayChiuTrachNhiem:
      'The crew is responsible for bringing the Mission to a safe state before cancelling.',
    afterCancellingYouCanCreate:
      'After cancelling, you can create a replacement Mission.',
    reasonForStoppingCancellingThe:
      'Reason for stopping / cancelling the Mission',
    noReasonInformationYet: 'No reason information yet.',
    chuaTaiDuocLyDo:
      'Could not load the stop reason. Refresh the status before cancelling the Mission.',
    chuaTheHuyMissionLuc:
      'The Mission cannot be cancelled right now. Refresh the status to check again.',
    moDieuChinhKeHoach:
      'Open plan adjustment before continuing to cancel the Mission.',
    chuaDuDieuKienGiai:
      'Not eligible to release resources. Check with the crew and refresh the status.',
    processing: 'Processing…',
    requestSafeStop: 'Request safe stop',
    releaseResources: 'Release resources',
    cancelMission: 'Cancel Mission',
  },
})

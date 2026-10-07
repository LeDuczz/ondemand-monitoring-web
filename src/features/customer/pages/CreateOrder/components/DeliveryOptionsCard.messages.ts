import { defineMessages } from '../../../../../shared/i18n'

export const deliveryOptionsCardMessages = defineMessages({
  vi: {
    cardTitle: 'Nhận kết quả & cam kết',
    cardSubtitle: 'Chọn định dạng, cách nhận kết quả và xác nhận điều khoản trước khi gửi.',
    formatsLabel: 'Định dạng kết quả',
    formatsHint: 'Chọn một hoặc nhiều định dạng.',
    formats: {
      PHOTO: 'Ảnh',
      VIDEO: 'Video',
      PDF_REPORT: 'Báo cáo PDF',
      ORTHOMOSAIC: 'Bản đồ ortho',
      MODEL_3D: 'Mô hình 3D',
    },
    methodsLabel: 'Phương thức nhận',
    methods: {
      DOWNLOAD: 'Tải về',
      EMAIL: 'Email',
      API: 'API',
    },
    retentionLabel: 'Thời hạn lưu trữ dữ liệu',
    retentionHint: 'Tính từ khi bàn giao kết quả.',
    days: (n: number) => `${n} ngày`,
    termsHeading: 'Điều khoản và cam kết bảo mật',
    termsLabel: 'Tôi đã đọc và đồng ý với điều khoản sử dụng dịch vụ và cam kết bảo mật dữ liệu.',
    commitmentsToggle: 'Xem nội dung cam kết',
    commitmentUse: 'Dữ liệu giám sát chỉ được dùng để thực hiện và bàn giao yêu cầu này.',
    commitmentRetention: (retentionDays: number) =>
      `Dữ liệu kết quả được lưu trữ ${retentionDays} ngày kể từ khi bàn giao.`,
    commitmentResponsibility:
      'Bạn chịu trách nhiệm về quyền giám sát khu vực đã chọn, kể cả giấy phép bay khi khu vực yêu cầu.',
  },
  en: {
    cardTitle: 'Result delivery & commitments',
    cardSubtitle: 'Choose the formats, how you receive the result, and accept the terms before submitting.',
    formatsLabel: 'Result formats',
    formatsHint: 'Select one or more formats.',
    formats: {
      PHOTO: 'Photos',
      VIDEO: 'Video',
      PDF_REPORT: 'PDF report',
      ORTHOMOSAIC: 'Orthomosaic map',
      MODEL_3D: '3D model',
    },
    methodsLabel: 'Delivery method',
    methods: {
      DOWNLOAD: 'Download',
      EMAIL: 'Email',
      API: 'API',
    },
    retentionLabel: 'Data retention period',
    retentionHint: 'Counted from the day the result is handed over.',
    days: (n: number) => `${n} days`,
    termsHeading: 'Terms and security commitment',
    termsLabel: 'I have read and accept the service terms and the data-security commitment.',
    commitmentsToggle: 'View the commitment',
    commitmentUse: 'Monitoring data is only used to carry out and hand over this request.',
    commitmentRetention: (retentionDays: number) =>
      `Result data is retained for ${retentionDays} days after handover.`,
    commitmentResponsibility:
      'You are responsible for the right to monitor the chosen area, including a flight permit where one is required.',
  },
})

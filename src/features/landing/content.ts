// Static marketing copy for the landing page, copied verbatim from
// evd/design/Landing.dc.html. This is page copy, not API data: it is not
// fetched, so it is not modeled as a mock endpoint per evd/AGENT-RULES.md
// rule 3/5 (mock data is only for resources the app actually fetches).
import type {
  FaqItem,
  FeasibilityCheck,
  FeatureHighlight,
  FooterLinkGroup,
  HeroStat,
  IndustryCard,
  ResultFile,
  WorkflowStep,
} from './types'

export const brandName = 'OnDemand Monitor'

export const heroChip = 'Dịch vụ giám sát bằng drone theo yêu cầu'

export const heroTitleLines = [
  'Giám sát hiện trường bằng drone,',
  'đặt lịch trong vài phút',
]

export const heroLede =
  'Chọn vị trí trên bản đồ, AI kiểm tra tính khả thi, phi công được cấp phép thực hiện. Bạn theo dõi trực tiếp và nhận ảnh, video đã xác thực ngay trên hệ thống.'

export const heroChecklist = [
  'Phi công có giấy phép',
  'Tự động kiểm tra vùng cấm bay',
  'Ảnh và video được xác thực',
]

export const heroAiCard = {
  score: 92,
  label: 'AI kiểm tra khả thi',
  status: 'Có thể bay hôm nay',
}

export const heroMissionCard = {
  code: 'MSN-2609-0142-1',
  status: 'IN_FLIGHT',
  title: 'Khảo sát công trình · Thủ Thiêm, TP.HCM',
  drone: 'DRN-02',
  battery: '78%',
  altitude: 'Độ cao 60 m',
}

export const heroStats: HeroStat[] = [
  { value: '96', label: 'chuyến bay trong tháng 9/2026' },
  { value: '87/96', label: 'mission hoàn thành, 9 mission cần bay lại' },
  { value: '9', label: 'drone trong đội bay' },
  { value: '24/7', label: 'theo dõi trạng thái mission' },
]

export const workflowSection = {
  eyebrow: 'Cách hoạt động',
  title: 'Từ yêu cầu đến kết quả trong bốn bước',
}

export const workflowSteps: WorkflowStep[] = [
  {
    no: '01',
    title: 'Chọn vị trí và thời gian',
    detail:
      'Đánh dấu khu vực trên bản đồ, chọn bán kính, dịch vụ và khung giờ mong muốn.',
    icon: 'map-pin',
  },
  {
    no: '02',
    title: 'AI kiểm tra khả thi',
    detail:
      'Hệ thống rà vùng cấm bay, thời tiết, giấy phép và gợi ý ngày thay thế nếu cần.',
    icon: 'cpu',
  },
  {
    no: '03',
    title: 'Duyệt và phân công',
    detail:
      'Nhân viên điều phối duyệt đơn, chọn drone, phi công và trạm phù hợp nhất.',
    icon: 'users',
  },
  {
    no: '04',
    title: 'Bay, xem trực tiếp, nhận kết quả',
    detail:
      'Xem livestream khi drone bay, sau đó tải ảnh và video đã qua kiểm tra.',
    icon: 'radio',
  },
]

export const aiFeatureSection = {
  eyebrow: 'Tính năng · AI phân tích',
  title: 'Biết trước bay được hay không, trước khi gửi duyệt',
  copy: 'Mỗi yêu cầu được kiểm tra tự động và chấm điểm, để đơn gửi đi ít bị trả lại và không mất thời gian chờ đợi.',
}

export const aiFeatureHighlights: FeatureHighlight[] = [
  {
    title: 'Kiểm tra vùng cấm bay và bán kính',
    detail: 'Đối chiếu vị trí với danh sách vùng cấm bay đang hiệu lực.',
    icon: 'map-pin',
  },
  {
    title: 'Điểm khả thi rõ ràng',
    detail:
      'Mỗi tiêu chí có kết quả PASS, WARNING hoặc BLOCKER để bạn xử lý ngay.',
    icon: 'clipboard',
  },
  {
    title: 'Gợi ý ngày và giờ thay thế',
    detail: 'Đề xuất khung giờ phù hợp khi ngày bạn chọn có rủi ro.',
    icon: 'clock',
  },
]

export const aiResultPanel = {
  title: 'Kết quả phân tích AI',
  verdictLabel: 'RISKY',
  score: 74,
  verdictTitle: 'Khả thi có điều kiện',
  verdictDetail: 'Nên chọn khung giờ sáng để an toàn hơn.',
  altSuggestion: 'Chủ nhật 20/09/2026 · 08:00 – 10:00',
}

export const aiFeasibilityChecks: FeasibilityCheck[] = [
  { label: 'Vùng cấm bay quanh khu vực', result: 'PASS' },
  { label: 'Giấy phép phi công còn hiệu lực', result: 'PASS' },
  { label: 'Gió giật 26 km/h lúc 15:00', result: 'WARNING' },
  { label: 'Drone và pin sẵn sàng', result: 'PASS' },
]

export const liveFeatureSection = {
  eyebrow: 'Tính năng · Giám sát và kết quả',
  title: 'Xem drone bay trực tiếp, nhận media đã xác thực',
  copy: 'Theo dõi vị trí, pin và độ cao theo thời gian thực. Sau chuyến bay, ảnh và video được kiểm tra trước khi giao cho bạn.',
}

export const liveFeatureHighlights: FeatureHighlight[] = [
  {
    title: 'Livestream và bản đồ realtime',
    detail: 'Xem hình ảnh trực tiếp cùng lộ trình và các điểm bay của mission.',
    icon: 'radio',
  },
  {
    title: 'Kiểm tra media trước khi giao',
    detail:
      'Tệp lỗi được xử lý lại, chỉ tệp đạt mới xuất hiện trong thư viện của bạn.',
    icon: 'camera',
  },
  {
    title: 'Thư viện kết quả luôn sẵn sàng',
    detail: 'Tải từng tệp hoặc cả mission, xem lại lịch sử đơn bất cứ lúc nào.',
    icon: 'file-text',
  },
]

export const livePanel = {
  title: 'Theo dõi trực tiếp · MSN-2609-0142-1',
  status: 'LIVE',
  battery: '78%',
  altitude: '60 m',
  resultsTitle: 'Kết quả nhận được',
  fileCount: '20 tệp',
}

export const liveResultFiles: ResultFile[] = [
  { name: 'IMG_0417', status: 'PASS' },
  { name: 'VID_0009', status: 'PASS' },
  { name: 'IMG_0418', status: 'UPLOADING' },
]

export const industriesSection = {
  eyebrow: 'Ứng dụng',
  title: 'Dành cho mọi nhu cầu quan sát từ trên cao',
  copy: 'Một quy trình chung, nhiều loại dịch vụ. Chọn đúng dịch vụ khi tạo yêu cầu.',
}

export const industries: IndustryCard[] = [
  {
    title: 'Công trình xây dựng',
    detail:
      'Theo dõi tiến độ, đo đạc khối lượng và chụp toàn cảnh công trường.',
    location: 'Thủ Thiêm, TP.HCM',
    icon: 'building',
  },
  {
    title: 'Nông nghiệp',
    detail: 'Đánh giá cây trồng và tình trạng đất trên diện tích lớn.',
    location: 'Đắk Lắk',
    icon: 'leaf',
  },
  {
    title: 'Điện và viễn thông',
    detail: 'Kiểm tra trụ, đường dây và trạm ở nơi khó tiếp cận.',
    location: 'Bình Dương',
    icon: 'zap',
  },
  {
    title: 'Giao thông và đô thị',
    detail: 'Quan sát lưu lượng, nút giao và hiện trạng hạ tầng.',
    location: 'Đà Nẵng',
    icon: 'route',
  },
  {
    title: 'Bất động sản',
    detail: 'Ghi hình dự án, mặt bằng và quy hoạch khu đất.',
    location: 'Nhà Bè, TP.HCM',
    icon: 'home',
  },
  {
    title: 'Sự kiện và an ninh',
    detail: 'Giám sát khu vực đông người trong thời gian diễn ra sự kiện.',
    location: 'Hà Nội',
    icon: 'shield',
  },
]

export const faqSection = {
  eyebrow: 'Câu hỏi thường gặp',
  title: 'Giải đáp nhanh',
  copy: 'Cần hỗ trợ thêm? Liên hệ support@odms.vn.',
}

// Only the first question has answer copy in the design markup; the design
// renders the other four collapsed with no answer text at all (see
// FaqItem['answer'] doc comment in ../types/index.ts).
export const faqItems: FaqItem[] = [
  {
    question: 'Tôi cần chuẩn bị gì để tạo một yêu cầu giám sát?',
    answer:
      'Bạn chỉ cần tài khoản khách hàng, vị trí và bán kính trên bản đồ, loại dịch vụ và khung giờ mong muốn. Hệ thống sẽ kiểm tra khả thi ngay khi bạn hoàn tất bước cuối.',
  },
  { question: 'Bao lâu thì đơn được duyệt?' },
  { question: 'Nếu thời tiết xấu thì sao?' },
  { question: 'Tôi có xem được drone bay trực tiếp không?' },
  { question: 'Ảnh và video được giao ở đâu?' },
]

export const ctaSection = {
  eyebrow: 'Sẵn sàng giám sát khu vực của bạn?',
  title: 'Tạo tài khoản và gửi yêu cầu đầu tiên trong vài phút.',
}

export const footerTagline =
  'Dịch vụ giám sát bằng drone theo yêu cầu. Thành phố Hồ Chí Minh, Việt Nam.'

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Sản phẩm',
    links: ['Tạo yêu cầu', 'Theo dõi trực tiếp', 'Thư viện kết quả'],
  },
  {
    title: 'Dịch vụ',
    links: ['Công trình xây dựng', 'Nông nghiệp', 'Hạ tầng và đô thị'],
  },
  {
    title: 'Hỗ trợ',
    links: ['Câu hỏi thường gặp', 'support@odms.vn', 'Chính sách bay an toàn'],
  },
]

export const footerCopyright = '© 2026 OnDemand Monitor. Đồ án FA26SE039.'
export const footerLegal = 'Điều khoản sử dụng · Quyền riêng tư'

export const navLinks = [
  { label: 'Cách hoạt động', href: '#how-it-works' },
  { label: 'Tính năng', href: '#features' },
  { label: 'Ứng dụng', href: '#industries' },
  { label: 'Câu hỏi thường gặp', href: '#faq' },
]

# Mock API

Lớp giả lập backend dùng khi chưa có API thật, hoặc khi API thật chưa xong endpoint đang cần.

## Bật / tắt

Đặt biến môi trường `VITE_USE_MOCK_API` trong `.env` (copy từ `.env.example`):

- `VITE_USE_MOCK_API=true` → luôn dùng mock.
- `VITE_USE_MOCK_API=false` → luôn gọi backend thật (`authenticatedFetch`).
- Không đặt → mặc định bật khi chạy `npm run dev` (dev mode), tắt khi build production.

Xem `src/config/env.ts` (`env.useMockApi`).

## Dữ liệu mẫu ở đâu

- `src/mocks/data/*.json` — một file JSON cho mỗi resource, tên trường camelCase theo DTO backend, 2-space indent. Component không bao giờ import JSON trực tiếp.
- `src/mocks/db.ts` — `createCollection(seedJson)` deep-clone JSON thành state trong bộ nhớ để mock có thể ghi/sửa trong phiên làm việc; `resetMockDb()` khôi phục lại toàn bộ collection về đúng dữ liệu seed (dùng trong test).

## Cách thêm một route mock

1. Thêm/​sửa file JSON dữ liệu trong `src/mocks/data/`.
2. Tạo handler trong `src/mocks/handlers/<feature>.ts`:

   ```ts
   import { createCollection } from '../db'
   import { ok, registerMockRoutes } from '../mockServer'
   import ordersSeed from '../data/orders.json'

   const orders = createCollection(ordersSeed)

   registerMockRoutes([
     {
       method: 'GET',
       path: '/api/orders/:id',
       handler: ({ params }) => {
         const order = orders.find((o) => o.id === params.id)
         if (!order) return fail(404, 'NOT_FOUND', 'Order not found')
         return ok(order)
       },
     },
   ])
   ```

3. Import handler module một lần trong `src/mocks/index.ts` (ví dụ `import './handlers/orders'`).

Route không khớp handler nào sẽ đi thẳng ra `fetch` thật (pass-through), nên có thể mock từng endpoint một mà không chặn các endpoint chưa mock.

## Envelope

Mọi response mock đều đúng format `ApiResponse` của backend: `{ success, code, message, data, errors, timestamp }`. Dùng `ok()`, `created()`, `fail()` trong `mockServer.ts` để dựng envelope, không tự viết tay.

## Hybrid mode: vài route gọi backend thật

Khi `VITE_USE_MOCK_API=true`, có thể cho một số endpoint đã có ở backend đi thẳng tới API thật (kèm token qua `authenticatedFetch`), phần còn lại vẫn dùng mock. Khai báo trong `.env`:

```
VITE_USE_MOCK_API=true
VITE_REAL_API_ROUTES=GET /api/admin/users*,PATCH /api/admin/users/*/status,POST /api/admin/accounts,GET /api/services*,POST /api/services,PUT /api/services/*,DELETE /api/services/*,GET /api/preferred-times*,POST /api/preferred-times,PUT /api/preferred-times/*,DELETE /api/preferred-times/*,GET /api/services/pricing-estimate,GET /api/services/requirement-suggestions,GET /api/service-deliverables*,GET /api/category-services*,GET /api/zones,POST /api/orders,POST /api/customer/consultations,GET /api/customer/consultations/*,POST /api/customer/consultations/*/messages,GET /api/orders/mine,GET /api/orders/*,GET /api/customer/mission-history*,GET /api/orders/*/analysis/latest,GET /api/customer/available-media,GET /api/customer/media-notifications,GET /api/customer/missions/*/media,GET /api/customer/missions/*/media/*,GET /api/customer/missions/*/media-status,GET /api/media/*/download
```

- Danh sách phân tách bằng dấu phẩy, mỗi mục là `METHOD /path`.
- `*` ở giữa khớp đúng một segment (`/api/admin/users/*/status`); `*` ở cuối khớp mọi phần đuôi (`/api/admin/users*` gồm cả `/api/admin/users/123` và query).
- Route không khớp → mock. Bỏ trống → toàn bộ đi mock.
- Logic khớp nằm ở `src/shared/api/realApiRoutes.ts`.
- Các route đã có ở backend thật **không còn handler mock**: khi bật mock mà không liệt kê chúng ở đây, request sẽ rơi ra `fetch` thật. Test của chúng stub tầng API (xem dưới).

## Chỉ mock endpoint backend chưa có

Mock chỉ giữ các endpoint không có trong Swagger của backend. Đã gỡ mock cho: auth `/api/auth/*` và `/api/users/me`, `/api/admin/users*` + `POST /api/admin/accounts`, catalog (`/api/services*`, `/api/preferred-times*`), create-order (`pricing-estimate`, `requirement-suggestions`, `service-deliverables`, `category-services`, `zones`, `POST /api/orders`, consultations), customer orders/mission-history/mission-report/media, `/api/orders*` phía manager (pending, approved, `:id`, analysis, resource-preview, approve, approval), `/api/missions` (list, `:id`, cancel, pending-assignment, `POST /api/orders/:id/missions`), `/api/drones` (list, `:id`, PUT), `/api/maintenance-tickets` (list, resolve), `/api/manager/dashboard`, flight-area-assessment, weather-forecast, operator `permissions` và `media`.

Còn mock (handler trong `src/mocks/handlers/`): `/api/v1/auth/*` (legacy), `/api/admin/dashboard`, `/api/admin/{ai-knowledge,audit-log,config,catalog/stations}*`, `/api/customer/orders/:id/{cancel,analysis/findings/*}`, `PATCH /api/drones/:id/status`, `POST /api/maintenance-tickets`, `/api/maintenance-tickets/:id/{status,assign}`, `GET /api/orders`, `/api/orders/:id/{internal-note,mission-brief,deliver}`, `/api/missions/:id/{schedule,live,incidents,retry,resource-suggestions,assignments/*}`, `/api/operator/*`.

Hệ quả: với `VITE_USE_MOCK_API=true` mà không có backend, đăng nhập (`POST /api/auth/login`), Manager (Dashboard, Orders/Order review, Missions list/detail, Drones, Maintenance), Customer (toàn bộ portal), Admin Accounts/Roles/Catalog dịch vụ/khung giờ không còn dữ liệu mock để render. Dùng backend thật (hoặc `VITE_REAL_API_ROUTES`) cho các màn đó.

## Test các endpoint đã gỡ mock

Test không đi qua mock mà stub tầng API:

- `src/test/stubApi.ts` — `stubApi(routes)` cài transport cho `apiRequest` (ghi lại `calls`, trả envelope `ApiResponse`, `stubError()` cho lỗi), `stubFetch(routes)` cho code gọi `fetch` trực tiếp (auth). `fallback: mockFetch` cho endpoint còn mock.
- `src/features/customer/tests/stubBeApi.ts`, `stubCreateOrderApi.ts` — `vi.spyOn` lên `customerApi` & co.
- Helper theo feature: `admin/pages/Accounts/tests/helpers.ts`, `admin/pages/Catalog/tests/helpers.ts`, `manager/tests/stubMissionsList.ts`.
- Test api-level (`missionsApi`, `ordersApi`, `dronesApi`, `maintenanceApi`, `dashboardApi`) kiểm tra method/url/body gửi đi trên transport đã stub.

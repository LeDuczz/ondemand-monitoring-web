import { defineMessages } from '../../../../../shared/i18n'

export const maintenanceLoadErrorMessages = defineMessages({
  vi: {
    page: {
      loadError: 'Không tải được danh sách ticket',
    },
    getApiMaintenanceTickets: 'GET /api/maintenance-tickets · ',
  },
  en: {
    page: {
      loadError: 'Could not load the ticket list',
    },
    getApiMaintenanceTickets: 'GET /api/maintenance-tickets · ',
  },
})

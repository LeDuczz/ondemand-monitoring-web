import { defineMessages } from '../../../../../shared/i18n'

export const areaMinistryViolationsMessages = defineMessages({
  vi: {
    zoneCodesViolatedPerCambay: 'Mã vùng vi phạm theo cambay.mod.gov.vn',
    openCambayModGovVn: (a0: string | number | null | undefined) =>
      `Mở cambay.mod.gov.vn và sao chép mã ${a0}`,
    viewOnMap: 'Xem trên bản đồ',
  },
  en: {
    zoneCodesViolatedPerCambay: 'Zone codes violated per cambay.mod.gov.vn',
    openCambayModGovVn: (a0: string | number | null | undefined) =>
      `Open cambay.mod.gov.vn and copy code ${a0}`,
    viewOnMap: 'View on map',
  },
})

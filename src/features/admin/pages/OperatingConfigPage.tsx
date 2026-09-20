import { PolicyTable } from '../components/operatingConfig/PolicyTable'
import { WeightsPanel } from '../components/operatingConfig/WeightsPanel'
import { NoFlyZonesTable } from '../components/operatingConfig/NoFlyZonesTable'

export function OperatingConfigPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Cau hinh van hanh</h1>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Tham so van hanh</h2>
        <PolicyTable />
      </section>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Trong so goi y nguon luc</h2>
        <WeightsPanel />
      </section>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Vung cam bay</h2>
        <NoFlyZonesTable />
      </section>
    </div>
  )
}

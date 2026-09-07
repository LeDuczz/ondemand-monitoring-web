import '../styles/global.css'

export function Router() {
  return (
    <main className="app-shell">
      <section className="app-card" aria-labelledby="app-title">
        <span className="eyebrow">On-demand Monitoring</span>
        <h1 id="app-title">Web codebase ready</h1>
        <p>
          Feature modules, API clients and application providers will be added
          here without coupling the web app to backend implementation details.
        </p>
      </section>
    </main>
  )
}

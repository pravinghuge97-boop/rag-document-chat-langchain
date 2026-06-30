import Sidebar from './Sidebar'
import './AppLayout.css'

export default function AppLayout({ children, title, actions }) {
  return (
    <div className="app-layout">
      <div className="bg-mesh" />
      <Sidebar />
      <main className="app-main">
        {(title || actions) && (
          <header className="app-header">
            <div>
              {title && <h1 className="app-header-title">{title}</h1>}
            </div>
            {actions && <div className="app-header-actions">{actions}</div>}
          </header>
        )}
        <div className="app-content">{children}</div>
      </main>
    </div>
  )
}

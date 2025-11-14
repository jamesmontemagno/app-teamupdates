import { NavLink, Route, Routes } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { TimelinePage } from './pages/TimelinePage'

export function App() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="text text--muted">Team Updates</p>
          <h1 className="app-shell__title">Pulseboard</h1>
        </div>
        <nav className="app-shell__nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link')}>
            Timeline
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => (isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link')}>
            Map
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link')}>
            Profile
          </NavLink>
        </nav>
      </header>

      <main className="app-shell__content">
        <Routes>
          <Route path="/" element={<TimelinePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  )
}

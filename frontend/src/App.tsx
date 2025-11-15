import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProfilePage } from './pages/ProfilePage'
import { TeamPage } from './pages/TeamPage'
import { LandingPage } from './pages/LandingPage'
import { TeamBrowserPage } from './pages/TeamBrowserPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { TeamProvider, useTeam } from './contexts/TeamContext'
import { UpdatesProvider } from './contexts/UpdatesContext'
import { Toaster } from './components/Toaster'
import { isMockMode, getUserTeams } from './api'
import styles from './App.module.css'

const USER_ID_KEY = 'teamUpdatesUserId'

function TeamNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { team, teamId } = useTeam()
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string }>>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY)
    if (userId) {
      getUserTeams(userId).then(setUserTeams).catch(console.error)
    }
  }, [])

  const isOnTeamRoute = location.pathname.startsWith('/teams/')

  if (!isOnTeamRoute || !teamId) return null

  return (
    <div className={styles['team-navbar']}>
      <div className={styles['team-dropdown']}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={styles['team-dropdown-button']}
        >
          {team ? team.name : 'Select Team'} ▼
        </button>
        {showDropdown && (
          <div className={styles['team-dropdown-menu']}>
            {userTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  navigate(`/teams/${t.id}/timeline`)
                  setShowDropdown(false)
                }}
                className={styles['team-dropdown-item']}
              >
                {t.name}
              </button>
            ))}
            <div className={styles['team-dropdown-divider']} />
            <button
              onClick={() => {
                navigate('/teams')
                setShowDropdown(false)
              }}
              className={styles['team-dropdown-item']}
            >
              Browse Teams
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AppNavigation() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `${styles['app-shell__link']} ${styles['app-shell__link--active']}`
      : styles['app-shell__link']

  const hasProfile = localStorage.getItem(USER_ID_KEY)

  return (
    <nav className={styles['app-shell__nav']}>
      <NavLink to="/" end className={navLinkClassName}>
        Home
      </NavLink>
      <NavLink to="/teams" className={navLinkClassName}>
        Teams
      </NavLink>
      {hasProfile && (
        <NavLink to="/profile/edit" className={navLinkClassName}>
          Profile
        </NavLink>
      )}
      <button onClick={toggleTheme} className={styles['theme-toggle']} aria-label="Toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  )
}

function AppShell() {
  const location = useLocation()
  const isOnTeamRoute = location.pathname.startsWith('/teams/')

  return (
    <>
      <Toaster />
      <div className={styles['app-shell']}>
        <header className={styles['app-shell__header']}>
          <div className={styles['app-shell__branding']}>
            <p className="text text--muted">Team Updates</p>
            <h1 className={styles['app-shell__title']}>✨ Pulseboard</h1>
          </div>
          <AppNavigation />
        </header>

        <TeamNavbar />

        <main className={styles['app-shell__content']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/teams" element={<TeamBrowserPage />} />
            <Route path="/profile/new" element={<ProfileSetupPage />} />
            <Route path="/profile/edit" element={<ProfilePage />} />
            <Route path="/teams/:teamId" element={
              <UpdatesProvider>
                <TeamPage />
              </UpdatesProvider>
            } />
          </Routes>
        </main>

        {isMockMode() && (
          <div className={styles['mock-mode-banner']}>
            🔧 Mock Mode - Using Sample Data
            <a href="/teams" className={styles['mock-mode-link']}>Skip to Teams</a>
          </div>
        )}
      </div>
    </>
  )
}

export function App() {
  return (
    <TeamProvider>
      <AppShell />
    </TeamProvider>
  )
}
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { TimelinePage } from './pages/TimelinePage'
import { LandingPage } from './pages/LandingPage'
import { TeamBrowserPage } from './pages/TeamBrowserPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { TeamProvider, useTeam } from './contexts/TeamContext'
import { isNewUser, markUserOnboarded } from './contexts/UserProfileContext'
import { Toaster } from './components/Toaster'
import { isMockMode, getUserTeams } from './api'
import styles from './App.module.css'

const USER_ID_KEY = 'teamUpdatesUserId'

function TeamNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { team } = useTeam()
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string }>>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY)
    if (userId) {
      getUserTeams(userId).then(setUserTeams).catch(console.error)
    }
  }, [])

  const isOnTeamRoute = location.pathname.startsWith('/teams/')

  if (!isOnTeamRoute) return null

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

export function App() {
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(() => isNewUser())
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

  const handleGetStarted = () => {
    markUserOnboarded()
    setShowWelcome(false)
    navigate('/profile')
  }

  const handleSkip = () => {
    markUserOnboarded()
    setShowWelcome(false)
  }

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `${styles['app-shell__link']} ${styles['app-shell__link--active']}`
      : styles['app-shell__link']

  const location = useLocation()
  const isOnTeamRoute = location.pathname.startsWith('/teams/')

  return (
    <>
      <Toaster />
      {showWelcome && (
        <div className="modal-overlay" onClick={handleSkip}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Welcome to Pulseboard! ✨</h2>
            <p className="modal-text">
              Stay connected with your team by sharing updates, wins, and blockers.
            </p>
            <p className="modal-text">
              Before you get started, let's set up your profile so your team knows who you are.
            </p>
            <div className="modal-actions">
              <button className="button button--primary" onClick={handleGetStarted}>
                Set Up Profile
              </button>
              <button className="button button--soft" onClick={handleSkip}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles['app-shell']}>
        <header className={styles['app-shell__header']}>
          <div className={styles['app-shell__branding']}>
            <p className="text text--muted">Team Updates</p>
            <h1 className={styles['app-shell__title']}>✨ Pulseboard</h1>
          </div>
          <nav className={styles['app-shell__nav']}>
            {!isOnTeamRoute && (
              <>
                <NavLink to="/" end className={navLinkClassName}>
                  Home
                </NavLink>
                <NavLink to="/teams" className={navLinkClassName}>
                  Teams
                </NavLink>
              </>
            )}
            {isOnTeamRoute && (
              <>
                <NavLink to="timeline" end className={navLinkClassName}>
                  Timeline
                </NavLink>
                <NavLink to="map" className={navLinkClassName}>
                  Map
                </NavLink>
                <NavLink to="profile" className={navLinkClassName}>
                  Profile
                </NavLink>
              </>
            )}
            <button onClick={toggleTheme} className={styles['theme-toggle']} aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </header>

        <TeamNavbar />

        {isMockMode() && (
          <div className={styles['mock-mode-banner']}>
            🔧 Mock Mode - Using Sample Data
            <a href="/teams" className={styles['mock-mode-link']}>Skip to Teams</a>
          </div>
        )}

        <main className={styles['app-shell__content']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/teams" element={<TeamBrowserPage />} />
            <Route path="/profile/new" element={<ProfileSetupPage />} />
            <Route path="/teams/:teamId/*" element={
              <TeamProvider>
                <Routes>
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Routes>
              </TeamProvider>
            } />
          </Routes>
        </main>
      </div>
    </>
  )
}

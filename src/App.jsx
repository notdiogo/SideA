import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'
import { useCollection } from './hooks/useCollection'
import AppShell from './components/layout/AppShell'
import CoverFlight from './components/layout/CoverFlight'
import AmbientField from './components/layout/AmbientField'
import { NavTypeContext, backNav } from './components/layout/PageTransition'
import { getFlight } from './lib/coverFlight'
import Wall from './pages/Wall'
import AddRecord from './pages/AddRecord'
import AlbumDetail from './pages/AlbumDetail'
import Lyrics from './pages/Lyrics'
import Profile from './pages/Profile'

const TAB_PATHS = ['/', '/add', '/profile']
const depth = (p) => TAB_PATHS.includes(p) ? 0 : (/\/track\//.test(p) || p.endsWith('/edit')) ? 2 : 1

// +1: moving "forward" (deeper, or a tab to the right), -1: back, 0: no slide
// (a cover is flying between the screens, so they only cross-fade).
function directionFor(from, to) {
  if (getFlight()) return 0
  const a = TAB_PATHS.indexOf(from)
  const b = TAB_PATHS.indexOf(to)
  if (a !== -1 && b !== -1) return Math.sign(b - a)
  return Math.sign(depth(to) - depth(from))
}

export const CollectionContext = createContext(null)
export const useCollectionContext = () => useContext(CollectionContext)

export default function App() {
  const collection = useCollection()
  const location = useLocation()
  const navType = useNavigationType()

  // Derive the transition direction while rendering, so entering and exiting pages agree
  const [nav, setNav] = useState({ path: location.pathname, dir: 0, from: null, scroll: 0, instant: false })
  if (nav.path !== location.pathname) {
    setNav({
      path: location.pathname,
      dir: directionFor(nav.path, location.pathname),
      from: nav.path,
      scroll: window.scrollY, // lets the leaving screen hold its place when the document scroll resets
      instant: navType === 'POP' && !backNav.current, // browser edge-swipe: the OS already animated it
    })
  }
  // Each screen starts at the top. (Browser back/forward restores its own scroll, so leave that.)
  useLayoutEffect(() => {
    if (nav.instant) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [nav.path, nav.instant])

  // Track-to-track swipes stay on one page; only the album/track group remounts
  const pageKey = location.pathname.replace(/\/track\/[^/]+$/, '/track')

  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('viewMode') || 'carousel'
  )
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'day'
  )

  useEffect(() => {
    const isDark = theme === 'night'
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', theme)
    // Keep theme-color in sync so browser chrome / PWA status bar matches
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', isDark ? '#111111' : '#EFEFEF')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  return (
    <CollectionContext.Provider value={{ ...collection, viewMode, setViewMode, theme, setTheme }}>
      <MotionConfig reducedMotion="user">
      <AmbientField />
      <AppShell>
        <AnimatePresence mode="popLayout" initial={false} custom={nav}>
          <motion.div
            key={pageKey}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <NavTypeContext.Provider value={{ type: navType, dir: nav.dir, from: nav.from }}>
            <Routes location={location}>
              <Route path="/"                                element={<Wall />} />
              <Route path="/profile"                         element={<Profile />} />
              <Route path="/sync"                            element={<Navigate to="/profile" replace />} />
              <Route path="/add"                             element={<AddRecord />} />
              <Route path="/album/:albumId"                  element={<AlbumDetail />} />
              <Route path="/album/:albumId/edit"             element={<AddRecord />} />
              <Route path="/album/:albumId/track/:trackId"   element={<Lyrics />} />
            </Routes>
            </NavTypeContext.Provider>
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <CoverFlight />
      </MotionConfig>
    </CollectionContext.Provider>
  )
}

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { createContext, useContext, useState, useEffect } from 'react'
import { useCollection } from './hooks/useCollection'
import AppShell from './components/layout/AppShell'
import CoverFlight from './components/layout/CoverFlight'
import AmbientField from './components/layout/AmbientField'
import Wall from './pages/Wall'
import AddRecord from './pages/AddRecord'
import AlbumDetail from './pages/AlbumDetail'
import Lyrics from './pages/Lyrics'
import Profile from './pages/Profile'

export const CollectionContext = createContext(null)
export const useCollectionContext = () => useContext(CollectionContext)

export default function App() {
  const collection = useCollection()
  const location = useLocation()

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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location.pathname}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Routes location={location}>
              <Route path="/"                                element={<Wall />} />
              <Route path="/profile"                         element={<Profile />} />
              <Route path="/sync"                            element={<Navigate to="/profile" replace />} />
              <Route path="/add"                             element={<AddRecord />} />
              <Route path="/album/:albumId"                  element={<AlbumDetail />} />
              <Route path="/album/:albumId/edit"             element={<AddRecord />} />
              <Route path="/album/:albumId/track/:trackId"   element={<Lyrics />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <CoverFlight />
      </MotionConfig>
    </CollectionContext.Provider>
  )
}

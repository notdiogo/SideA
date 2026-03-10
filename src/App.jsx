import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { createContext, useContext, useState, useEffect } from 'react'
import { useCollection } from './hooks/useCollection'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import AppShell from './components/layout/AppShell'
import Wall from './pages/Wall'
import AddRecord from './pages/AddRecord'
import AlbumDetail from './pages/AlbumDetail'
import Lyrics from './pages/Lyrics'
import Login from './pages/Login'

export const CollectionContext = createContext(null)
export const useCollectionContext = () => useContext(CollectionContext)

export default function App() {
  const session = useAuth()
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

  // Still resolving auth state — render nothing to avoid flash
  if (session === undefined) return null

  // Not authenticated — show login screen (outside AppShell so no nav bar)
  if (session === null) return <Login />

  const signOut = () => supabase.auth.signOut()

  return (
    <CollectionContext.Provider value={{ ...collection, viewMode, setViewMode, theme, setTheme, signOut }}>
      <AppShell>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/"                                element={<Wall />} />
            <Route path="/add"                             element={<AddRecord />} />
            <Route path="/album/:albumId"                  element={<AlbumDetail />} />
            <Route path="/album/:albumId/edit"             element={<AddRecord />} />
            <Route path="/album/:albumId/track/:trackId"   element={<Lyrics />} />
          </Routes>
        </AnimatePresence>
      </AppShell>
    </CollectionContext.Provider>
  )
}

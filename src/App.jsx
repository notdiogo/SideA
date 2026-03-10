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

// Mounted only after auth is confirmed — ensures store.getAll() always
// runs with a valid session token already in the Supabase client.
function AuthenticatedApp() {
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
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', isDark ? '#111111' : '#EFEFEF')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

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

export default function App() {
  const session = useAuth()

  if (session === undefined) return null   // resolving — avoid flash
  if (session === null)      return <Login />

  return <AuthenticatedApp />
}

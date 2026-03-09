import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { createContext, useContext, useState, useEffect } from 'react'
import { useCollection } from './hooks/useCollection'
import AppShell from './components/layout/AppShell'
import Wall from './pages/Wall'
import AddRecord from './pages/AddRecord'
import AlbumDetail from './pages/AlbumDetail'
import Lyrics from './pages/Lyrics'

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
    document.documentElement.classList.toggle('dark', theme === 'night')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  return (
    <CollectionContext.Provider value={{ ...collection, viewMode, setViewMode, theme, setTheme }}>
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

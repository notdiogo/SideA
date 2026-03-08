import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { createContext, useContext } from 'react'
import { supabase } from './lib/supabase'
import { useCollection } from './hooks/useCollection'
import AppShell from './components/layout/AppShell'
import Wall from './pages/Wall'
import AddRecord from './pages/AddRecord'
import AlbumDetail from './pages/AlbumDetail'
import Lyrics from './pages/Lyrics'
import Auth from './pages/Auth'

export const CollectionContext = createContext(null)
export const useCollectionContext = () => useContext(CollectionContext)

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const collection = useCollection(user)
  const location = useLocation()

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-background)',
        }}
      />
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <CollectionContext.Provider value={collection}>
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

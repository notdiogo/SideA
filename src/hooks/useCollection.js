import { useState, useCallback, useEffect } from 'react'
import * as store from '../store/supabaseCollection'

export function useCollection(user) {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAlbums([])
      setLoading(false)
      return
    }
    setLoading(true)
    store.getAll()
      .then(data => setAlbums(data))
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false))
  }, [user])

  const addAlbum = useCallback(async (albumData) => {
    const album = { id: store.generateId(), ...albumData }
    const saved = await store.save(album)
    setAlbums(prev => [saved, ...prev])
    return saved
  }, [])

  const updateAlbum = useCallback(async (album) => {
    const saved = await store.save(album)
    setAlbums(prev => prev.map(a => a.id === saved.id ? saved : a))
    return saved
  }, [])

  const removeAlbum = useCallback(async (id) => {
    await store.remove(id)
    setAlbums(prev => prev.filter(a => a.id !== id))
  }, [])

  return { albums, loading, addAlbum, updateAlbum, removeAlbum }
}

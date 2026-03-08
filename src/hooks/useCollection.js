import { useState, useCallback, useEffect } from 'react'
import * as store from '../store/collection'

export function useCollection() {
  const [albums, setAlbums] = useState(() => store.getAll())

  useEffect(() => {
    const handler = () => setAlbums(store.getAll())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const addAlbum = useCallback((albumData) => {
    const album = { id: store.generateId(), ...albumData }
    store.save(album)
    setAlbums(store.getAll())
    return album
  }, [])

  const updateAlbum = useCallback((album) => {
    store.save(album)
    setAlbums(store.getAll())
  }, [])

  const removeAlbum = useCallback((id) => {
    store.remove(id)
    setAlbums(prev => prev.filter(a => a.id !== id))
  }, [])

  return { albums, addAlbum, updateAlbum, removeAlbum }
}

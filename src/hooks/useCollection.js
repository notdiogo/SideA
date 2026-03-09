import { useState, useCallback, useEffect } from 'react'
import * as store from '../store/supabaseCollection'
import { prefetchAlbumLyrics } from '../lib/lyrics'

export function useCollection() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    store.getAll()
      .then(data => {
        setAlbums(data)
        // Backfill lyrics for any existing albums that are missing them
        const needsLyrics = data.filter(a =>
          a.artist && a.tracks?.some(t => t.title && !t.lyrics)
        )
        needsLyrics.forEach(album => {
          prefetchAlbumLyrics(album.artist, album.tracks).then(async tracksWithLyrics => {
            const saved = await store.save({ ...album, tracks: tracksWithLyrics })
            setAlbums(prev => prev.map(a => a.id === saved.id ? saved : a))
          })
        })
      })
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false))
  }, [])

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

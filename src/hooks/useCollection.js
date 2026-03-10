import { useState, useCallback, useEffect } from 'react'
import * as store from '../store/supabaseCollection'
import { prefetchAlbumLyrics } from '../lib/lyrics'

async function backfillLyrics(album, onDone) {
  if (!album.tracks?.some(t => !t.lyrics)) return
  const updatedTracks = await prefetchAlbumLyrics(album.artist, album.tracks)
  const anyNew = updatedTracks.some((t, i) => t.lyrics !== album.tracks[i]?.lyrics)
  if (!anyNew) return
  const saved = await store.save({ ...album, tracks: updatedTracks })
  onDone(saved)
}

export function useCollection() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    store.getAll()
      .then(data => {
        setAlbums(data)
        data.forEach(album =>
          backfillLyrics(album, saved =>
            setAlbums(prev => prev.map(a => a.id === saved.id ? saved : a))
          )
        )
      })
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false))
  }, [])

  const addAlbum = useCallback(async (albumData) => {
    const album = { id: store.generateId(), ...albumData }
    const saved = await store.save(album)
    setAlbums(prev => [saved, ...prev])
    prefetchAlbumLyrics(saved.artist, saved.tracks).then(updatedTracks => {
      const updated = { ...saved, tracks: updatedTracks }
      store.save(updated).then(result =>
        setAlbums(prev => prev.map(a => a.id === result.id ? result : a))
      )
    })
    return saved
  }, [])

  const updateAlbum = useCallback(async (album) => {
    const saved = await store.save(album)
    setAlbums(prev => prev.map(a => a.id === saved.id ? saved : a))
    prefetchAlbumLyrics(saved.artist, saved.tracks).then(updatedTracks => {
      const updated = { ...saved, tracks: updatedTracks }
      store.save(updated).then(result =>
        setAlbums(prev => prev.map(a => a.id === result.id ? result : a))
      )
    })
    return saved
  }, [])

  const removeAlbum = useCallback(async (id) => {
    await store.remove(id)
    setAlbums(prev => prev.filter(a => a.id !== id))
  }, [])

  return { albums, loading, addAlbum, updateAlbum, removeAlbum }
}

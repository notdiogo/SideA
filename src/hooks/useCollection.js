import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  generateId, getAllRecords, getRecord, putRecords, requestPersistence,
} from '../store/localDb'
import { syncNow } from '../store/sync'
import { prefetchAlbumLyrics } from '../lib/lyrics'

const visible = (records) => records.filter(r => !r.deletedAt)

// status: 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error'
export function useCollection() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [status, setStatus] = useState('signed-out')
  const sessionRef = useRef(null)
  const syncing = useRef(null)
  const again = useRef(false)

  const reload = useCallback(async () => {
    setAlbums(visible(await getAllRecords()))
  }, [])

  const sync = useCallback(async () => {
    if (!sessionRef.current) return
    if (syncing.current) { again.current = true; return syncing.current }
    setStatus('syncing')
    syncing.current = (async () => {
      try {
        if (await syncNow()) await reload()
        setStatus('synced')
      } catch (err) {
        setStatus(navigator.onLine === false || err instanceof TypeError ? 'offline' : 'error')
      } finally {
        syncing.current = null
        if (again.current) { again.current = false; sync() }
      }
    })()
    return syncing.current
  }, [reload])

  // Local data first: render immediately, never wait on the network.
  useEffect(() => {
    requestPersistence()
    reload().finally(() => setLoading(false))
  }, [reload])

  // Auth session (optional — the app works without it, it just doesn't sync).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      sessionRef.current = data.session
      setSession(data.session)
      setAuthReady(true)
      if (!data.session) setStatus('signed-out')
      else sync()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      sessionRef.current = s
      setSession(s)
      if (!s) setStatus('signed-out')
      else sync()
    })
    return () => sub.subscription.unsubscribe()
  }, [sync])

  // Re-sync when the app returns to the foreground or the network comes back.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') sync() }
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [sync])

  // Backfill missing lyrics once per album (an empty string means "tried, none found").
  const backfilled = useRef(new Set())
  useEffect(() => {
    albums
      .filter(a => a.artist && a.tracks?.some(t => t.title && t.lyrics == null))
      .filter(a => !backfilled.current.has(a.id))
      .forEach(album => {
        backfilled.current.add(album.id)
        prefetchAlbumLyrics(album.artist, album.tracks).then(tracks => {
          // Re-read so we don't clobber edits made while lyrics were loading.
          getRecord(album.id).then(latest => {
            if (latest && !latest.deletedAt) persist({ ...latest, tracks: mergeLyrics(latest.tracks, tracks) })
          })
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albums])

  const persist = useCallback(async (album) => {
    const record = { ...album, updatedAt: Date.now(), deletedAt: album.deletedAt ?? null, dirty: true }
    await putRecords([record])
    setAlbums(prev => {
      if (record.deletedAt) return prev.filter(a => a.id !== record.id)
      return prev.some(a => a.id === record.id)
        ? prev.map(a => a.id === record.id ? record : a)
        : [record, ...prev]
    })
    sync()
    return record
  }, [sync])

  const addAlbum = useCallback((albumData) => {
    const now = Date.now()
    return persist({ id: generateId(), createdAt: now, ...albumData })
  }, [persist])

  const updateAlbum = useCallback(async (album) => {
    const existing = await getRecord(album.id)
    return persist({ ...existing, ...album, createdAt: existing?.createdAt ?? Date.now() })
  }, [persist])

  const removeAlbum = useCallback(async (id) => {
    const existing = await getRecord(id)
    if (existing) await persist({ ...existing, deletedAt: Date.now() })
  }, [persist])

  const exportJson = useCallback(async () => {
    const data = visible(await getAllRecords()).map(({ dirty, deletedAt, ...a }) => a)
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  }, [])

  return {
    albums, loading, addAlbum, updateAlbum, removeAlbum,
    session, authReady, status, sync, exportJson,
  }
}

function mergeLyrics(current, fetched) {
  const byId = new Map(fetched.map(t => [t.id, t.lyrics]))
  return current.map(t => (t.lyrics == null && byId.has(t.id) ? { ...t, lyrics: byId.get(t.id) } : t))
}

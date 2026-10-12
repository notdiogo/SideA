import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Search, Music, ScanBarcode } from 'lucide-react'
import { useCollectionContext } from '../App'
import ImageUpload from '../components/forms/ImageUpload'
import TrackListEditor from '../components/forms/TrackListEditor'
import BarcodeScanner from '../components/forms/BarcodeScanner'
import PageTransition from '../components/layout/PageTransition'
import { searchAlbums, loadAlbum, searchReleaseByBarcode, fetchCoverAsBase64, groupThumbUrl } from '../lib/musicbrainz'
import { prefetchAlbumLyrics } from '../lib/lyrics'

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--color-card)',
  border: 'none',
  borderRadius: '12px',
  color: 'var(--color-foreground)',
  fontSize: '15px',
  outline: 'none',
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-muted-foreground)',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: '12px', color: 'oklch(55% 0.18 25)' }}>{error}</span>
      )}
    </div>
  )
}

// ── Auto-fill panel ──────────────────────────────────────────────────────────

function ResultRow({ group, loading, disabled, onPick }) {
  const [noCover, setNoCover] = useState(false)
  const meta = [group.artist, group.year, group.type && group.type !== 'Album' ? group.type : ''].filter(Boolean).join(' · ')
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={() => onPick(group)}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px',
        borderRadius: '14px',
        textAlign: 'left',
        width: '100%',
        opacity: disabled && !loading ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--color-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {noCover ? (
          <Music size={18} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
        ) : (
          <img
            src={groupThumbUrl(group.groupId)}
            alt=""
            loading="lazy"
            onError={() => setNoCover(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-foreground)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.title}
        </p>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-muted-foreground)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta}
        </p>
      </div>
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }}
        >
          <Loader2 size={16} strokeWidth={1.5} />
        </motion.div>
      )}
    </motion.button>
  )
}

function AutoFillPanel({ onConfirm }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [state, setState] = useState('idle') // idle | searching | loading | preview | error
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [scanning, setScanning] = useState(false)
  const [pickingId, setPickingId] = useState(null)

  // Debounced as-you-type search; stale requests are aborted
  useEffect(() => {
    const term = query.trim()
    if (term.length < 3) {
      setResults([])
      setState(s => (s === 'searching' || s === 'error' ? 'idle' : s))
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setState('searching')
      setErrorMsg('')
      try {
        const found = await searchAlbums(term, controller.signal)
        setResults(found)
        setState(found.length ? 'idle' : 'error')
        if (!found.length) setErrorMsg('No albums found. Try fewer or different words.')
      } catch (err) {
        if (err.name === 'AbortError') return
        setErrorMsg('Search failed. Check your connection and try again.')
        setState('error')
      }
    }, 400)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  const showPreview = async (load, notFoundMsg) => {
    setState('loading')
    setErrorMsg('')
    try {
      const result = await load()
      const cover = await fetchCoverAsBase64(result.mbid, result.groupId)
      setPreview({ ...result, coverImage: cover })
      setState('preview')
    } catch (err) {
      setErrorMsg(err.message === 'No album found'
        ? notFoundMsg
        : 'Lookup failed. Check your connection and try again.')
      setState('error')
    } finally {
      setPickingId(null)
    }
  }

  const handlePick = (group) => {
    setPickingId(group.groupId)
    showPreview(() => loadAlbum(group), 'No tracklist found for that album.')
  }

  const handleBarcode = (code) => {
    setScanning(false)
    showPreview(() => searchReleaseByBarcode(code), `No album found for barcode ${code}. Try searching by name.`)
  }

  const handleReset = () => {
    setState('idle')
    setPreview(null)
    setErrorMsg('')
  }

  const busy = state === 'loading'

  return (
    <div>
      <AnimatePresence>
        {scanning && <BarcodeScanner onDetect={handleBarcode} onClose={() => setScanning(false)} />}
      </AnimatePresence>

      {state !== 'preview' && (
        <>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search
              size={16}
              strokeWidth={1.5}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none' }}
            />
            <input
              className="field"
              style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '40px' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search artist or album"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              disabled={busy}
            />
            {state === 'searching' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', right: 14, top: '50%', marginTop: -8, color: 'var(--color-muted-foreground)' }}
              >
                <Loader2 size={16} strokeWidth={1.5} />
              </motion.div>
            )}
          </div>

          <motion.button
            whileTap={busy ? undefined : { scale: 0.96 }}
            onClick={() => setScanning(true)}
            disabled={busy}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '999px',
              background: 'var(--color-secondary)',
              color: 'var(--color-foreground)',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: busy ? 0.5 : 1,
            }}
          >
            <ScanBarcode size={16} strokeWidth={1.5} />
            Scan barcode
          </motion.button>

          {state === 'error' && (
            <p style={{ marginTop: '14px', fontSize: '13px', color: 'oklch(55% 0.18 25)', textAlign: 'center' }}>
              {errorMsg}
            </p>
          )}

          {results.length > 0 && (
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {results.map(g => (
                <ResultRow key={g.groupId} group={g} loading={pickingId === g.groupId} disabled={busy} onPick={handlePick} />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {state === 'preview' && preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: '14px',
              background: 'var(--color-card)',
              borderRadius: '20px',
              boxShadow: 'inset 0 0 0 1px var(--color-border), 0 8px 28px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Cover + metadata */}
            <div style={{ display: 'flex', gap: '14px', padding: '14px' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--color-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {preview.coverImage ? (
                  <img src={preview.coverImage} alt={preview.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Music size={24} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview.title}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-muted-foreground)', marginTop: '2px' }}>
                  {preview.artist}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-muted-foreground)', marginTop: '6px' }}>
                  {preview.year && `${preview.year} · `}{preview.tracks.length} tracks
                </p>
              </div>
            </div>

            {/* Track list preview */}
            {preview.tracks.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '10px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '6px' }}>
                  Tracks
                </p>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {preview.tracks.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', gap: '10px', padding: '4px 0', fontSize: '13px' }}>
                      <span style={{ color: 'var(--color-muted-foreground)', fontWeight: 300, width: 18, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ color: 'var(--color-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm / retry */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 14px 14px' }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onConfirm(preview)}
                style={{
                  flex: 1, padding: '13px', borderRadius: '999px',
                  background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', fontSize: '14px', fontWeight: 600,
                }}
              >
                Use this album
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleReset}
                style={{
                  flex: 1, padding: '13px', borderRadius: '999px',
                  background: 'var(--color-secondary)', color: 'var(--color-muted-foreground)', fontSize: '14px', fontWeight: 500,
                }}
              >
                Try again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AddRecord() {
  const navigate = useNavigate()
  const { albumId } = useParams()
  const { albums, addAlbum, updateAlbum } = useCollectionContext()
  const isEditing = Boolean(albumId)

  const [mode, setMode] = useState(isEditing ? 'manual' : 'autofill')
  const [autoFilled, setAutoFilled] = useState(false)

  const [form, setForm] = useState({
    title: '',
    artist: '',
    year: '',
    coverImage: '',
    tracks: [],
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) {
      const album = albums.find(a => a.id === albumId)
      if (album) {
        setForm({
          title: album.title,
          artist: album.artist,
          year: album.year,
          coverImage: album.coverImage,
          tracks: album.tracks || [],
        })
      }
    }
  }, [albumId, isEditing, albums])

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }))
  const setInput = (field) => (e) => set(field)(e.target.value)

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.artist.trim()) e.artist = 'Artist is required'
    if (form.year && !/^\d{4}$/.test(form.year.trim())) e.year = 'Enter a valid year (e.g. 1972)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirmAutoFill = (preview) => {
    setForm({
      title: preview.title,
      artist: preview.artist,
      year: preview.year,
      coverImage: preview.coverImage || '',
      tracks: preview.tracks,
    })
    setAutoFilled(true)
    setMode('manual')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const albumData = {
      ...form,
      title: form.title.trim(),
      artist: form.artist.trim(),
      year: form.year.trim(),
      tracks: form.tracks.filter(t => t.title.trim()),
    }

    if (isEditing) {
      const saved = await updateAlbum({ id: albumId, ...albumData })
      navigate(`/album/${albumId}`)
      // Prefetch lyrics for any tracks that don't have them yet
      prefetchAlbumLyrics(saved.artist, saved.tracks).then(tracksWithLyrics => {
        updateAlbum({ ...saved, tracks: tracksWithLyrics })
      })
    } else {
      const album = await addAlbum(albumData)
      navigate(`/album/${album.id}`, { replace: true })
      // Prefetch all track lyrics in the background after navigation
      prefetchAlbumLyrics(album.artist, album.tracks).then(tracksWithLyrics => {
        updateAlbum({ ...album, tracks: tracksWithLyrics })
      })
    }
  }

  return (
    <PageTransition>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '28px 20px calc(var(--tabbar-h, 0px) + 48px)' }}>

        {/* Mode toggle */}
        {!isEditing && (
          <div
            className="glass"
            style={{
              display: 'flex',
              position: 'relative',
              borderRadius: '999px',
              padding: '4px',
              marginBottom: '32px',
            }}
          >
            {['autofill', 'manual'].map(m => (
              <motion.button
                key={m}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '10px',
                  borderRadius: '999px',
                  color: mode === m ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                  fontSize: '14px',
                  fontWeight: mode === m ? 500 : 400,
                  letterSpacing: '-0.01em',
                }}
              >
                {mode === m && (
                  <motion.span
                    layoutId="mode-thumb"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '999px',
                      background: 'var(--glass-thumb)',
                      boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 1px 6px var(--glass-shadow)',
                    }}
                  />
                )}
                <span style={{ position: 'relative' }}>{m === 'autofill' ? 'Auto-fill' : 'Manual'}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Auto-fill panel */}
        {mode === 'autofill' && (
          <AutoFillPanel onConfirm={handleConfirmAutoFill} />
        )}

        {/* Manual form */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit}>
            {autoFilled && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--color-card)',
                  boxShadow: 'inset 0 0 0 1px var(--color-border)',
                  fontSize: '13px',
                  color: 'var(--color-muted-foreground)',
                  fontWeight: 300,
                }}
              >
                Auto-filled from MusicBrainz · edit any field below
              </div>
            )}

            <div style={{ marginBottom: '24px', maxWidth: '240px', margin: '0 auto 24px' }}>
              <ImageUpload value={form.coverImage} onChange={set('coverImage')} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <Field label="Album title" error={errors.title}>
                <input
          className="field"
                  style={{ ...inputStyle, boxShadow: errors.title ? '0 0 0 2px oklch(55% 0.18 25)' : undefined }}
                  value={form.title}
                  onChange={setInput('title')}
                  placeholder="e.g. Rumours"
                />
              </Field>
              <Field label="Artist" error={errors.artist}>
                <input
          className="field"
                  style={{ ...inputStyle, boxShadow: errors.artist ? '0 0 0 2px oklch(55% 0.18 25)' : undefined }}
                  value={form.artist}
                  onChange={setInput('artist')}
                  placeholder="e.g. Fleetwood Mac"
                />
              </Field>
              <Field label="Year" error={errors.year}>
                <input
          className="field"
                  style={{ ...inputStyle, boxShadow: errors.year ? '0 0 0 2px oklch(55% 0.18 25)' : undefined }}
                  value={form.year}
                  onChange={setInput('year')}
                  placeholder="e.g. 1977"
                  maxLength={4}
                  inputMode="numeric"
                />
              </Field>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '12px' }}>
                Track list
              </h3>
              <TrackListEditor tracks={form.tracks} onChange={set('tracks')} />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={saving}
              style={{
                width: '100%', padding: '16px', borderRadius: '999px',
                background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', fontSize: '15px', fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add to collection'}
            </motion.button>
          </form>
        )}
      </div>
    </PageTransition>
  )
}

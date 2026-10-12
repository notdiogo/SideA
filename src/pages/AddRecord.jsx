import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Search, Music } from 'lucide-react'
import { useCollectionContext } from '../App'
import ImageUpload from '../components/forms/ImageUpload'
import TrackListEditor from '../components/forms/TrackListEditor'
import PageTransition from '../components/layout/PageTransition'
import { searchRelease, fetchCoverAsBase64 } from '../lib/musicbrainz'
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

function AutoFillPanel({ onConfirm }) {
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [state, setState] = useState('idle') // idle | loading | preview | error
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSearch = async () => {
    if (!artist.trim() || !album.trim()) return
    setState('loading')
    setErrorMsg('')
    try {
      const result = await searchRelease(artist.trim(), album.trim())
      const cover = await fetchCoverAsBase64(result.mbid)
      setPreview({ ...result, coverImage: cover })
      setState('preview')
    } catch (err) {
      setErrorMsg(err.message === 'No album found'
        ? 'No album found. Try adjusting the artist or title.'
        : 'Search failed. Check your connection and try again.')
      setState('error')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleReset = () => {
    setState('idle')
    setPreview(null)
    setErrorMsg('')
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        <input
          className="field"
          style={inputStyle}
          value={artist}
          onChange={e => setArtist(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Artist name"
          disabled={state === 'loading'}
        />
        <input
          className="field"
          style={inputStyle}
          value={album}
          onChange={e => setAlbum(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Album title"
          disabled={state === 'loading'}
        />
      </div>

      {state !== 'preview' && (
        <motion.button
          whileTap={state === 'loading' || !artist.trim() || !album.trim() ? undefined : { scale: 0.96 }}
          onClick={handleSearch}
          disabled={state === 'loading' || !artist.trim() || !album.trim()}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '999px',
            background: (state === 'loading' || !artist.trim() || !album.trim()) ? 'var(--color-secondary)' : 'var(--color-primary)',
            color: (state === 'loading' || !artist.trim() || !album.trim()) ? 'var(--color-muted-foreground)' : 'var(--color-primary-foreground)',
            fontSize: '15px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {state === 'loading' ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={16} strokeWidth={1.5} />
              </motion.div>
              Looking up album…
            </>
          ) : (
            <>
              <Search size={16} strokeWidth={1.5} />
              Search
            </>
          )}
        </motion.button>
      )}

      {state === 'error' && (
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'oklch(55% 0.18 25)', textAlign: 'center' }}>
          {errorMsg}
        </p>
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
                      <span style={{ color: 'var(--color-muted-foreground)', fontWeight: 300, width: 18, flexShrink: 0 }}>{i + 1}</span>
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
      navigate(`/album/${album.id}`)
      // Prefetch all track lyrics in the background after navigation
      prefetchAlbumLyrics(album.artist, album.tracks).then(tracksWithLyrics => {
        updateAlbum({ ...album, tracks: tracksWithLyrics })
      })
    }
  }

  return (
    <PageTransition>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '28px 20px 64px' }}>

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
                      background: 'var(--color-card)',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
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

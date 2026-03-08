import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Search, Music } from 'lucide-react'
import { useCollectionContext } from '../App'
import { generateId } from '../store/collection'
import { getById } from '../store/collection'
import ImageUpload from '../components/forms/ImageUpload'
import TrackListEditor from '../components/forms/TrackListEditor'
import PageTransition from '../components/layout/PageTransition'
import { searchRelease, fetchCoverAsBase64 } from '../lib/musicbrainz'

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  color: '#1A1A1A',
  fontSize: '15px',
  outline: 'none',
  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9A9A9A',
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
          style={inputStyle}
          value={artist}
          onChange={e => setArtist(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Artist name"
          disabled={state === 'loading'}
        />
        <input
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
          whileTap={{ scale: 0.97 }}
          onClick={handleSearch}
          disabled={state === 'loading' || !artist.trim() || !album.trim()}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            background: (state === 'loading' || !artist.trim() || !album.trim()) ? '#E5E5E5' : '#1A1A1A',
            color: (state === 'loading' || !artist.trim() || !album.trim()) ? '#9A9A9A' : '#FFFFFF',
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
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
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
                  background: '#E5E5E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {preview.coverImage ? (
                  <img src={preview.coverImage} alt={preview.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Music size={24} strokeWidth={1.5} style={{ color: '#9A9A9A' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview.title}
                </p>
                <p style={{ fontSize: '13px', fontWeight: 300, color: '#9A9A9A', marginTop: '2px' }}>
                  {preview.artist}
                </p>
                <p style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '6px' }}>
                  {preview.year && `${preview.year} · `}{preview.tracks.length} tracks
                </p>
              </div>
            </div>

            {/* Track list preview */}
            {preview.tracks.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '10px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: '6px' }}>
                  Tracks
                </p>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {preview.tracks.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', gap: '10px', padding: '4px 0', fontSize: '13px' }}>
                      <span style={{ color: '#9A9A9A', fontWeight: 300, width: 18, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm / retry */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 14px 14px' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onConfirm(preview)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  background: '#1A1A1A', color: '#FFFFFF', fontSize: '14px', fontWeight: 600,
                }}
              >
                Use this album
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReset}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  background: '#E5E5E5', color: '#9A9A9A', fontSize: '14px', fontWeight: 500,
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
  const { addAlbum, updateAlbum } = useCollectionContext()
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
      const album = getById(albumId)
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
  }, [albumId, isEditing])

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
      updateAlbum({ id: albumId, ...albumData })
      navigate(`/album/${albumId}`)
    } else {
      const album = addAlbum(albumData)
      navigate(`/album/${album.id}`)
    }
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Mode toggle */}
        {!isEditing && (
          <div
            style={{
              display: 'flex',
              background: '#E5E5E5',
              borderRadius: '12px',
              padding: '3px',
              marginBottom: '24px',
            }}
          >
            {['autofill', 'manual'].map(m => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  background: mode === m ? '#FFFFFF' : 'transparent',
                  color: mode === m ? '#1A1A1A' : '#9A9A9A',
                  fontSize: '14px',
                  fontWeight: mode === m ? 600 : 400,
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {m === 'autofill' ? 'Auto-fill' : 'Manual'}
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
                  background: '#FFFFFF',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  fontSize: '13px',
                  color: '#9A9A9A',
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
                  style={{ ...inputStyle, boxShadow: errors.title ? '0 0 0 2px oklch(55% 0.18 25)' : '0 1px 6px rgba(0,0,0,0.06)' }}
                  value={form.title}
                  onChange={setInput('title')}
                  placeholder="e.g. Rumours"
                />
              </Field>
              <Field label="Artist" error={errors.artist}>
                <input
                  style={{ ...inputStyle, boxShadow: errors.artist ? '0 0 0 2px oklch(55% 0.18 25)' : '0 1px 6px rgba(0,0,0,0.06)' }}
                  value={form.artist}
                  onChange={setInput('artist')}
                  placeholder="e.g. Fleetwood Mac"
                />
              </Field>
              <Field label="Year" error={errors.year}>
                <input
                  style={{ ...inputStyle, boxShadow: errors.year ? '0 0 0 2px oklch(55% 0.18 25)' : '0 1px 6px rgba(0,0,0,0.06)' }}
                  value={form.year}
                  onChange={setInput('year')}
                  placeholder="e.g. 1977"
                  maxLength={4}
                  inputMode="numeric"
                />
              </Field>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: '12px' }}>
                Track list
              </h3>
              <TrackListEditor tracks={form.tracks} onChange={set('tracks')} />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px',
                background: '#1A1A1A', color: '#FFFFFF', fontSize: '15px', fontWeight: 600,
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

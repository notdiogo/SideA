import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCollectionContext } from '../App'
import { generateId } from '../store/collection'
import { getById } from '../store/collection'
import ImageUpload from '../components/forms/ImageUpload'
import TrackListEditor from '../components/forms/TrackListEditor'
import PageTransition from '../components/layout/PageTransition'

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
          color: 'var(--color-muted-foreground)',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-destructive)' }}>{error}</span>
      )}
    </div>
  )
}

export default function AddRecord() {
  const navigate = useNavigate()
  const { albumId } = useParams()
  const { addAlbum, updateAlbum } = useCollectionContext()
  const isEditing = Boolean(albumId)

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
      <form onSubmit={handleSubmit} style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 48px' }}>
        {/* Cover upload */}
        <div style={{ marginBottom: '28px', maxWidth: '240px', margin: '0 auto 28px' }}>
          <ImageUpload value={form.coverImage} onChange={set('coverImage')} />
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <Field label="Album title" error={errors.title}>
            <input
              style={{
                ...inputStyle,
                boxShadow: errors.title ? '0 0 0 2px oklch(55% 0.18 25)' : '0 1px 6px rgba(0,0,0,0.06)',
              }}
              value={form.title}
              onChange={setInput('title')}
              placeholder="e.g. Rumours"
            />
          </Field>

          <Field label="Artist" error={errors.artist}>
            <input
              style={{
                ...inputStyle,
                boxShadow: errors.artist ? '0 0 0 2px oklch(55% 0.18 25)' : '0 1px 6px rgba(0,0,0,0.06)',
              }}
              value={form.artist}
              onChange={setInput('artist')}
              placeholder="e.g. Fleetwood Mac"
            />
          </Field>

          <Field label="Year" error={errors.year}>
            <input
              style={{
                ...inputStyle,
                boxShadow: errors.year ? '0 0 0 2px oklch(55% 0.18 25)' : '0 1px 6px rgba(0,0,0,0.06)',
              }}
              value={form.year}
              onChange={setInput('year')}
              placeholder="e.g. 1977"
              maxLength={4}
              inputMode="numeric"
            />
          </Field>
        </div>

        {/* Track list */}
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-muted-foreground)',
              marginBottom: '12px',
            }}
          >
            Track list
          </h3>
          <TrackListEditor
            tracks={form.tracks}
            onChange={set('tracks')}
          />
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            background: '#1A1A1A',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add to collection'}
        </motion.button>
      </form>
    </PageTransition>
  )
}

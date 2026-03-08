import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Music } from 'lucide-react'
import { useCollectionContext } from '../App'
import PageTransition from '../components/layout/PageTransition'

function getDominantColor(imgEl) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imgEl, 0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgba(${r},${g},${b},0.35)`
  } catch {
    return 'rgba(212,168,67,0.15)'
  }
}

const trackVariants = {
  initial: { opacity: 0, x: 20 },
  animate: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function AlbumDetail() {
  const { albumId } = useParams()
  const navigate = useNavigate()
  const { albums, removeAlbum } = useCollectionContext()
  const [glowColor, setGlowColor] = useState('rgba(212,168,67,0.15)')
  const [showDelete, setShowDelete] = useState(false)
  const imgRef = useRef(null)

  const album = albums.find(a => a.id === albumId)

  useEffect(() => {
    if (!album) navigate('/', { replace: true })
  }, [album, navigate])

  if (!album) return null

  const handleImgLoad = () => {
    if (imgRef.current) {
      setGlowColor(getDominantColor(imgRef.current))
    }
  }

  const handleDelete = () => {
    removeAlbum(albumId)
    navigate('/')
  }

  const tracks = album.tracks || []

  return (
    <PageTransition>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Cover section */}
        <div style={{ position: 'relative' }}>
          {/* Ambient glow */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              height: '60%',
              background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 0,
              filter: 'blur(40px)',
            }}
          />

          {/* Cover image */}
          <div style={{ padding: '24px 32px 0', position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: '280px',
                margin: '0 auto',
                aspectRatio: '1 / 1',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              }}
            >
              {album.coverImage ? (
                <img
                  ref={imgRef}
                  src={album.coverImage}
                  alt={album.title}
                  onLoad={handleImgLoad}
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-secondary)',
                  }}
                >
                  <Music size={48} strokeWidth={1} style={{ color: 'var(--color-border)' }} />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '20px 24px 0', textAlign: 'center', position: 'relative' }}
        >
          {album.artist && (
            <p
              style={{
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-muted-foreground)',
                marginBottom: '6px',
              }}
            >
              {album.artist}
            </p>
          )}
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--color-foreground)',
              lineHeight: 1.2,
            }}
          >
            {album.title}
          </h1>
          {album.year && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-muted-foreground)',
                marginTop: '6px',
              }}
            >
              {album.year}
            </p>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(`/album/${albumId}/edit`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'var(--color-secondary)',
                color: 'var(--color-foreground)',
                fontSize: '13px',
                border: '1px solid var(--color-border)',
              }}
            >
              <Edit3 size={14} />
              Edit
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDelete(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'var(--color-secondary)',
                color: showDelete ? 'var(--color-destructive)' : 'var(--color-muted-foreground)',
                fontSize: '13px',
                border: `1px solid ${showDelete ? 'var(--color-destructive)' : 'var(--color-border)'}`,
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              <Trash2 size={14} />
              Delete
            </motion.button>
          </div>

          {/* Delete confirm */}
          <AnimatePresence>
            {showDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: '12px' }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                    Remove <strong style={{ color: 'var(--color-foreground)' }}>{album.title}</strong> from your collection?
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDelete}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--color-destructive)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Remove
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDelete(false)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--color-secondary)',
                        color: 'var(--color-foreground)',
                        fontSize: '13px',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Track list */}
        {tracks.length > 0 && (
          <div style={{ padding: '28px 0 48px' }}>
            <p
              style={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-muted-foreground)',
                padding: '0 24px',
                marginBottom: '4px',
              }}
            >
              Tracks
            </p>
            <div>
              {tracks.map((track, i) => (
                <motion.button
                  key={track.id}
                  custom={i}
                  variants={trackVariants}
                  initial="initial"
                  animate="animate"
                  whileTap={{ backgroundColor: 'var(--color-secondary)' }}
                  onClick={() => navigate(`/album/${albumId}/track/${track.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    padding: '14px 24px',
                    background: 'transparent',
                    borderTop: i === 0 ? '1px solid var(--color-border)' : 'none',
                    borderBottom: '1px solid var(--color-border)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-muted-foreground)',
                      width: '24px',
                      flexShrink: 0,
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '15px',
                      color: 'var(--color-foreground)',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {track.title || 'Untitled'}
                  </span>
                  <span style={{ color: 'var(--color-border)', fontSize: '18px' }}>›</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {tracks.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px' }}>
              No tracks added yet.{' '}
              <span
                style={{ color: 'var(--color-primary)', cursor: 'pointer' }}
                onClick={() => navigate(`/album/${albumId}/edit`)}
              >
                Edit to add tracks
              </span>
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

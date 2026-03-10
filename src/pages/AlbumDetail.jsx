import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Edit3, Trash2, Music } from 'lucide-react'
import { useCollectionContext } from '../App'
import { useViewport } from '../hooks/useViewport'
import PageTransition from '../components/layout/PageTransition'

const trackVariants = {
  initial: { opacity: 0 },
  animate: (i) => ({
    opacity: 1,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  }),
}

function VinylDisc({ size = 180 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <circle cx="90" cy="90" r="89" fill="#1C1C1E" />
      <circle cx="90" cy="90" r="75" stroke="#2C2C2E" strokeWidth="1" />
      <circle cx="90" cy="90" r="62" stroke="#2C2C2E" strokeWidth="1" />
      <circle cx="90" cy="90" r="50" stroke="#2C2C2E" strokeWidth="1" />
      <circle cx="90" cy="90" r="38" stroke="#2C2C2E" strokeWidth="1" />
      <circle cx="90" cy="90" r="26" stroke="#2C2C2E" strokeWidth="1" />
      <circle cx="90" cy="90" r="16" fill="#FFFFFF" />
      <circle cx="90" cy="90" r="4" fill="#1C1C1E" />
    </svg>
  )
}

export default function AlbumDetail() {
  const { albumId } = useParams()
  const navigate = useNavigate()
  const { albums, removeAlbum } = useCollectionContext()
  const [showOptions, setShowOptions] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const optionsRef = useRef(null)
  const { isLandscape, isTablet } = useViewport()

  const album = albums.find(a => a.id === albumId)

  useEffect(() => {
    if (!album) navigate('/', { replace: true })
  }, [album, navigate])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showOptions) return
    const handler = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showOptions])

  if (!album) return null

  const handleDelete = async () => {
    setShowDelete(false)
    await removeAlbum(albumId)
    navigate('/')
  }

  const tracks = album.tracks || []
  const isTabletLandscape = isTablet && isLandscape

  // Shared: cover art content
  const artContent = album.coverImage ? (
    <img src={album.coverImage} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-secondary)' }}>
      <Music size={isTabletLandscape ? 56 : 48} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
    </div>
  )

  // Shared: track list rows
  const trackRows = tracks.map((track, i) => (
    <motion.button
      key={track.id}
      type="button"
      custom={i}
      variants={trackVariants}
      initial="initial"
      animate="animate"
      whileTap={{ backgroundColor: 'var(--color-secondary)' }}
      onClick={() => navigate(`/album/${albumId}/track/${track.id}`)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:           16,
        width:        '100%',
        padding:      '14px 24px',
        background:   'transparent',
        borderBottom: '1px solid var(--color-border)',
        borderTop:     i === 0 ? '1px solid var(--color-border)' : 'none',
        textAlign:    'left',
        cursor:       'pointer',
        transition:   'background 0.15s',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 300, width: '24px', flexShrink: 0, textAlign: 'center' }}>
        {i + 1}
      </span>
      <span style={{ fontSize: '15px', fontWeight: 400, color: 'var(--color-foreground)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {track.title || 'Untitled'}
      </span>
      <span style={{ color: 'var(--color-muted-foreground)', fontSize: '18px' }}>›</span>
    </motion.button>
  ))

  return (
    <>
      {/* ── Options button — outside PageTransition so position:fixed isn't
           broken by the parent transform animation ── */}
      <div
        ref={optionsRef}
        style={{ position: 'fixed', top: 10, right: 16, zIndex: 35 }}
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowOptions(v => !v)}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:           36,
            height:          36,
            borderRadius:   '999px',
            background:     'var(--color-secondary)',
            color:          'var(--color-foreground)',
          }}
        >
          <MoreHorizontal size={18} strokeWidth={1.75} />
        </motion.button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: -4 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.93, y: -4 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position:        'absolute',
                top:             'calc(100% + 6px)',
                right:            0,
                background:      'var(--color-card)',
                borderRadius:     14,
                boxShadow:       '0 4px 24px rgba(0,0,0,0.14)',
                overflow:        'hidden',
                minWidth:         140,
                transformOrigin: 'top right',
              }}
            >
              <button
                type="button"
                onClick={() => { setShowOptions(false); navigate(`/album/${albumId}/edit`) }}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:           10,
                  width:        '100%',
                  padding:      '12px 16px',
                  fontSize:      14,
                  fontWeight:    400,
                  color:        'var(--color-foreground)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Edit3 size={14} strokeWidth={1.5} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => { setShowOptions(false); setShowDelete(true) }}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:         10,
                  width:      '100%',
                  padding:    '12px 16px',
                  fontSize:    14,
                  fontWeight:  400,
                  color:      'oklch(55% 0.18 25)',
                }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PageTransition>
        {isTabletLandscape ? (
          /* ── Landscape: two-column ── */
          <div
            style={{
              maxWidth:    1100,
              margin:      '0 auto',
              display:     'flex',
              gap:          32,
              padding:     '36px 16px 64px',
              alignItems:  'flex-start',
            }}
          >
            {/* Left: album art + vinyl, sticky */}
            <div
              style={{
                width:       260,
                flexShrink:  0,
                position:   'sticky',
                top:        'calc(var(--nav-height) + 24px)',
                alignSelf:  'flex-start',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Vinyl disc behind the art */}
                <div style={{ position: 'absolute', right: -28, top: 130, transform: 'translateY(-50%)', zIndex: 0 }}>
                  <VinylDisc size={220} />
                </div>

                {/* Album art */}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1,    opacity: 1 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position:     'relative',
                    zIndex:        1,
                    width:         260,
                    height:        260,
                    borderRadius: '8px',
                    overflow:     'hidden',
                    boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
                  }}
                >
                  {artContent}
                </motion.div>

                {/* Floor reflection */}
                {album.coverImage && (
                  <div style={{ position: 'relative', zIndex: 1, width: 260, height: 52, overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                    <img
                      src={album.coverImage}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width:          '100%',
                        height:          52,
                        objectFit:      'cover',
                        objectPosition: 'center bottom',
                        transform:      'scaleY(-1)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
                        maskImage:       'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right: metadata + tracks */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              {/* Metadata — left aligned in landscape */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ paddingBottom: 28 }}
              >
                {album.artist && (
                  <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-muted-foreground)', marginBottom: '6px' }}>
                    {album.artist}
                  </p>
                )}
                <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-foreground)', lineHeight: 1.15 }}>
                  {album.title}
                </h1>
                {album.year && (
                  <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 300, marginTop: '6px' }}>
                    {album.year}
                  </p>
                )}
              </motion.div>

              {/* Track list */}
              {tracks.length > 0 && (
                <div style={{ paddingBottom: 48 }}>
                  <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', padding: '0 24px', marginBottom: '4px' }}>
                    Tracks
                  </p>
                  <div>{trackRows}</div>
                </div>
              )}

              {tracks.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'left' }}>
                  <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px', fontWeight: 300 }}>
                    No tracks added yet.{' '}
                    <span style={{ color: 'var(--color-foreground)', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/album/${albumId}/edit`)}>
                      Edit to add tracks
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Portrait: stacked ── */
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', overflowX: 'hidden' }}>

            {/* Cover + vinyl */}
            <div style={{ padding: '32px 32px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Vinyl disc behind the art */}
                <div style={{ position: 'absolute', right: -28, top: 110, transform: 'translateY(-50%)', zIndex: 0 }}>
                  <VinylDisc size={200} />
                </div>

                {/* Album art */}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1,    opacity: 1 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position:     'relative',
                    zIndex:        1,
                    width:         220,
                    height:        220,
                    borderRadius: '8px',
                    overflow:     'hidden',
                    boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
                  }}
                >
                  {artContent}
                </motion.div>

                {/* Floor reflection */}
                {album.coverImage && (
                  <div style={{ position: 'relative', zIndex: 1, width: 220, height: 44, overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                    <img
                      src={album.coverImage}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width:          '100%',
                        height:          44,
                        objectFit:      'cover',
                        objectPosition: 'center bottom',
                        transform:      'scaleY(-1)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
                        maskImage:       'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: '20px 24px 0', textAlign: 'center' }}
            >
              {album.artist && (
                <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-muted-foreground)', marginBottom: '4px' }}>
                  {album.artist}
                </p>
              )}
              <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-foreground)', lineHeight: 1.2 }}>
                {album.title}
              </h1>
              {album.year && (
                <p style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 300, marginTop: '4px' }}>
                  {album.year}
                </p>
              )}
            </motion.div>

            {/* Track list */}
            {tracks.length > 0 && (
              <div style={{ padding: '28px 0 48px' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', padding: '0 24px', marginBottom: '4px' }}>
                  Tracks
                </p>
                <div>{trackRows}</div>
              </div>
            )}

            {tracks.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px', fontWeight: 300 }}>
                  No tracks added yet.{' '}
                  <span style={{ color: 'var(--color-foreground)', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/album/${albumId}/edit`)}>
                    Edit to add tracks
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Delete confirmation bottom sheet ── */}
        <AnimatePresence>
          {showDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position:   'fixed',
                inset:       0,
                background: 'rgba(0,0,0,0.4)',
                zIndex:      50,
                display:    'flex',
                alignItems: 'flex-end',
                padding:     16,
              }}
              onClick={() => setShowDelete(false)}
            >
              <motion.div
                initial={{ y: 48 }}
                animate={{ y: 0  }}
                exit={{    y: 48 }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                onClick={e => e.stopPropagation()}
                style={{
                  width:        '100%',
                  maxWidth:      440,
                  margin:       '0 auto',
                  background:   'var(--color-card)',
                  borderRadius:  24,
                  padding:      '24px 24px 28px',
                }}
              >
                <p style={{ fontSize: '15px', color: 'var(--color-muted-foreground)', fontWeight: 300, lineHeight: 1.5, marginBottom: 20 }}>
                  Remove{' '}
                  <strong style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>{album.title}</strong>
                  {' '}from your collection?
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleDelete}
                    style={{
                      flex:         1,
                      padding:     '12px',
                      borderRadius: 14,
                      background:  'oklch(55% 0.18 25)',
                      color:       'white',
                      fontSize:     14,
                      fontWeight:   600,
                    }}
                  >
                    Remove
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowDelete(false)}
                    style={{
                      flex:         1,
                      padding:     '12px',
                      borderRadius: 14,
                      background:  'var(--color-secondary)',
                      color:       'var(--color-foreground)',
                      fontSize:     14,
                      fontWeight:   500,
                    }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageTransition>
    </>
  )
}

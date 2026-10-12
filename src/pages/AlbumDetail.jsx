import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, animate, useMotionValue, useTransform, frame } from 'framer-motion'
import { useGesture, useDrag } from '@use-gesture/react'
import { MoreHorizontal, Edit3, Trash2, Music } from 'lucide-react'
import { useCollectionContext } from '../App'
import { useViewport } from '../hooks/useViewport'
import PageTransition, { goBack } from '../components/layout/PageTransition'
import { useFlight } from '../lib/coverFlight'
import { sampleColor, setAmbient } from '../lib/ambient'

const CLOSE_DIST = 90   // px of downward drag that commits to going back
const CLOSE_VEL  = 500  // px/s downward flick that goes back from a shorter drag

// Entrance choreography after the cover lands: cover (0–.55s) → vinyl (.3) → metadata (.25) → tracks (.35+)
const trackVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + Math.min(i, 10) * 0.035, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

function VinylDisc({ size = 180 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <circle cx="90" cy="90" r="89" fill="#1C1C1E" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
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
  const { albums, loading, removeAlbum } = useCollectionContext()
  const [showOptions, setShowOptions] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const optionsRef = useRef(null)
  const { isLandscape, isTablet } = useViewport()

  const album = albums.find(a => a.id === albumId)
  const flight = useFlight()
  const coverHidden = flight?.id === albumId // the flight overlay stands in for the cover

  useEffect(() => {
    if (!album?.coverImage) return
    let live = true
    sampleColor(album.coverImage).then(rgb => { if (live) setAmbient(rgb) }).catch(() => {})
    return () => { live = false }
  }, [album?.coverImage])

  // Swipe down on the cover: it follows the finger, the page content recedes, and releasing
  // past the threshold flies the cover back into the gallery (the reverse of swipe-up-to-open)
  const coverY = useMotionValue(0)
  const coverScale = useTransform(coverY, [0, 240], [1, 0.9])
  // Everything except the cover (vinyl, reflection, title, tracks) fades with the drag, and
  // clears out quickly once any "back" flight starts so no ghost lingers behind the gallery
  const leaving = useMotionValue(1)
  const contentFade = useTransform([coverY, leaving], ([y, l]) => l * (1 - Math.min(1, Math.max(0, y / 150))))
  const leavingNow = flight?.id === albumId && flight.dir === 'out'
  useEffect(() => {
    if (leavingNow) animate(leaving, 0, { duration: 0.12, ease: 'easeOut' })
  }, [leavingNow, leaving])
  const coverAnim = useRef(null)
  const bindCover = useDrag(
    ({ first, last, movement: [, my], velocity: [, vy], direction: [, diry] }) => {
      if (first) coverAnim.current?.stop()
      coverY.set(my > 0 ? my : my * 0.2) // upward only gives a little resistance
      if (!last) return
      const vY = diry * vy * 1000 // px/s, positive = downward
      // postRender: measure the cover only after Motion has painted the final drag position
      if (my > CLOSE_DIST || (vY > CLOSE_VEL && my > 24)) frame.postRender(() => goBack(navigate, { velocityY: vY }))
      else coverAnim.current = animate(coverY, 0, { type: 'spring', stiffness: 380, damping: 36, velocity: vY })
    },
    { axis: 'y', threshold: 6, eventOptions: { passive: false } }
  )

  // Pinch in to zoom back out to the carousel
  const pinchScale = useMotionValue(1)
  const bindPinch = useGesture(
    {
      onPinch: ({ offset: [sc] }) => pinchScale.set(Math.min(1.04, Math.max(0.8, sc))),
      onPinchEnd: () => {
        if (pinchScale.get() < 0.9) goBack(navigate)
        else animate(pinchScale, 1, { type: 'spring', stiffness: 300, damping: 30 })
      },
    },
    { pinch: { from: () => [1, 0], scaleBounds: { min: 0.8, max: 1.04 }, rubberband: true }, eventOptions: { passive: false } }
  )

  useEffect(() => {
    // Wait for the local DB to load before treating a missing album as deleted
    if (!album && !loading) navigate('/', { replace: true })
  }, [album, loading, navigate])

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
        display:    'block',
        width:      '100%',
        padding:    '0 24px',
        background: 'transparent',
        textAlign:  'left',
        cursor:     'pointer',
      }}
    >
      <div
        style={{
          display:      'flex',
          alignItems:   'baseline',
          gap:           18,
          padding:      '17px 0',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: '12px', letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums', color: 'var(--color-muted-foreground)', fontWeight: 400, width: '20px', flexShrink: 0 }}>
          {String(i + 1).padStart(2, '0')}
        </span>
        <span style={{ fontSize: '15px', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--color-foreground)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title || 'Untitled'}
        </span>
      </div>
    </motion.button>
  ))

  return (
    <>
      {/* ── Options button — portalled so it stays above the header fade ── */}
      {createPortal(
      <div
        ref={optionsRef}
        style={{ position: 'fixed', top: 10, right: 16, zIndex: 35 }}
      >
        <motion.button
          type="button"
          className="glass"
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowOptions(v => !v)}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:           36,
            height:          36,
            borderRadius:   '999px',
            color:          'var(--color-foreground)',
          }}
        >
          <MoreHorizontal size={18} strokeWidth={1.75} />
        </motion.button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              className="glass"
              initial={{ opacity: 0, scale: 0.93, y: -4 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.93, y: -4 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position:        'absolute',
                top:             'calc(100% + 6px)',
                right:            0,
                borderRadius:     14,
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
      </div>,
        document.body
      )}

      <PageTransition>
        <motion.div {...bindPinch()} style={{ scale: pinchScale, flex: 1, minWidth: 0, width: '100%', touchAction: 'pan-y', transformOrigin: '50% 30%' }}>
        {isTabletLandscape ? (
          /* ── Landscape: two-column ── */
          <div
            style={{
              width:       '100%',
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
                <motion.div style={{ position: 'absolute', right: -28, top: 130, transform: 'translateY(-50%)', zIndex: 0, opacity: contentFade }}>
                  <motion.div initial={{ x: -64, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.15, duration: 0.7, delay: 0.3 }}>
                    <VinylDisc size={220} />
                  </motion.div>
                </motion.div>

                {/* Album art */}
                <motion.div
                  data-cover-slot={albumId}
                  data-cover-page="detail"
                  {...bindCover()}
                  style={{
                    y: coverY,
                    scale: coverScale,
                    touchAction: 'none',
                    cursor: 'grab',
                    opacity:      coverHidden ? 0 : 1,
                    position:     'relative',
                    zIndex:        1,
                    width:         260,
                    height:        260,
                    borderRadius: '8px',
                    overflow:     'hidden',
                    boxShadow:    '0 12px 36px rgba(0,0,0,0.14)',
                  }}
                >
                  {artContent}
                </motion.div>

                {/* Floor reflection */}
                {album.coverImage && (
                  <motion.div style={{ position: 'relative', zIndex: 1, width: 260, height: 52, overflow: 'hidden', borderRadius: '8px 8px 0 0', opacity: contentFade }}>
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
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right: metadata + tracks */}
            <motion.div style={{ flex: 1, paddingTop: 4, opacity: contentFade }}>
              {/* Metadata — left aligned in landscape */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ paddingBottom: 28 }}
              >
                {album.artist && (
                  <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '12px' }}>
                    {album.artist}
                  </p>
                )}
                <h1 style={{ fontSize: '34px', fontWeight: 500, letterSpacing: '-0.035em', color: 'var(--color-foreground)', lineHeight: 1.1, textWrap: 'balance' }}>
                  {album.title}
                </h1>
                {album.year && (
                  <p style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums', color: 'var(--color-muted-foreground)', marginTop: '14px' }}>
                    {album.year}
                  </p>
                )}
              </motion.div>

              {/* Track list */}
              {tracks.length > 0 && (
                <div style={{ paddingBottom: 48 }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', padding: '0 24px 4px' }}>
                    <span>Tracks</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(tracks.length).padStart(2, '0')}</span>
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
            </motion.div>
          </div>
        ) : (
          /* ── Portrait: stacked ── */
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', overflowX: 'hidden' }}>

            {/* Cover + vinyl */}
            <div style={{ padding: '44px 32px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Vinyl disc behind the art */}
                <motion.div style={{ position: 'absolute', right: -28, top: 110, transform: 'translateY(-50%)', zIndex: 0, opacity: contentFade }}>
                  <motion.div initial={{ x: -64, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.15, duration: 0.7, delay: 0.3 }}>
                    <VinylDisc size={200} />
                  </motion.div>
                </motion.div>

                {/* Album art */}
                <motion.div
                  data-cover-slot={albumId}
                  data-cover-page="detail"
                  {...bindCover()}
                  style={{
                    y: coverY,
                    scale: coverScale,
                    touchAction: 'none',
                    cursor: 'grab',
                    opacity:      coverHidden ? 0 : 1,
                    position:     'relative',
                    zIndex:        1,
                    width:         220,
                    height:        220,
                    borderRadius: '8px',
                    overflow:     'hidden',
                    boxShadow:    '0 12px 36px rgba(0,0,0,0.14)',
                  }}
                >
                  {artContent}
                </motion.div>

                {/* Floor reflection */}
                {album.coverImage && (
                  <motion.div style={{ position: 'relative', zIndex: 1, width: 220, height: 44, overflow: 'hidden', borderRadius: '8px 8px 0 0', opacity: contentFade }}>
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
                  </motion.div>
                )}
              </div>
            </div>

            <motion.div style={{ opacity: contentFade }}>
            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: '36px 32px 0', textAlign: 'center' }}
            >
              {album.artist && (
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '12px' }}>
                  {album.artist}
                </p>
              )}
              <h1 style={{ fontSize: '30px', fontWeight: 500, letterSpacing: '-0.035em', color: 'var(--color-foreground)', lineHeight: 1.1, textWrap: 'balance' }}>
                {album.title}
              </h1>
              {album.year && (
                <p style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums', color: 'var(--color-muted-foreground)', marginTop: '14px' }}>
                  {album.year}
                </p>
              )}
            </motion.div>

            {/* Track list */}
            {tracks.length > 0 && (
              <div style={{ padding: '44px 0 72px' }}>
                <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', padding: '0 24px 4px' }}>
                  <span>Tracks</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(tracks.length).padStart(2, '0')}</span>
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
            </motion.div>
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
        </motion.div>
      </PageTransition>
    </>
  )
}

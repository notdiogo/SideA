import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCollectionContext } from '../App'
import { useSwipe } from '../hooks/useSwipe'
import { useViewport } from '../hooks/useViewport'
import { fetchLyrics } from '../lib/lyrics'
import { sampleColor, setAmbient } from '../lib/ambient'

const navButtonStyle = (disabled) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 44, height: 44, borderRadius: '999px', background: 'transparent',
  color: 'var(--color-foreground)', opacity: disabled ? 0.3 : 1, transition: 'opacity 0.2s',
})

export default function Lyrics() {
  const { albumId, trackId } = useParams()
  const navigate = useNavigate()
  const { albums, loading, updateAlbum } = useCollectionContext()
  const [currentTrackId, setCurrentTrackId] = useState(trackId)
  const [direction, setDirection] = useState(0)
  const [fetchState, setFetchState] = useState('idle')
  const [navVisible, setNavVisible] = useState(true)
  const scrollTimer = useRef(null)
  const lastScrollY = useRef(0)
  const { isLandscape, isTablet } = useViewport()

  const album = albums.find(a => a.id === albumId)

  useEffect(() => {
    // Wait for the local DB to load before treating a missing album as deleted
    if (!album && !loading) navigate('/', { replace: true })
  }, [album, loading, navigate])

  useEffect(() => {
    setCurrentTrackId(trackId)
  }, [trackId])

  useEffect(() => {
    if (!album?.coverImage) return
    let live = true
    sampleColor(album.coverImage).then(rgb => { if (live) setAmbient(rgb) }).catch(() => {})
    return () => { live = false }
  }, [album?.coverImage])

  if (!album) return null

  const tracks = album.tracks || []
  const currentIndex = tracks.findIndex(t => t.id === currentTrackId)
  const currentTrack = tracks[currentIndex]

  if (!currentTrack) {
    navigate(`/album/${albumId}`, { replace: true })
    return null
  }

  // Fetch lyrics + reset nav auto-hide on track change
  useEffect(() => {
    setNavVisible(true)
    lastScrollY.current = 0
    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => setNavVisible(false), 2000)

    if (!currentTrack.lyrics && album.artist && currentTrack.title) {
      setFetchState('loading')
      fetchLyrics(album.artist, currentTrack.title).then(text => {
        if (text) {
          updateAlbum({
            ...album,
            tracks: album.tracks.map(t =>
              t.id === currentTrack.id ? { ...t, lyrics: text } : t
            ),
          })
        }
        setFetchState('done')
      })
    } else {
      setFetchState('done')
    }

    return () => clearTimeout(scrollTimer.current)
  }, [currentTrackId])

  const goTo = (newIndex, dir) => {
    if (newIndex < 0 || newIndex >= tracks.length) return
    setDirection(dir)
    const newTrack = tracks[newIndex]
    setCurrentTrackId(newTrack.id)
    navigate(`/album/${albumId}/track/${newTrack.id}`, { replace: true })
  }

  const goPrev = () => goTo(currentIndex - 1, -1)
  const goNext = () => goTo(currentIndex + 1, 1)

  const swipeHandlers = useSwipe({ onSwipeLeft: goNext, onSwipeRight: goPrev })

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop
    const isScrollingDown = scrollTop > lastScrollY.current
    lastScrollY.current = scrollTop

    if (isScrollingDown) {
      clearTimeout(scrollTimer.current)
      setNavVisible(false)
    } else {
      setNavVisible(true)
      clearTimeout(scrollTimer.current)
      scrollTimer.current = setTimeout(() => setNavVisible(false), 2000)
    }
  }

  const lyricsVariants = {
    initial: (dir) => ({ opacity: 0, x: dir * 60 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    exit: (dir) => ({ opacity: 0, x: dir * -60, transition: { duration: 0.2 } }),
  }

  const updatedTrack = tracks.find(t => t.id === currentTrackId) ?? currentTrack
  const isPrevDisabled = currentIndex === 0
  const isNextDisabled = currentIndex === tracks.length - 1

  // Shared: navigation dots
  const navDots = tracks.length <= 12 && (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {tracks.map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ width: i === currentIndex ? 16 : 6, opacity: i === currentIndex ? 1 : 0.25 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: 6, borderRadius: 3, cursor: 'pointer', backgroundColor: 'var(--color-foreground)', flexShrink: 0 }}
          onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
        />
      ))}
    </div>
  )

  // Shared: lyrics body (loading / text / unavailable)
  const lyricsBody = (
    <>
      {fetchState === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '12px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={20} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
          </motion.div>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px', fontWeight: 300 }}>Fetching lyrics…</p>
        </div>
      )}
      {fetchState === 'done' && updatedTrack.lyrics && (
        <p style={{ fontSize: '18px', lineHeight: 'var(--leading-loose)', letterSpacing: '-0.005em', color: 'var(--color-foreground)', whiteSpace: 'pre-wrap', maxWidth: '68ch', margin: '0 auto', fontWeight: 400, textAlign: isTablet && isLandscape ? 'left' : 'center', textWrap: 'pretty' }}>
          {updatedTrack.lyrics}
        </p>
      )}
      {fetchState === 'done' && !updatedTrack.lyrics && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '8px' }}>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px', fontWeight: 300 }}>
            Lyrics not available
          </p>
          <span
            style={{ color: 'var(--color-foreground)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => navigate(`/album/${albumId}/edit`)}
          >
            Add manually
          </span>
        </div>
      )}
    </>
  )

  // ── Landscape two-column layout (tablet only) ─────────────────────────────
  if (isTablet && isLandscape) {
    return (
      <div
        style={{
          height:        'calc(100dvh - var(--nav-height))',
          display:       'flex',
          flexDirection: 'row',
        }}
        {...swipeHandlers}
      >
        {/* Left panel: track info + navigation */}
        <div
          style={{
            width:         272,
            flexShrink:    0,
            display:       'flex',
            flexDirection: 'column',
            padding:       '32px 28px',
            borderRight:   '1px solid var(--color-border)',
          }}
        >
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '8px', fontWeight: 500 }}>
              {album.title}
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-foreground)', lineHeight: 1.2 }}>
              {updatedTrack.title}
            </h1>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 300 }}>
              {currentIndex + 1} / {tracks.length}
            </span>
            {navDots}
            <div className="glass" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, alignSelf: 'flex-start' }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={goPrev}
                disabled={isPrevDisabled}
                style={navButtonStyle(isPrevDisabled)}
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={goNext}
                disabled={isNextDisabled}
                style={navButtonStyle(isNextDisabled)}
              >
                <ChevronRight size={20} strokeWidth={1.5} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right panel: scrollable lyrics */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentTrackId}
              custom={direction}
              variants={lyricsVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '32px 40px' }}
            >
              {lyricsBody}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ── Portrait layout ───────────────────────────────────────────────────────
  return (
    <div
      style={{
        height:        'calc(100dvh - var(--nav-height))',
        display:       'flex',
        flexDirection: 'column',
        position:      'relative',
        overflow:      'hidden',
      }}
      {...swipeHandlers}
    >
      {/* Lyrics area — title scrolls with lyrics */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentTrackId}
            custom={direction}
            variants={lyricsVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position:      'absolute',
              inset:          0,
              overflowY:     'auto',
              // Extra bottom padding so last lyric line stays above the nav bar
              padding:       'calc(24px + env(safe-area-inset-top, 0px)) 24px calc(96px + env(safe-area-inset-bottom, 0px))',
            }}
            onScroll={handleScroll}
          >
            {/* Track header — scrolls with the lyrics */}
            <div style={{ textAlign: 'center', marginBottom: '36px', paddingTop: '8px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', marginBottom: '10px', fontWeight: 500 }}>
                {album.title}
              </p>
              <h1 style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-foreground)', lineHeight: 1.15, textWrap: 'balance' }}>
                {updatedTrack.title}
              </h1>
            </div>

            {lyricsBody}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating glass control — slides out on scroll-down / after 2s */}
      <motion.div
        className="glass"
        animate={{ y: navVisible ? 0 : 'calc(100% + 32px)' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position:       'absolute',
          bottom:         'max(16px, env(safe-area-inset-bottom))',
          left:            16,
          right:           16,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '8px 10px',
          borderRadius:    999,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={goPrev}
          disabled={isPrevDisabled}
          style={navButtonStyle(isPrevDisabled)}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </motion.button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 300 }}>
            {currentIndex + 1} / {tracks.length}
          </span>
          {navDots}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={goNext}
          disabled={isNextDisabled}
          style={navButtonStyle(isNextDisabled)}
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </motion.button>
      </motion.div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCollectionContext } from '../App'
import { useSwipe } from '../hooks/useSwipe'
import { fetchLyrics } from '../lib/lyrics'

export default function Lyrics() {
  const { albumId, trackId } = useParams()
  const navigate = useNavigate()
  const { albums, updateAlbum } = useCollectionContext()
  const [currentTrackId, setCurrentTrackId] = useState(trackId)
  const [direction, setDirection] = useState(0)
  // 'idle' | 'loading' | 'done'
  const [fetchState, setFetchState] = useState('idle')

  const album = albums.find(a => a.id === albumId)

  useEffect(() => {
    if (!album) navigate('/', { replace: true })
  }, [album, navigate])

  useEffect(() => {
    setCurrentTrackId(trackId)
  }, [trackId])

  if (!album) return null

  const tracks = album.tracks || []
  const currentIndex = tracks.findIndex(t => t.id === currentTrackId)
  const currentTrack = tracks[currentIndex]

  if (!currentTrack) {
    navigate(`/album/${albumId}`, { replace: true })
    return null
  }

  // Fetch lyrics on-demand when track has none stored
  useEffect(() => {
    if (currentTrack.lyrics) {
      setFetchState('done')
      return
    }
    if (!album.artist || !currentTrack.title) {
      setFetchState('done')
      return
    }

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

  const lyricsVariants = {
    initial: (dir) => ({ opacity: 0, x: dir * 60 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    exit: (dir) => ({ opacity: 0, x: dir * -60, transition: { duration: 0.2 } }),
  }

  // The track lyrics — may have been updated in context after fetch
  const updatedTrack = tracks.find(t => t.id === currentTrackId) ?? currentTrack

  const isPrevDisabled = currentIndex === 0
  const isNextDisabled = currentIndex === tracks.length - 1

  return (
    <div
      style={{
        minHeight:     'calc(100dvh - var(--nav-height))',
        display:       'flex',
        flexDirection: 'column',
        background:    'var(--color-background)',
      }}
      {...swipeHandlers}
    >
      {/* Track header */}
      <div style={{ padding: '20px 24px 0', textAlign: 'center', flexShrink: 0 }}>
        <p
          style={{
            fontSize:      '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:          'var(--color-muted-foreground)',
            marginBottom:  '6px',
            fontWeight:     500,
          }}
        >
          {album.title}
        </p>
        <h1
          style={{
            fontSize:      '20px',
            fontWeight:     600,
            letterSpacing: '-0.01em',
            color:          'var(--color-foreground)',
            lineHeight:     1.25,
          }}
        >
          {updatedTrack.title}
        </h1>
      </div>

      {/* Lyrics area */}
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
              position:  'absolute',
              inset:      0,
              overflowY: 'auto',
              padding:   '24px',
            }}
          >
            {/* Loading state */}
            {fetchState === 'loading' && (
              <div
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  height:         '40vh',
                  gap:            '12px',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 size={20} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
                </motion.div>
                <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px', fontWeight: 300 }}>Fetching lyrics…</p>
              </div>
            )}

            {/* Lyrics found */}
            {fetchState === 'done' && updatedTrack.lyrics && (
              <p
                style={{
                  fontSize:   '18px',
                  lineHeight: 'var(--leading-loose)',
                  color:      'var(--color-foreground)',
                  whiteSpace: 'pre-wrap',
                  maxWidth:   '68ch',
                  margin:     '0 auto',
                  fontWeight:  400,
                }}
              >
                {updatedTrack.lyrics}
              </p>
            )}

            {/* Lyrics unavailable */}
            {fetchState === 'done' && !updatedTrack.lyrics && (
              <div
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  height:         '40vh',
                  gap:            '8px',
                }}
              >
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <div
        style={{
          flexShrink:          0,
          display:             'flex',
          alignItems:          'center',
          justifyContent:      'space-between',
          padding:             '16px 24px',
          paddingBottom:       'max(16px, env(safe-area-inset-bottom))',
          background:          'var(--color-nav-bg)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          disabled={isPrevDisabled}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:           44,
            height:          44,
            borderRadius:   '999px',
            background:     isPrevDisabled ? 'transparent' : 'var(--color-secondary)',
            color:          'var(--color-muted-foreground)',
            opacity:         isPrevDisabled ? 0.35 : 1,
            transition:     'opacity 0.2s',
          }}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </motion.button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-muted-foreground)', fontWeight: 300 }}>
            {currentIndex + 1} / {tracks.length}
          </span>
          {tracks.length <= 12 && (
            <div style={{ display: 'flex', gap: '4px' }}>
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
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goNext}
          disabled={isNextDisabled}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:           44,
            height:          44,
            borderRadius:   '999px',
            background:     isNextDisabled ? 'transparent' : 'var(--color-secondary)',
            color:          'var(--color-muted-foreground)',
            opacity:         isNextDisabled ? 0.35 : 1,
            transition:     'opacity 0.2s',
          }}
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCollectionContext } from '../App'
import { useSwipe } from '../hooks/useSwipe'

export default function Lyrics() {
  const { albumId, trackId } = useParams()
  const navigate = useNavigate()
  const { albums } = useCollectionContext()
  const [currentTrackId, setCurrentTrackId] = useState(trackId)
  const [direction, setDirection] = useState(0)

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

  const goTo = (newIndex, dir) => {
    if (newIndex < 0 || newIndex >= tracks.length) return
    setDirection(dir)
    const newTrack = tracks[newIndex]
    setCurrentTrackId(newTrack.id)
    navigate(`/album/${albumId}/track/${newTrack.id}`, { replace: true })
  }

  const goPrev = () => goTo(currentIndex - 1, -1)
  const goNext = () => goTo(currentIndex + 1, 1)

  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  })

  const lyricsVariants = {
    initial: (dir) => ({ opacity: 0, x: dir * 60 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    exit: (dir) => ({ opacity: 0, x: dir * -60, transition: { duration: 0.2 } }),
  }

  return (
    <div
      style={{
        minHeight: 'calc(100dvh - var(--nav-height))',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-background)',
      }}
      {...swipeHandlers}
    >
      {/* Track header */}
      <div
        style={{
          padding: '20px 24px 0',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-muted-foreground)',
            marginBottom: '6px',
          }}
        >
          {album.title}
        </p>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--color-foreground)',
            lineHeight: 1.25,
          }}
        >
          {currentTrack.title}
        </h1>
      </div>

      {/* Lyrics area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentTrackId}
            custom={direction}
            variants={lyricsVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              padding: '24px 24px 24px',
            }}
          >
            {currentTrack.lyrics ? (
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: 'var(--leading-loose)',
                  color: 'var(--color-foreground)',
                  whiteSpace: 'pre-wrap',
                  maxWidth: '68ch',
                  margin: '0 auto',
                }}
              >
                {currentTrack.lyrics}
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '40vh',
                  gap: '8px',
                }}
              >
                <p style={{ color: 'var(--color-muted-foreground)', fontSize: '14px' }}>
                  No lyrics for this track
                </p>
                <span
                  style={{ color: 'var(--color-primary)', fontSize: '13px', cursor: 'pointer' }}
                  onClick={() => navigate(`/album/${albumId}/edit`)}
                >
                  Add lyrics
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(15, 13, 8, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: currentIndex === 0 ? 'transparent' : 'var(--color-secondary)',
            color: currentIndex === 0 ? 'var(--color-border)' : 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
            opacity: currentIndex === 0 ? 0.3 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronLeft size={20} />
        </motion.button>

        {/* Track position indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-muted-foreground)',
              letterSpacing: '0.04em',
            }}
          >
            {currentIndex + 1} / {tracks.length}
          </span>
          {/* Dot indicators (max 7 shown) */}
          {tracks.length <= 12 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {tracks.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === currentIndex ? 16 : 4,
                    backgroundColor: i === currentIndex
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                  }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    height: 4,
                    borderRadius: 2,
                    cursor: 'pointer',
                  }}
                  onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                />
              ))}
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goNext}
          disabled={currentIndex === tracks.length - 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: currentIndex === tracks.length - 1 ? 'transparent' : 'var(--color-secondary)',
            color: currentIndex === tracks.length - 1 ? 'var(--color-border)' : 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
            opacity: currentIndex === tracks.length - 1 ? 0.3 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>
    </div>
  )
}

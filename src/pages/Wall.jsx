import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, ChevronRight } from 'lucide-react'
import { useCollectionContext } from '../App'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/layout/PageTransition'

function useCardSize() {
  const calc = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight - 56
    if (vw < 640) return Math.min(Math.round(vw * 0.72), 320)
    return Math.min(Math.round(vh * 0.5), Math.round(vw * 0.38), 380)
  }
  const [size, setSize] = useState(calc)
  useEffect(() => {
    const h = () => setSize(calc())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return size
}

// Compute slot (position relative to current index) with infinite wrap
function slotOf(albumIdx, currentIndex, n) {
  if (n === 0) return 0
  let s = ((albumIdx - currentIndex) % n + n) % n
  if (s > Math.floor(n / 2)) s -= n
  return s
}

const SPACING   = 0.68   // center-to-center gap as fraction of cardSize
const SCALE_DRP = 0.15   // scale reduction per slot step
const OPACITY_DRP = 0.18 // opacity reduction per slot step
const RENDER_R  = 3      // render ±3 slots (invisible beyond ±2)
const VISIBLE_R = 2

// Module-level: persists across React Router navigation, resets on page refresh
let _carouselIndex = 0

export default function Wall() {
  const { albums, loading, viewMode } = useCollectionContext()
  const navigate = useNavigate()
  const cardSize = useCardSize()
  const [index, setIndex] = useState(_carouselIndex)

  const sorted = useMemo(
    () => [...albums].sort((a, b) => (a.artist || '').localeCompare(b.artist || '')),
    [albums]
  )

  // Keep module var in sync so it survives unmount
  useEffect(() => { _carouselIndex = index }, [index])

  // Guard: reset if albums shrink below current index
  useEffect(() => {
    if (sorted.length > 0 && index >= sorted.length) setIndex(0)
  }, [sorted.length])

  // Keyboard navigation
  useEffect(() => {
    if (!sorted.length) return
    const n = sorted.length
    const handler = (e) => {
      if (e.key === 'ArrowRight') setIndex(i => ((i + 1) % n + n) % n)
      else if (e.key === 'ArrowLeft') setIndex(i => ((i - 1) % n + n) % n)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sorted.length])

  const goTo = (delta) => {
    const n = sorted.length
    setIndex(i => ((i + delta) % n + n) % n)
  }

  if (loading) {
    return (
      <PageTransition>
        <div style={{ height: 'calc(100dvh - var(--nav-height))' }} />
      </PageTransition>
    )
  }

  if (!sorted.length) {
    return (
      <PageTransition>
        <EmptyState />
      </PageTransition>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <PageTransition>
        <div
          style={{
            overflowY: 'auto',
            height:    'calc(100dvh - var(--nav-height))',
          }}
        >
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {sorted.map(album => (
            <button
              key={album.id}
              type="button"
              onClick={() => navigate(`/album/${album.id}`)}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:          12,
                width:       '100%',
                padding:     '10px 16px',
                borderBottom:'1px solid var(--color-border)',
                background:  'none',
                cursor:      'pointer',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width:        52,
                  height:       52,
                  borderRadius:  8,
                  overflow:     'hidden',
                  flexShrink:    0,
                  background:   'var(--color-secondary)',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                }}
              >
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Music size={18} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <p style={{
                  fontSize:     15,
                  fontWeight:   500,
                  color:       'var(--color-foreground)',
                  overflow:    'hidden',
                  textOverflow:'ellipsis',
                  whiteSpace:  'nowrap',
                }}>
                  {album.title}
                </p>
                {album.artist && (
                  <p style={{
                    fontSize:     13,
                    fontWeight:   300,
                    color:       'var(--color-muted-foreground)',
                    marginTop:    2,
                    overflow:    'hidden',
                    textOverflow:'ellipsis',
                    whiteSpace:  'nowrap',
                  }}>
                    {album.artist}
                  </p>
                )}
              </div>

              <ChevronRight size={16} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
            </button>
          ))}
          </div>
        </div>
      </PageTransition>
    )
  }

  // ── Carousel view ──────────────────────────────────────────────────────────
  const current = sorted[index]
  const reflectionH = Math.round(cardSize * 0.18)
  const containerH  = cardSize + reflectionH

  return (
    <PageTransition>
      <div
        style={{
          height: 'calc(100dvh - var(--nav-height))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {/* Pan area — detects swipe without moving the container */}
        <motion.div
          style={{
            position: 'relative',
            width: '100%',
            height: containerH,
            touchAction: 'pan-y',
          }}
          onPanEnd={(_, info) => {
            const dist  = Math.abs(info.offset.x)
            const vel   = Math.abs(info.velocity.x)
            if (dist < 30 && vel < 300) return
            const steps = Math.max(1, Math.round(dist / (cardSize * SPACING * 0.7)))
            const bonus = vel > 800 ? 1 : 0
            const delta = Math.min(steps + bonus, 4) * (info.offset.x < 0 ? 1 : -1)
            goTo(delta)
          }}
        >
          {sorted.map((album, albumIdx) => {
            const slot = slotOf(albumIdx, index, sorted.length)
            if (Math.abs(slot) > RENDER_R) return null
            const abs     = Math.abs(slot)
            const visible = abs <= VISIBLE_R
            const radius  = Math.round(cardSize * 0.08)

            return (
              <motion.div
                key={album.id}
                animate={{
                  x:       (slot < 0 ? -1 : 1) * Math.min(abs, VISIBLE_R) * cardSize * SPACING,
                  scale:   1 - Math.min(abs, VISIBLE_R) * SCALE_DRP,
                  opacity: visible ? 1 - abs * OPACITY_DRP : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                style={{
                  position: 'absolute',
                  left:        '50%',
                  marginLeft:  -cardSize / 2,
                  top:          0,
                  zIndex:      10 - abs * 2,
                  cursor:      slot === 0 ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (slot === 0) navigate(`/album/${album.id}`)
                  else goTo(slot)
                }}
              >
                {/* Cover art */}
                <div
                  style={{
                    width:        cardSize,
                    height:       cardSize,
                    borderRadius: radius,
                    overflow:     'hidden',
                    background:   'var(--color-secondary)',
                    boxShadow:    slot === 0
                      ? '0 20px 60px rgba(0,0,0,0.18)'
                      : '0 6px 20px rgba(0,0,0,0.08)',
                  }}
                >
                  {album.coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      style={{
                        width:          '100%',
                        height:         '100%',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Music
                        size={Math.round(cardSize * 0.18)}
                        strokeWidth={1.5}
                        style={{ color: 'var(--color-muted-foreground)' }}
                      />
                    </div>
                  )}
                </div>

                {/* Reflection — center only, vertical flip, bottom of image at top */}
                {slot === 0 && album.coverImage && (
                  <div
                    style={{
                      width:        cardSize,
                      height:       reflectionH,
                      overflow:     'hidden',
                      borderRadius: '18px 18px 0 0',
                    }}
                  >
                    <img
                      src={album.coverImage}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      style={{
                        width:          '100%',
                        height:         reflectionH,
                        objectFit:      'cover',
                        objectPosition: 'center bottom',
                        transform:      'scaleY(-1)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
                        maskImage:       'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Centered label — only for the active album */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop:  28,
              textAlign:  'center',
              padding:    '0 32px',
              width:      '100%',
              maxWidth:   400,
            }}
          >
            <p
              style={{
                fontSize:      18,
                fontWeight:    600,
                color:         'var(--color-foreground)',
                letterSpacing: '-0.02em',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}
            >
              {current.title}
            </p>
            {current.artist && (
              <p
                style={{
                  fontSize:     14,
                  fontWeight:   300,
                  color:        'var(--color-muted-foreground)',
                  marginTop:    4,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}
              >
                {current.artist}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}

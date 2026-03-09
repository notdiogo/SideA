import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Music } from 'lucide-react'
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

export default function Wall() {
  const { albums, loading } = useCollectionContext()
  const navigate = useNavigate()
  const cardSize = useCardSize()
  const [index, setIndex] = useState(0)

  const sorted = useMemo(
    () => [...albums].sort((a, b) => (a.artist || '').localeCompare(b.artist || '')),
    [albums]
  )

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
            const isSwipe = Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 400
            if (isSwipe) goTo(info.offset.x < 0 ? 1 : -1)
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
                  x:       slot * cardSize * SPACING,
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
                    background:   '#E5E5E5',
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
                        style={{ color: '#9A9A9A' }}
                      />
                    </div>
                  )}
                </div>

                {/* Reflection — vertical flip only, 10% → 0% opacity */}
                {album.coverImage && (
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
                        width:        '100%',
                        height:       cardSize,
                        objectFit:    'cover',
                        transform:    'scaleY(-1)',
                        marginTop:    -(cardSize - reflectionH),
                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%)',
                        maskImage:       'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%)',
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
                color:         '#1A1A1A',
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
                  color:        '#9A9A9A',
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

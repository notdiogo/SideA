import { useState, useEffect, useMemo, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'
import { useGesture } from '@use-gesture/react'
import { Music } from 'lucide-react'
import { useCollectionContext } from '../App'
import EmptyState from '../components/ui/EmptyState'
import AlbumList from '../components/ui/AlbumList'
import PageTransition, { NavTypeContext } from '../components/layout/PageTransition'
import { sampleColor, setAmbient } from '../lib/ambient'
import { useFlight, startFlight, coverEl, rectOf } from '../lib/coverFlight'

function useCardSize() {
  const calc = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight - 56
    if (vw < 640)  return Math.min(Math.round(vw * 0.72), 320)
    if (vw < 1024) return Math.min(Math.round(vh * 0.52), Math.round(vw * 0.44), 420)
    return          Math.min(Math.round(vh * 0.55), Math.round(vw * 0.38), 460)
  }
  const [size, setSize] = useState(calc)
  useEffect(() => {
    const h = () => setSize(calc())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return size
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
// Signed distance in slots, wrapped into [-n/2, n/2) for the infinite carousel
const wrapDelta = (d, n) => (((d + n / 2) % n) + n) % n - n / 2

const SPACING     = 0.68  // center-to-center gap as fraction of cardSize
const SCALE_DRP   = 0.15  // scale reduction per slot step
const OPACITY_DRP = 0.18  // opacity reduction per slot step
const TILT_DEG    = 20    // rotateY at one slot away
const RENDER_R    = 3     // render ±3 slots (invisible beyond ±2)
const VISIBLE_R   = 2
const FLICK_PROJ  = 0.2   // slots of travel per (slot/s) of release velocity
const DIVE_AT     = 1.22  // pinch scale that commits to opening the album
const SPRING      = { type: 'spring', stiffness: 260, damping: 30 }

// Module-level: persists across React Router navigation, resets on page refresh.
// null until the first visit of a session, which pulls a record at random.
let _carouselIndex = null

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One cover. Its transform is derived from the shared continuous position `pos`,
// so it tracks the finger 1:1 while dragging and springs on release.
function CarouselCard({ album, albumIdx, n, pos, fan, reveal, cardSize, reflectionH, isCurrent }) {
  const flight  = useFlight()
  const d       = useTransform(pos, p => wrapDelta(albumIdx - p, n))
  // fan: 0 = every cover stacked behind the centre one, 1 = fully fanned out
  const x       = useTransform([d, fan], ([v, f]) => clamp(v, -VISIBLE_R, VISIBLE_R) * cardSize * SPACING * f)
  const scale   = useTransform([d, fan], ([v, f]) => 1 - Math.min(Math.abs(v), VISIBLE_R) * SCALE_DRP * f)
  const rotateY = useTransform([d, fan], ([v, f]) => -clamp(v, -1, 1) * TILT_DEG * f)
  const zIndex  = useTransform(d, v => Math.round(10 - Math.abs(v) * 2))
  // The centre cover fades in first (reveal); the others fade in as they slide out (fan)
  const opacity = useTransform([d, fan, reveal], ([v, f, r]) => {
    const a = Math.abs(v)
    const base = a <= VISIBLE_R
      ? 1 - a * OPACITY_DRP
      : Math.max(0, (1 - VISIBLE_R * OPACITY_DRP) * (RENDER_R - a))
    return base * (a < 0.5 ? r : f)
  })

  return (
    <motion.div
      style={{
        position:   'absolute',
        left:       '50%',
        marginLeft: -cardSize / 2,
        top:         0,
        x, scale, rotateY, opacity, zIndex,
        willChange: 'transform',
        cursor:     isCurrent ? 'pointer' : 'default',
      }}
    >
      {/* Cover art — shared element, morphs into the AlbumDetail cover */}
      <div
        data-cover-slot={album.id}
        data-cover-page="wall"
        style={{
          opacity:      flight?.id === album.id && flight.dir === 'out' ? 0 : 1,
          width:        cardSize,
          height:       cardSize,
          borderRadius: 8,
          overflow:     'hidden',
          background:   'var(--color-secondary)',
          boxShadow:    '0 12px 36px rgba(0,0,0,0.14)',
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music size={Math.round(cardSize * 0.18)} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
        )}
      </div>

      {/* Reflection — current album only */}
      {isCurrent && album.coverImage && (
        <div style={{ width: cardSize, height: reflectionH, overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
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
}

export default function Wall() {
  const { albums, loading, viewMode, session, authReady } = useCollectionContext()
  const navigate = useNavigate()
  const cardSize = useCardSize()

  const sorted = useMemo(
    () => [...albums].sort((a, b) => (a.artist || '').localeCompare(b.artist || '')),
    [albums]
  )
  const n = sorted.length

  // pos: continuous carousel position in slots (unbounded; wraps via modulo)
  const pos  = useMotionValue(_carouselIndex ?? 0)
  // dive: pinch-out zoom of the whole carousel (1 = rest)
  const dive = useMotionValue(1)
  // Landing intro: the centre record fades in, then the neighbours fan out from behind it.
  // Skipped (already 1) when coming back from an album so the cover can fly home.
  const { from } = useContext(NavTypeContext)
  const settled = _carouselIndex !== null && Boolean(from?.startsWith('/album'))
  const reveal = useMotionValue(settled ? 1 : 0)
  const fan    = useMotionValue(settled ? 1 : 0)
  const labelOpacity = useTransform([dive, reveal], ([dv, r]) => r * (1 - clamp((dv - 1) / 0.3, 0, 1)))
  const [index, setIndex] = useState(_carouselIndex ?? 0)
  const areaRef  = useRef(null)
  const anim     = useRef(null)
  const startPos = useRef(0)
  const pinching = useRef(false)
  const moved    = useRef(false)

  // Mirror the rounded position into React state (label, reflection, render window)
  useEffect(() => {
    if (!n) return
    const sync = (v) => {
      const i = ((Math.round(v) % n) + n) % n
      if (_carouselIndex !== null) _carouselIndex = i // stays null until the random pick below
      setIndex(i)
    }
    sync(pos.get())
    return pos.on('change', sync)
  }, [n, pos])

  // Landing on the Collection (app launch, or arriving from another tab) picks a random record
  // and plays the intro. Coming back from an album keeps your place.
  const landed = useRef(false)
  useEffect(() => {
    if (landed.current || loading || !authReady || n < 1) return // wait until the carousel is on screen
    landed.current = true
    if (_carouselIndex !== null && from?.startsWith('/album')) return

    if (n >= 2) {
      const cur = Math.round(pos.get())
      const curIdx = ((cur % n) + n) % n
      const target = _carouselIndex === null
        ? Math.floor(Math.random() * n)
        : (curIdx + 1 + Math.floor(Math.random() * (n - 1))) % n // any record but the one already showing
      _carouselIndex = target
      pos.set(cur + wrapDelta(target - curIdx, n)) // jump straight there; the intro does the showing
    } else {
      _carouselIndex = 0
    }

    if (prefersReducedMotion()) { reveal.set(1); fan.set(1); return }
    dive.set(0.95)
    animate(reveal, 1, { duration: 0.6, ease: [0.16, 1, 0.3, 1] })
    animate(dive, 1, { type: 'spring', bounce: 0, duration: 0.8 })
    animate(fan, 1, { type: 'spring', bounce: 0.1, duration: 1.0, delay: 0.45 })
  }, [n, pos, loading, authReady, from, reveal, fan, dive])

  const goTo = (delta) => {
    anim.current?.stop()
    anim.current = animate(pos, Math.round(pos.get()) + delta, SPRING)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!n) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') goTo(1)
      else if (e.key === 'ArrowLeft') goTo(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [n])

  const step = cardSize * SPACING
  const openCurrent = () => {
    const album = sorted[index]
    if (!album) return
    const el = coverEl(album.id, 'wall')
    if (el && album.coverImage) {
      startFlight({ id: album.id, src: album.coverImage, dir: 'in', from: rectOf(el) })
    }
    navigate(`/album/${album.id}`)
  }

  // Decode the focused cover ahead of time so the dive never stalls on first paint
  useEffect(() => {
    if (viewMode === 'list') { setAmbient(null); return }
    const src = sorted[index]?.coverImage
    if (!src) return
    const img = new Image()
    img.src = src
    img.decode?.().catch(() => {})
    let live = true
    sampleColor(src).then(rgb => { if (live) setAmbient(rgb) }).catch(() => {})
    return () => { live = false }
  }, [index, sorted, viewMode])

  // Tap (a click that wasn't a drag/pinch): open the centre cover, or bring a side cover forward
  const onAreaClick = (e) => {
    if (moved.current || pinching.current) return
    const rect = areaRef.current.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    if (Math.abs(dx) <= cardSize / 2) openCurrent()
    else goTo(clamp(Math.round(dx / step), -2, 2))
  }

  const bind = useGesture(
    {
      onDrag: ({ first, last, movement: [mx], velocity: [vx], direction: [dirx], pinching: isPinching, cancel }) => {
        if (isPinching || pinching.current) { cancel(); return }
        moved.current = true
        if (n < 2) return
        if (first) { anim.current?.stop(); startPos.current = pos.get() }
        if (!last) { pos.set(startPos.current - mx / step); return }
        // Release: project momentum, snap to the nearest slot, hand off velocity
        const v   = (-dirx * vx * 1000) / step // slots per second
        const cur = pos.get()
        const target = Math.round(clamp(cur + v * FLICK_PROJ, cur - 4, cur + 4))
        anim.current = animate(pos, target, { ...SPRING, velocity: v })
      },
      onPinchStart: () => { pinching.current = true; anim.current?.stop() },
      onPinch: ({ offset: [s] }) => dive.set(clamp(s, 0.92, 2.4)),
      onPinchEnd: () => {
        pinching.current = false
        if (dive.get() > DIVE_AT) openCurrent()
        else animate(dive, 1, { type: 'spring', stiffness: 300, damping: 30 })
      },
    },
    {
      drag:  { threshold: 6 },
      pinch: { from: () => [1, 0], scaleBounds: { min: 0.92, max: 2.4 }, rubberband: true },
      eventOptions: { passive: false },
    }
  )

  if (loading || !authReady) {
    return (
      <PageTransition>
        <div style={{ height: 'calc(var(--app-h) - var(--nav-height) - var(--tabbar-h, 0px))' }} />
      </PageTransition>
    )
  }

  if (!sorted.length) {
    return (
      <PageTransition>
        <EmptyState signedOut={!session} />
      </PageTransition>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <PageTransition>
        <AlbumList albums={sorted} onOpen={(album) => navigate(`/album/${album.id}`)} />
      </PageTransition>
    )
  }

  // ── Carousel view ──────────────────────────────────────────────────────────
  const current = sorted[index] || sorted[0]
  const reflectionH = Math.round(cardSize * 0.18)
  const containerH  = cardSize + reflectionH

  return (
    <PageTransition>
      <div
        style={{
          height: 'calc(var(--app-h) - var(--nav-height) - var(--tabbar-h, 0px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {/* Spare height goes mostly above the covers (≈10:1), so the record sits at the optical
            centre of the screen rather than the group of cover + title */}
        <div style={{ flex: 1, minHeight: 0 }} />

        {/* Gesture area — drag follows the finger, pinch-out dives into the album */}
        <motion.div
          ref={areaRef}
          {...bind()}
          onPointerDownCapture={() => { moved.current = false }}
          onClick={onAreaClick}
          style={{
            position: 'relative',
            width: '100%',
            height: containerH,
            touchAction: 'none',
            perspective: 1400,
            scale: dive,
            willChange: 'transform',
          }}
        >
          {sorted.map((album, albumIdx) => {
            if (Math.abs(wrapDelta(albumIdx - index, n)) > RENDER_R) return null
            return (
              <CarouselCard
                key={`${album.id}-${cardSize}`}
                album={album}
                albumIdx={albumIdx}
                n={n}
                pos={pos}
                fan={fan}
                reveal={reveal}
                cardSize={cardSize}
                reflectionH={reflectionH}
                isCurrent={albumIdx === index}
              />
            )
          })}
        </motion.div>

        {/* Centered label — only for the active album. Fixed-height slot, top-aligned, so a
            long title that wraps never shifts the covers between albums. */}
        <motion.div style={{ opacity: labelOpacity, width: '100%', maxWidth: 520, height: 132, marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: 'center', padding: '0 24px', width: '100%' }}
            >
              <p
                style={{
                  fontSize:      24,
                  fontWeight:    500,
                  lineHeight:    1.15,
                  color:         'var(--color-foreground)',
                  letterSpacing: '-0.03em',
                  textWrap:      'balance',
                  overflowWrap:  'anywhere',
                }}
              >
                {current.title}
              </p>
              {current.artist && (
                <p
                  style={{
                    fontSize:      17,
                    fontWeight:    400,
                    lineHeight:    1.25,
                    color:         'var(--color-muted-foreground)',
                    letterSpacing: '-0.01em',
                    marginTop:     8,
                    textWrap:      'balance',
                    overflowWrap:  'anywhere',
                  }}
                >
                  {current.artist}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div style={{ flex: 0.1, minHeight: 0 }} />
      </div>
    </PageTransition>
  )
}

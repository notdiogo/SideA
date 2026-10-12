import { useEffect } from 'react'
import { motion, animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { useFlight, endFlight, coverEl, rectOf } from '../../lib/coverFlight'

const FLIGHT = { type: 'spring', bounce: 0, duration: 0.55 }

// Fixed overlay that carries a cover between its carousel and album-page slots.
export default function CoverFlight() {
  const flight = useFlight()
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const s = useMotionValue(1)

  useEffect(() => {
    if (!flight) return
    if (reduce) { endFlight(); return }
    x.set(0); y.set(0); s.set(1)
    let cancelled = false
    let frames = 0
    let controls = []

    // Wait for the destination page to mount and lay out, then fly to its slot.
    const launch = () => {
      if (cancelled) return
      const el = coverEl(flight.id, flight.dir === 'in' ? 'detail' : 'wall')
      if (!el) {
        if (++frames > 24) endFlight()
        else requestAnimationFrame(launch)
        return
      }
      const to = rectOf(el)
      const { from } = flight
      const run = Promise.all([
        animate(x, to.x - from.x, FLIGHT),
        animate(y, to.y - from.y, FLIGHT),
        animate(s, to.w / from.w, FLIGHT),
      ].map(c => (controls.push(c), c)))
      run.then(() => { if (!cancelled) endFlight() })
    }
    requestAnimationFrame(launch)

    return () => { cancelled = true; controls.forEach(c => c.stop()) }
  }, [flight, reduce, x, y, s])

  if (!flight) return null
  const { from } = flight
  return (
    <motion.img
      src={flight.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{
        position:        'fixed',
        left:             from.x,
        top:              from.y,
        width:            from.w,
        height:           from.h,
        x, y, scale: s,
        transformOrigin: '0 0',
        objectFit:       'cover',
        borderRadius:     8,
        boxShadow:       '0 12px 36px rgba(0,0,0,0.14)',
        zIndex:           60,
        pointerEvents:   'none',
        willChange:      'transform',
      }}
    />
  )
}

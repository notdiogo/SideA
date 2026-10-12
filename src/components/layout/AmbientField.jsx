import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAmbient, setAmbient } from '../../lib/ambient'

// Large, static colour wash behind the app. Two radial gradients only (no blur
// filter, no animated paint): cross-fades are opacity changes on a composited layer.
export default function AmbientField() {
  const rgb = useAmbient()
  const { pathname } = useLocation()

  // Carousel, album page and lyrics carry album colour
  useEffect(() => {
    if (!/^\/(album\/[^/]+(\/track\/[^/]+)?)?$/.test(pathname)) setAmbient(null)
  }, [pathname])

  const key = rgb ? rgb.join(' ') : 'none'
  // Near-greys wash out to murk, so scale the wash by how colourful the cover is
  const chroma = rgb ? Math.max(...rgb) - Math.min(...rgb) : 0
  const k = 0.2 + 0.8 * Math.min(1, chroma / 90)
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        {rgb && (
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              willChange: 'opacity',
              '--ambient-k': k,
              background: `
                radial-gradient(120% 65% at 50% 38%, rgb(${key} / calc(var(--ambient-strength) * var(--ambient-k))) 0%, transparent 70%),
                radial-gradient(90% 55% at 85% 105%, rgb(${key} / calc(var(--ambient-strength) * var(--ambient-k) * 0.6)) 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

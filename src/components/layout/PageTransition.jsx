import { motion } from 'framer-motion'
import { useNavigationType } from 'react-router-dom'
import { startFlight, coverEl, rectOf } from '../../lib/coverFlight'

// Opacity-only: the cover travels in its own overlay (CoverFlight), and
// position:fixed children aren't trapped by a parent transform.
const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

const transition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
}

// Set by the in-app back control / pinch-out so a POP navigation still animates
// (and morphs the cover back into the carousel).
export const backNav = { current: false }
export function goBack(navigate) {
  const id = window.location.pathname.match(/\/album\/([^/]+)$/)?.[1]
  const el = id && coverEl(id, 'detail')
  const src = el?.querySelector('img')?.src
  if (el && src) startFlight({ id, src, dir: 'out', from: rectOf(el) })
  backNav.current = true
  setTimeout(() => { backNav.current = false }, 800)
  if (window.history.state?.idx > 0) navigate(-1)
  else navigate('/')
}

export default function PageTransition({ children, className = '' }) {
  const navType = useNavigationType()

  // For browser edge-swipe back, skip the enter/exit animation entirely — the
  // browser's own gesture handles the visual feedback, and mixing both causes
  // a double-flash.
  if (navType === 'POP' && !backNav.current) {
    return (
      <motion.div
        className={className}
        initial={false}
        exit={{ opacity: 0 }}
        transition={transition}
        style={{ flex: 1, minWidth: 0 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      style={{ flex: 1, minWidth: 0 }}
    >
      {children}
    </motion.div>
  )
}

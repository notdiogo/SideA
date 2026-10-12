import { createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { startFlight, coverEl, rectOf } from '../../lib/coverFlight'

// <Routes location={...}> makes React Router report every navigation as POP to the pages
// it renders, so App reads the real navigation type and passes it down here.
export const NavTypeContext = createContext({ type: 'PUSH', dir: 0, from: null })

// Direction (custom) comes from App: +1 pushes in from the right, -1 pops in from the
// left, 0 is a plain fade (used when a cover flies between the screens, so the
// destination cover isn't displaced while it is measured). Exits are shorter and
// smaller than enters, and travel only a short, layered distance.
const SLIDE = 28
const variants = {
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    (d = 0) => ({ opacity: 0, x: d * -SLIDE * 0.5, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }),
}

// Set by the in-app back control / pinch-out so a POP navigation still animates
// (and morphs the cover back into the carousel).
export const backNav = { current: false }
export function goBack(navigate, { velocityY = 0 } = {}) {
  const id = window.location.pathname.match(/\/album\/([^/]+)$/)?.[1]
  const el = id && coverEl(id, 'detail')
  const src = el?.querySelector('img')?.src
  if (el && src) startFlight({ id, src, dir: 'out', from: rectOf(el), velocityY })
  backNav.current = true
  setTimeout(() => { backNav.current = false }, 800)
  if (window.history.state?.idx > 0) navigate(-1)
  else navigate('/')
}

export default function PageTransition({ children, className = '' }) {
  const { type: navType, dir } = useContext(NavTypeContext)

  // For browser edge-swipe back, skip the enter/exit animation entirely — the
  // browser's own gesture handles the visual feedback, and mixing both causes
  // a double-flash.
  if (navType === 'POP' && !backNav.current) {
    return (
      <motion.div
        className={className}
        initial={false}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
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
      // Entering page: direction is known from context at mount. (Exit reads the live
      // direction from AnimatePresence's custom prop, which is what an exit needs.)
      initial={{ opacity: 0, x: dir * SLIDE }}
      animate="animate"
      exit="exit"
      style={{ flex: 1, minWidth: 0 }}
    >
      {children}
    </motion.div>
  )
}

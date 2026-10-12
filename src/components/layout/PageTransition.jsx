import { createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { startFlight, coverEl, rectOf } from '../../lib/coverFlight'

// <Routes location={...}> makes React Router report every navigation as POP to the pages
// it renders, so App reads the real navigation type and passes it down here.
export const NavTypeContext = createContext({ type: 'PUSH', dir: 0, from: null })

// AnimatePresence `custom` (from App): { dir, scroll, instant }
//  dir     +1 pushes in from the right, -1 pops in from the left, 0 is a plain fade (a cover is
//          flying between the screens, so the destination cover isn't displaced while measured)
//  scroll  window scroll at the moment of navigation. The page scrolls the document, which is
//          reset to the top for the new screen, so the leaving screen is shifted up by the same
//          amount to stay exactly where the user last saw it (no jump).
//  instant browser edge-swipe back: the OS already animated it, so the leaving screen just goes
// Exits are shorter and smaller than enters.
const SLIDE = 28
const variants = {
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: ({ dir = 0, scroll = 0, instant = false } = {}) => ({
    opacity: 0,
    x: instant ? 0 : dir * -SLIDE * 0.5,
    y: -scroll,
    transition: instant
      ? { duration: 0 }
      : { duration: 0.2, ease: [0.4, 0, 1, 1], y: { duration: 0 } },
  }),
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

// True when this screen was reached by the browser's own back/forward (edge swipe). The OS has
// already animated it, so entrance animations on the page and its content should not replay.
export function useSkipIntro() {
  const { type } = useContext(NavTypeContext)
  return type === 'POP' && !backNav.current
}

export default function PageTransition({ children, className = '' }) {
  const { dir } = useContext(NavTypeContext)
  const skipIntro = useSkipIntro()

  return (
    <motion.div
      className={className}
      variants={variants}
      // Entering page: direction is known from context at mount. (Exit reads the live custom
      // prop from AnimatePresence, which is what an exit needs.)
      initial={skipIntro ? false : { opacity: 0, x: dir * SLIDE }}
      animate="animate"
      exit="exit"
      style={{ flex: 1, minWidth: 0 }}
    >
      {children}
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { useNavigationType } from 'react-router-dom'

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}

const transition = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1],
}

export default function PageTransition({ children, className = '' }) {
  const navType = useNavigationType()

  // For back/pop navigations (browser edge swipe, in-app back button) skip
  // the enter/exit animation entirely — the browser's own gesture handles
  // the visual feedback, and mixing both causes the double-flash.
  if (navType === 'POP') {
    return (
      <div className={className} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
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
      style={{ flex: 1 }}
    >
      {children}
    </motion.div>
  )
}

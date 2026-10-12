import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, GalleryHorizontal, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollectionContext } from '../../App'
import { goBack } from './PageTransition'
import TabBar from './TabBar'

const TAB_ROOTS = ['/', '/add', '/profile']

const TITLES = { '/add': 'Add Record', '/profile': 'Profile' }

const VIEWS = [
  { key: 'carousel', label: 'Gallery view', Icon: GalleryHorizontal },
  { key: 'list',     label: 'List view',    Icon: List },
]

export default function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useCollectionContext()
  const isHome = location.pathname === '/'
  const isTabRoot = TAB_ROOTS.includes(location.pathname)

  const title = TITLES[location.pathname] ?? (location.pathname.endsWith('/edit') ? 'Edit Record' : null)
  const viewIndex = Math.max(0, VIEWS.findIndex(v => v.key === viewMode))

  return (
    <>
      {/* Fixed top bar: back (pushed pages), title, and the Gallery/List switch on Collection */}
      <header
        style={{
          position:       'fixed',
          top:             0,
          left:            0,
          right:           0,
          height:         'var(--nav-height)',
          zIndex:          30,
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'space-between',
          padding:        '0 16px',
          paddingTop:     'env(safe-area-inset-top)',
          pointerEvents:  'none',
        }}
      >
        {/* Scroll-edge effect: content blurs and dissolves under the controls, and the
            album colour wash still reaches the very top (no opaque band) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 'calc(100% + 24px)', zIndex: -1,
            background: 'color-mix(in oklab, var(--color-background) 30%, transparent)',
            WebkitBackdropFilter: 'blur(16px)',
            backdropFilter: 'blur(16px)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 22px), transparent)',
            maskImage: 'linear-gradient(to bottom, #000 calc(100% - 22px), transparent)',
          }}
        />
        <div style={{ minWidth: 88, display: 'flex', alignItems: 'center', height: 36 }}>
          {!isTabRoot && (
            <motion.button
              className="glass"
              whileTap={{ scale: 0.96 }}
              onClick={() => goBack(navigate)}
              aria-label="Back"
              style={{
                pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '999px', color: 'var(--color-foreground)',
              }}
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </motion.button>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 36 }}>
          {title && (
            <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--color-foreground)' }}>
              {title}
            </span>
          )}
        </div>

        <div style={{ minWidth: 88, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 36 }}>
          {isHome && (() => {
            // One button: shows the view you'd switch to, swaps on tap
            const next = VIEWS[1 - viewIndex]
            return (
              <motion.button
                type="button"
                className="glass"
                whileTap={{ scale: 0.96 }}
                onClick={() => setViewMode(next.key)}
                aria-label={`Switch to ${next.label.toLowerCase()}`}
                style={{
                  pointerEvents: 'auto', position: 'relative', width: 36, height: 36, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-foreground)',
                }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={next.key}
                    initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                    style={{ display: 'flex' }}
                  >
                    <next.Icon size={17} strokeWidth={1.7} />
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )
          })()}
        </div>
      </header>

      {/* Page content */}
      <main
        style={{
          paddingTop:     'var(--nav-height)',
          position:       'relative',
          zIndex:          1,
          flex:            1,
          display:        'flex',
          flexDirection:  'column',
        }}
      >
        {children}
      </main>

      <TabBar />
    </>
  )
}

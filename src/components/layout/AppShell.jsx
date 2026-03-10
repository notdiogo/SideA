import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreHorizontal, Plus, List, LayoutGrid, Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollectionContext } from '../../App'

const menuItemStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:         10,
  width:       '100%',
  padding:    '12px 16px',
  fontSize:    14,
  fontWeight:  400,
  color:      'var(--color-foreground)',
  textAlign:  'left',
}

export default function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { viewMode, setViewMode, theme, setTheme } = useCollectionContext()
  const isHome = location.pathname === '/'

  const [showOptions, setShowOptions] = useState(false)
  const optionsRef = useRef(null)

  const getTitle = () => {
    if (location.pathname === '/add') return 'Add Record'
    if (location.pathname.endsWith('/edit')) return 'Edit Record'
    return null
  }
  const title = getTitle()

  // Close on outside click
  useEffect(() => {
    if (!showOptions) return
    const handler = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showOptions])

  // Close on navigation
  useEffect(() => { setShowOptions(false) }, [location.pathname])

  return (
    <>
      {/* Fixed nav bar */}
      <header
        style={{
          position:            'fixed',
          top:                  0,
          left:                 0,
          right:                0,
          height:              'var(--nav-height)',
          zIndex:               30,
          display:             'flex',
          alignItems:          'flex-end',
          justifyContent:      'space-between',
          padding:             '0 16px',
          paddingTop:          'env(safe-area-inset-top)',
          background:          'var(--color-nav-bg)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
        }}
      >
        {/* Left: back button */}
        <div style={{ minWidth: 80, display: 'flex', alignItems: 'center' }}>
          {!isHome && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                width:           36,
                height:          36,
                borderRadius:   '999px',
                background:     'var(--color-secondary)',
                color:          'var(--color-foreground)',
              }}
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </motion.button>
          )}
        </div>

        {/* Center: logotype or page title */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isHome ? (
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.01em' }}>
              My Collection
            </span>
          ) : title ? (
            <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-foreground)' }}>
              {title}
            </span>
          ) : null}
        </div>

        {/* Right: options button (home only) */}
        <div style={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {isHome && (
            <div ref={optionsRef} style={{ position: 'relative' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOptions(v => !v)}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:           36,
                  height:          36,
                  borderRadius:   '999px',
                  background:     'var(--color-secondary)',
                  color:          'var(--color-foreground)',
                }}
              >
                <MoreHorizontal size={18} strokeWidth={1.75} />
              </motion.button>

              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: -4 }}
                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                    exit={{    opacity: 0, scale: 0.93, y: -4 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position:        'absolute',
                      top:             'calc(100% + 6px)',
                      right:            0,
                      background:      'var(--color-card)',
                      borderRadius:     14,
                      boxShadow:       '0 4px 24px rgba(0,0,0,0.14)',
                      overflow:        'hidden',
                      minWidth:         172,
                      transformOrigin: 'top right',
                    }}
                  >
                    {/* Add album */}
                    <button
                      type="button"
                      onClick={() => { setShowOptions(false); navigate('/add') }}
                      style={{ ...menuItemStyle, borderBottom: '1px solid var(--color-border)' }}
                    >
                      <Plus size={14} strokeWidth={1.5} />
                      Add album
                    </button>

                    {/* View toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false)
                        setViewMode(v => v === 'carousel' ? 'list' : 'carousel')
                      }}
                      style={{ ...menuItemStyle, borderBottom: '1px solid var(--color-border)' }}
                    >
                      {viewMode === 'carousel'
                        ? <List size={14} strokeWidth={1.5} />
                        : <LayoutGrid size={14} strokeWidth={1.5} />}
                      {viewMode === 'carousel' ? 'List view' : 'Gallery view'}
                    </button>

                    {/* Theme toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptions(false)
                        setTheme(t => t === 'day' ? 'night' : 'day')
                      }}
                      style={menuItemStyle}
                    >
                      {theme === 'day'
                        ? <Moon size={14} strokeWidth={1.5} />
                        : <Sun size={14} strokeWidth={1.5} />}
                      {theme === 'day' ? 'Night theme' : 'Day theme'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main
        style={{
          paddingTop:     'var(--nav-height)',
          flex:            1,
          display:        'flex',
          flexDirection:  'column',
        }}
      >
        {children}
      </main>
    </>
  )
}

import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import GrainOverlay from '../ui/GrainOverlay'

export default function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const isAdd = location.pathname === '/add' || location.pathname.endsWith('/edit')

  // Derive page title from route
  const getTitle = () => {
    if (isHome) return null // shows logotype
    if (location.pathname === '/add') return 'Add Record'
    if (location.pathname.endsWith('/edit')) return 'Edit Record'
    return null // album/lyrics pages handle their own titles
  }

  const title = getTitle()

  return (
    <>
      {/* Fixed nav bar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--nav-height)',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(15, 13, 8, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(46, 42, 31, 0.5)',
        }}
      >
        {/* Left: back button */}
        <div style={{ width: 40, display: 'flex', alignItems: 'center' }}>
          {!isHome && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                color: 'var(--color-primary)',
                background: 'transparent',
              }}
            >
              <ChevronLeft size={22} />
            </motion.button>
          )}
        </div>

        {/* Center: logotype or title */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isHome ? (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
              }}
            >
              Side A
            </span>
          ) : title ? (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: 'var(--color-foreground)',
              }}
            >
              {title}
            </span>
          ) : null}
        </div>

        {/* Right: add button on home */}
        <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {isHome && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/add')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              <Plus size={18} />
            </motion.button>
          )}
        </div>
      </header>

      {/* Grain overlay */}
      <GrainOverlay />

      {/* Page content */}
      <main
        style={{
          paddingTop: 'var(--nav-height)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
    </>
  )
}

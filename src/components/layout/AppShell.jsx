import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  const getTitle = () => {
    if (location.pathname === '/add') return 'Add Record'
    if (location.pathname.endsWith('/edit')) return 'Edit Record'
    return null
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
          background: 'rgba(239, 239, 239, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Left: back button */}
        <div style={{ minWidth: 80, display: 'flex', alignItems: 'center' }}>
          {!isHome && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 14px 6px 10px',
                borderRadius: '999px',
                background: '#E5E5E5',
                color: '#9A9A9A',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
              Back
            </motion.button>
          )}
        </div>

        {/* Center: logotype or title */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isHome ? (
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1A1A1A',
                letterSpacing: '-0.01em',
              }}
            >
              Side A
            </span>
          ) : title ? (
            <span
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: '#1A1A1A',
              }}
            >
              {title}
            </span>
          ) : null}
        </div>

        {/* Right: add button on home */}
        <div style={{ minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {isHome && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/add')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '999px',
                background: '#1A1A1A',
                color: '#FFFFFF',
              }}
            >
              <Plus size={18} strokeWidth={1.5} />
            </motion.button>
          )}
        </div>
      </header>

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

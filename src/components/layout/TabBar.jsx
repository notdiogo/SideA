import { useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Library, Plus, User } from 'lucide-react'

const TABS = [
  { path: '/',        label: 'Collection', Icon: Library },
  { path: '/add',     label: 'Add',        Icon: Plus },
  { path: '/profile', label: 'Profile',    Icon: User },
]

// Room the floating bar takes at the bottom (pages subtract/pad by this)
const TABBAR_H = 'calc(68px + max(12px, env(safe-area-inset-bottom)) + 12px)'

export default function TabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const index = TABS.findIndex(t => t.path === pathname)
  const visible = index !== -1

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--tabbar-h', visible ? TABBAR_H : '0px')
  }, [visible])

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}
    >
      <motion.div
        className="glass"
        initial={false}
        animate={{ y: visible ? 0 : 'calc(100% + 40px)', opacity: visible ? 1 : 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
        style={{
          position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`,
          width: 'min(300px, calc(100% - 40px))', padding: 6, borderRadius: 999,
          pointerEvents: visible ? 'auto' : 'none',
          // Denser than the standard glass: content scrolls beneath, labels must stay legible
          background: 'var(--glass-bg-strong)',
        }}
      >
        {/* Sliding selection */}
        {visible && (
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ x: `${index * 100}%` }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
            style={{
              position: 'absolute', top: 6, bottom: 6, left: 6,
              width: `calc((100% - 12px) / ${TABS.length})`, borderRadius: 999,
              background: 'var(--glass-thumb)',
              boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 1px 8px var(--glass-shadow)',
            }}
          />
        )}
        {TABS.map(({ path, label, Icon }, i) => {
          const active = i === index
          return (
            <motion.button
              key={path}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
              style={{
                position: 'relative', height: 56, minWidth: 0, borderRadius: 999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                color: active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
              }}
            >
              <Icon size={22} strokeWidth={active ? 1.9 : 1.6} />
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
            </motion.button>
          )
        })}
      </motion.div>
    </nav>
  )
}

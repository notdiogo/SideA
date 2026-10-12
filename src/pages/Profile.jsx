import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useCollectionContext } from '../App'
import PageTransition from '../components/layout/PageTransition'
import AccountPanel from '../components/ui/AccountPanel'

const label = {
  fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--color-muted-foreground)', marginBottom: 14,
}

function Stat({ value, name }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      <p style={{ ...label, marginBottom: 0, marginTop: 8 }}>{name}</p>
    </div>
  )
}

export default function Profile() {
  const { albums, session, theme, setTheme, loading, authReady } = useCollectionContext()

  const stats = useMemo(() => {
    const artists = new Map()
    let tracks = 0
    const decades = new Map()
    albums.forEach(a => {
      const name = (a.artist || '').trim()
      if (name) artists.set(name, (artists.get(name) || 0) + 1)
      tracks += a.tracks?.length || 0
      const y = Number(a.year)
      if (y) decades.set(Math.floor(y / 10) * 10, (decades.get(Math.floor(y / 10) * 10) || 0) + 1)
    })
    const top = [...artists.entries()].sort((a, b) => b[1] - a[1])[0]
    const byDecade = [...decades.entries()].sort((a, b) => b[0] - a[0])
    const newest = [...albums].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
    return { artists: artists.size, tracks, top, byDecade, maxDecade: Math.max(1, ...byDecade.map(d => d[1])), newest }
  }, [albums])

  const initial = (session?.user?.email || 'A').charAt(0).toUpperCase()

  return (
    <PageTransition>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', padding: '16px 20px calc(var(--tabbar-h) + 32px)' }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0 36px' }}>
          <div
            className="glass"
            style={{ width: 56, height: 56, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, flexShrink: 0 }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {!authReady ? '\u00a0' : session ? session.user.email : 'Side A'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', marginTop: 4 }}>
              {!authReady ? '\u00a0' : session ? 'Syncing across devices' : 'Stored on this device'}
            </p>
          </div>
        </div>

        {/* Numbers */}
        <div style={{ display: 'flex', gap: 16, paddingBottom: 28, borderBottom: '1px solid var(--color-border)' }}>
          <Stat value={loading ? '–' : albums.length} name="Albums" />
          <Stat value={loading ? '–' : stats.artists} name="Artists" />
          <Stat value={loading ? '–' : stats.tracks} name="Tracks" />
        </div>

        {albums.length > 0 && (
          <>
            <div style={{ padding: '28px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 22 }}>
              {stats.top && (
                <div>
                  <p style={label}>Most collected</p>
                  <p style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.02em' }}>
                    {stats.top[0]}
                    <span style={{ color: 'var(--color-muted-foreground)', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                      {' '}· {stats.top[1]} {stats.top[1] === 1 ? 'album' : 'albums'}
                    </span>
                  </p>
                </div>
              )}
              {stats.newest && (
                <div>
                  <p style={label}>Latest addition</p>
                  <p style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.02em' }}>
                    {stats.newest.title}
                    <span style={{ color: 'var(--color-muted-foreground)', fontWeight: 400 }}> · {stats.newest.artist}</span>
                  </p>
                </div>
              )}
            </div>

            {stats.byDecade.length > 0 && (
              <div style={{ padding: '28px 0', borderBottom: '1px solid var(--color-border)' }}>
                <p style={label}>By decade</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.byDecade.map(([decade, count], i) => (
                    <div key={decade} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 44, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--color-muted-foreground)' }}>{decade}s</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-secondary)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: count / stats.maxDecade }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.7, delay: 0.1 + i * 0.05 }}
                          style={{ height: '100%', borderRadius: 999, background: 'var(--color-foreground)', transformOrigin: 'left' }}
                        />
                      </div>
                      <span style={{ width: 20, textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Appearance */}
        <div style={{ padding: '28px 0' }}>
          <p style={label}>Appearance</p>
          <div className="glass" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, borderRadius: 999 }}>
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ x: theme === 'night' ? '100%' : '0%' }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              style={{
                position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc((100% - 8px) / 2)', borderRadius: 999,
                background: 'var(--glass-thumb)', boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 1px 6px var(--glass-shadow)',
              }}
            />
            {[['day', 'Day', Sun], ['night', 'Night', Moon]].map(([key, name, Icon]) => (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setTheme(key)}
                style={{
                  position: 'relative', padding: '11px 0', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 14, fontWeight: theme === key ? 500 : 400, letterSpacing: '-0.01em',
                  color: theme === key ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                }}
              >
                <Icon size={15} strokeWidth={1.7} />
                {name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div style={{ paddingTop: 4 }}>
          <p style={label}>Account &amp; backup</p>
          <AccountPanel />
        </div>
      </div>
    </PageTransition>
  )
}

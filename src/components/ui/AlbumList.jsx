import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, Search, X, ArrowUp, ArrowDown, Users } from 'lucide-react'

const SORTS = [
  { key: 'name',   label: 'Name',   defaultDir: 'asc'  },
  { key: 'artist', label: 'Artist', defaultDir: 'asc'  },
  { key: 'year',   label: 'Year',   defaultDir: 'desc' },
  { key: 'added',  label: 'Added',  defaultDir: 'desc' },
]

const read = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })
const text = (v) => (v || '').trim()
// Sort/section key: ignore leading quotes/punctuation and articles ("The Strokes" files under S)
const key = (v) => text(v).replace(/^[^\p{L}\p{N}]+/u, '').replace(/^(the|a|an)\s+/i, '')
const initial = (v) => {
  const ch = key(v).charAt(0).toUpperCase()
  return /[A-Z]/.test(ch) ? ch : '#'
}

// Comparator for one sort key; direction is applied by the caller.
const compare = {
  name:   (a, b) => collator.compare(key(a.title), key(b.title)),
  artist: (a, b) => collator.compare(key(a.artist), key(b.artist)) || collator.compare(key(a.title), key(b.title)),
  year:   (a, b) => (Number(a.year) || 0) - (Number(b.year) || 0) || collator.compare(key(a.title), key(b.title)),
  added:  (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
}

function Row({ album, index, showArtist, onOpen }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(album)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: '8px 0', background: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <div
        style={{
          width: 60, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
          background: 'var(--color-secondary)', boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {album.coverImage ? (
          <img src={album.coverImage} alt="" draggable={false} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Music size={20} strokeWidth={1.5} style={{ color: 'var(--color-muted-foreground)' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--color-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {album.title}
        </p>
        <p style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--color-muted-foreground)', marginTop: 4, whiteSpace: 'nowrap' }}>
          {showArtist && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.artist}</span>}
          {album.year && (
            <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flexShrink: 0 }}>
              {showArtist ? '· ' : ''}{album.year}
            </span>
          )}
        </p>
      </div>
    </motion.button>
  )
}

function Header({ children, count }) {
  return (
    <p
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '28px 0 10px', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--color-muted-foreground)',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
      {count != null && <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingLeft: 12 }}>{String(count).padStart(2, '0')}</span>}
    </p>
  )
}

export default function AlbumList({ albums, onOpen }) {
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState(() => read('listSort', 'name'))
  const [dir, setDir]       = useState(() => read('listDir', 'asc'))
  const [grouped, setGrouped] = useState(() => read('listGroup', 'off') === 'on')

  useEffect(() => {
    try {
      localStorage.setItem('listSort', sort)
      localStorage.setItem('listDir', dir)
      localStorage.setItem('listGroup', grouped ? 'on' : 'off')
    } catch { /* storage unavailable */ }
  }, [sort, dir, grouped])

  // Tapping the active sort flips its direction; picking another resets to its default.
  const pickSort = (s) => {
    if (s.key === sort) setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSort(s.key); setDir(s.defaultDir) }
  }

  const { sections, total } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = albums.filter(a =>
      !q || [a.title, a.artist, a.year].some(v => (v || '').toLowerCase().includes(q))
    )
    const sign = dir === 'asc' ? 1 : -1
    const sorted = [...list].sort((a, b) => sign * compare[sort](a, b))

    if (grouped) {
      const byArtist = new Map()
      sorted.forEach(a => {
        const k = text(a.artist) || 'Unknown artist'
        if (!byArtist.has(k)) byArtist.set(k, [])
        byArtist.get(k).push(a)
      })
      // Name/Artist order the artists A–Z (or Z–A); Year/Added order them by their lead album.
      const groups = [...byArtist.entries()].map(([title, items]) => ({ title, items }))
      if (sort === 'name' || sort === 'artist') {
        groups.sort((a, b) => sign * collator.compare(key(a.title), key(b.title)))
      }
      return { sections: groups.map(g => ({ key: g.title, title: g.title, count: g.items.length, items: g.items, showArtist: false })), total: list.length }
    }

    // Flat list: headers follow the sort (initial for name/artist, year for year, none for added)
    const headerOf = {
      name:   a => initial(a.title),
      artist: a => initial(a.artist),
      year:   a => a.year || '—',
      added:  () => null,
    }[sort]
    const secs = []
    sorted.forEach(a => {
      const h = headerOf(a)
      const last = secs[secs.length - 1]
      if (last && last.key === h) last.items.push(a)
      else secs.push({ key: h, title: h, items: [a], showArtist: true })
    })
    return { sections: secs, total: list.length }
  }, [albums, query, sort, dir, grouped])

  let rowIndex = 0
  return (
    <div style={{ overflowY: 'auto', height: 'calc(100dvh - var(--nav-height))' }}>
      {/* Sticky controls */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 5,
          padding: '20px 20px 14px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search */}
          <label className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', borderRadius: 999 }}>
            <Search size={15} strokeWidth={1.6} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search albums, artists, years"
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-foreground)', fontSize: 14 }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" style={{ display: 'flex', color: 'var(--color-muted-foreground)' }}>
                <X size={15} strokeWidth={1.6} />
              </button>
            )}
          </label>

          {/* Sort + group */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="glass" style={{ display: 'grid', gridTemplateColumns: `repeat(${SORTS.length}, minmax(0, 1fr))`, flex: 1, minWidth: 0, borderRadius: 999, padding: 3, position: 'relative' }}>
              {/* Sliding thumb: equal-width segments, so position is a plain percentage */}
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ x: `${SORTS.findIndex(s => s.key === sort) * 100}%` }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                style={{
                  position: 'absolute', top: 3, bottom: 3, left: 3,
                  width: `calc((100% - 6px) / ${SORTS.length})`,
                  borderRadius: 999, background: 'var(--glass-thumb)',
                  boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 1px 6px var(--glass-shadow)',
                }}
              />
              {SORTS.map(s => {
                const active = s.key === sort
                return (
                  <motion.button
                    key={s.key}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => pickSort(s)}
                    style={{
                      position: 'relative', minWidth: 0, padding: '8px 2px', borderRadius: 999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      fontSize: 13, letterSpacing: '-0.01em', fontWeight: active ? 500 : 400,
                      color: active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                    }}
                  >
                    <span style={{ position: 'relative' }}>{s.label}</span>
                    {active && (dir === 'asc'
                      ? <ArrowUp size={12} strokeWidth={1.8} style={{ position: 'relative', flexShrink: 0 }} />
                      : <ArrowDown size={12} strokeWidth={1.8} style={{ position: 'relative', flexShrink: 0 }} />)}
                  </motion.button>
                )
              })}
            </div>
            <motion.button
              type="button"
              className={grouped ? undefined : 'glass'}
              whileTap={{ scale: 0.96 }}
              onClick={() => setGrouped(g => !g)}
              aria-pressed={grouped}
              aria-label="Group by artist"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                height: 40, padding: '0 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, flexShrink: 0, minWidth: 40,
                background: grouped ? 'var(--color-foreground)' : undefined,
                color: grouped ? 'var(--color-background)' : 'var(--color-foreground)',
              }}
            >
              <Users size={14} strokeWidth={1.7} />
              <span className="hide-narrow">Artists</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', padding: '0 20px calc(var(--tabbar-h, 0px) + 32px)' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted-foreground)', paddingTop: 6, fontVariantNumeric: 'tabular-nums' }}>
          {total} {total === 1 ? 'album' : 'albums'}
        </p>

        {total === 0 && (
          <p style={{ textAlign: 'center', padding: '64px 0', fontSize: 14, color: 'var(--color-muted-foreground)' }}>
            No albums match “{query}”
          </p>
        )}

        <div key={`${sort}-${dir}-${grouped}`}>
          {sections.map(sec => (
            <section key={sec.key ?? 'all'}>
              {sec.title != null && <Header count={grouped ? sec.count : null}>{sec.title}</Header>}
              {sec.items.map(album => (
                <Row key={album.id} album={album} index={rowIndex++} showArtist={sec.showArtist} onOpen={onOpen} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

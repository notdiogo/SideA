import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollectionContext } from '../App'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/layout/PageTransition'

const cardVariants = {
  initial: { opacity: 0, x: 20, scale: 0.96 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

function AlbumCard({ album }) {
  const navigate = useNavigate()

  return (
    <motion.div
      variants={cardVariants}
      style={{ flexShrink: 0, width: 140 }}
    >
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/album/${album.id}`)}
        style={{
          position: 'relative',
          width: 140,
          height: 140,
          borderRadius: '18px',
          overflow: 'hidden',
          cursor: 'pointer',
          background: '#E5E5E5',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {album.coverImage ? (
          <img
            src={album.coverImage}
            alt={album.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '2rem', opacity: 0.2 }}>♪</span>
          </div>
        )}
      </motion.div>

      {/* Floor reflection */}
      {album.coverImage && (
        <div style={{ width: 140, height: 36, overflow: 'hidden', borderRadius: '0 0 4px 4px' }}>
          <img
            src={album.coverImage}
            alt=""
            aria-hidden="true"
            style={{
              width: '100%',
              height: 140,
              objectFit: 'cover',
              transform: 'scaleY(-1)',
              marginTop: -104,
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* Title / artist below */}
      <div style={{ marginTop: album.coverImage ? 6 : 8, paddingLeft: 2 }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#1A1A1A',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}
        >
          {album.title}
        </p>
        {album.artist && (
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: '#9A9A9A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px',
            }}
          >
            {album.artist}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function Wall() {
  const { albums } = useCollectionContext()

  return (
    <PageTransition>
      <div style={{ padding: '24px 0 40px' }}>
        {albums.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial="initial"
            animate="animate"
            transition={{ staggerChildren: 0.06 }}
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              padding: '8px 24px 20px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              alignItems: 'flex-start',
            }}
          >
            <AnimatePresence>
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}

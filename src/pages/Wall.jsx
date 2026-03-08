import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollectionContext } from '../App'
import EmptyState from '../components/ui/EmptyState'
import PageTransition from '../components/layout/PageTransition'

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
}

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

function AlbumCard({ album }) {
  const navigate = useNavigate()

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onClick={() => navigate(`/album/${album.id}`)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--color-card)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Cover image */}
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
            background: 'var(--color-secondary)',
          }}
        >
          <span style={{ fontSize: '2rem', opacity: 0.3 }}>♪</span>
        </div>
      )}

      {/* Hover overlay */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        variants={{
          hover: { y: 0, opacity: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 10px 10px',
          background: 'linear-gradient(to top, rgba(10,8,4,0.95) 0%, rgba(10,8,4,0.7) 60%, transparent 100%)',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-foreground)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '0.02em',
          }}
        >
          {album.title}
        </p>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-muted-foreground)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '2px',
          }}
        >
          {album.artist}
        </p>
      </motion.div>

      {/* Scale on hover */}
      <motion.div
        variants={{ hover: { scale: 1.04 } }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
    </motion.div>
  )
}

export default function Wall() {
  const { albums } = useCollectionContext()

  return (
    <PageTransition>
      <div style={{ padding: '20px 16px 32px' }}>
        {albums.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
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

import { Disc3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-8 text-center"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Disc3
            size={80}
            strokeWidth={1}
            style={{ color: 'var(--color-border)' }}
          />
        </motion.div>
      </div>
      <div className="space-y-2">
        <p
          className="text-lg font-medium tracking-wide"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Your wall is empty
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--color-muted-foreground)', opacity: 0.6 }}
        >
          Start building your collection
        </p>
      </div>
      <Link
        to="/add"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
        }}
      >
        Add your first record
      </Link>
    </motion.div>
  )
}

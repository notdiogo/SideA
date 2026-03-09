import { useState } from 'react'
import { Reorder, motion, AnimatePresence, useDragControls } from 'framer-motion'
import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { generateId } from '@/store/collection'

function TrackRow({ track, index, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const dragControls = useDragControls()

  return (
    <Reorder.Item value={track} id={track.id} dragControls={dragControls} dragListener={false}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          marginBottom: '8px',
        }}
      >
        {/* Track header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
          }}
        >
          {/* Drag handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab', touchAction: 'none', color: 'var(--color-muted-foreground)', flexShrink: 0 }}
          >
            <GripVertical size={16} />
          </div>

          {/* Track number */}
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-muted-foreground)',
              flexShrink: 0,
              width: '20px',
              textAlign: 'center',
            }}
          >
            {index + 1}
          </span>

          {/* Title input */}
          <input
            value={track.title}
            onChange={(e) => onChange({ ...track, title: e.target.value })}
            placeholder="Track title"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-foreground)',
              fontSize: '14px',
              minWidth: 0,
            }}
          />

          {/* Lyrics toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: expanded ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              padding: '4px',
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.button>

          {/* Delete */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(track.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-muted-foreground)',
              padding: '4px',
            }}
          >
            <Trash2 size={14} />
          </motion.button>
        </div>

        {/* Lyrics editor */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '10px 12px' }}>
                <textarea
                  value={track.lyrics}
                  onChange={(e) => onChange({ ...track, lyrics: e.target.value })}
                  placeholder="Paste lyrics here..."
                  rows={6}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--color-muted-foreground)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    whiteSpace: 'pre-wrap',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  )
}

export default function TrackListEditor({ tracks, onChange }) {
  const handleReorder = (newTracks) => onChange(newTracks)

  const handleTrackChange = (updated) => {
    onChange(tracks.map(t => t.id === updated.id ? updated : t))
  }

  const handleDelete = (id) => {
    onChange(tracks.filter(t => t.id !== id))
  }

  const handleAdd = () => {
    onChange([...tracks, { id: generateId(), title: '', lyrics: '' }])
  }

  return (
    <div>
      <Reorder.Group
        axis="y"
        values={tracks}
        onReorder={handleReorder}
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            onChange={handleTrackChange}
            onDelete={handleDelete}
          />
        ))}
      </Reorder.Group>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleAdd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px dashed rgba(0,0,0,0.15)',
          color: 'var(--color-muted-foreground)',
          fontSize: '14px',
          background: 'transparent',
          cursor: 'pointer',
          justifyContent: 'center',
          marginTop: '4px',
          transition: 'color 0.15s, border-color 0.15s',
        }}
      >
        <Plus size={15} />
        Add track
      </motion.button>
    </div>
  )
}

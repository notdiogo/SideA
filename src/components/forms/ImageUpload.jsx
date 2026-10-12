import { useRef, useState, useCallback } from 'react'
import { Camera } from 'lucide-react'
import { motion } from 'framer-motion'

const MAX_SIZE = 1000

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const ratio = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const base64 = await compressImage(file)
    onChange(base64)
  }, [onChange])

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <motion.div
        whileTap={{ scale: 0.96 }}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          border: isDragging
            ? '2px solid var(--color-primary)'
            : value ? 'none' : '1.5px dashed color-mix(in oklab, var(--color-foreground) 22%, transparent)',
          background: value ? 'transparent' : 'var(--color-card)',
          boxShadow: value ? '0 12px 36px rgba(0,0,0,0.14)' : 'none',
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Replace-cover badge (works on touch, unlike a hover overlay) */}
            <div
              className="glass"
              style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                width: 36,
                height: 36,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-foreground)',
              }}
            >
              <Camera size={16} strokeWidth={1.5} />
            </div>
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--color-muted-foreground)',
            }}
          >
            <Camera size={32} strokeWidth={1.2} />
            <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Add cover</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

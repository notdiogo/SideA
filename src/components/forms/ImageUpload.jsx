import { useRef, useState, useCallback } from 'react'
import { Camera } from 'lucide-react'
import { motion } from 'framer-motion'

const MAX_SIZE = 600

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
        whileTap={{ scale: 0.98 }}
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
            : value ? 'none' : '2px dashed var(--color-border)',
          background: value ? 'transparent' : 'var(--color-card)',
          transition: 'border-color 0.2s',
          boxShadow: value ? '0 0 40px rgba(212, 168, 67, 0.2), 0 8px 32px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              className="group hover:bg-black/40"
            >
              <Camera
                size={24}
                style={{ color: 'white', opacity: 0, transition: 'opacity 0.2s' }}
                className="group-hover:opacity-100"
              />
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
            <span style={{ fontSize: '13px' }}>Tap to add cover</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

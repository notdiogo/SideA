import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function BarcodeScanner({ onDetect, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let controls
    let cancelled = false

    ;(async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const { BarcodeFormat, DecodeHintType } = await import('@zxing/library')
        const hints = new Map([
          [DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.EAN_8,
          ]],
        ])
        const reader = new BrowserMultiFormatReader(hints)
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              cancelled = true
              navigator.vibrate?.(30)
              onDetect(result.getText())
            }
          },
        )
        if (cancelled) c.stop()
        else controls = c
      } catch (err) {
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow it in your browser settings to scan.'
            : 'Could not start the camera.',
        )
      }
    })()

    return () => {
      cancelled = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Viewfinder */}
      <div
        style={{
          position: 'absolute',
          width: 'min(80vw, 340px)',
          height: 140,
          borderRadius: 18,
          boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.85)',
          pointerEvents: 'none',
        }}
      />
      <p
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom) + 48px)',
          left: 20,
          right: 20,
          textAlign: 'center',
          color: '#fff',
          fontSize: 14,
          fontWeight: 300,
        }}
      >
        {error || 'Point at the barcode on the back of the sleeve'}
      </p>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClose}
        aria-label="Close scanner"
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 16px)',
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={20} strokeWidth={1.5} />
      </motion.button>
    </motion.div>
  )
}

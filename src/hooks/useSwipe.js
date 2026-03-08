import { useRef, useCallback } from 'react'

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  const startX = useRef(null)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null) return
    const delta = e.changedTouches[0].clientX - startX.current
    startX.current = null
    if (delta < -threshold) onSwipeLeft?.()
    else if (delta > threshold) onSwipeRight?.()
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { onTouchStart, onTouchEnd }
}

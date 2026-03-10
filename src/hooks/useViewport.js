import { useState, useEffect } from 'react'

function get() {
  const w = window.innerWidth
  const h = window.innerHeight
  return { width: w, height: h, isLandscape: w > h, isTablet: Math.min(w, h) >= 600 }
}

export function useViewport() {
  const [vp, setVp] = useState(get)
  useEffect(() => {
    const update = () => setVp(get())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return vp
}

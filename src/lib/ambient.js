import { useSyncExternalStore } from 'react'

// Ambient colour of the album in focus; drives the soft colour field behind the UI.
// state: [r, g, b] | null
let state = null
const subs = new Set()
export const setAmbient = (rgb) => {
  if (state && rgb && state.every((v, i) => v === rgb[i])) return
  if (state === rgb) return
  state = rgb
  subs.forEach(fn => fn())
}
export const useAmbient = () =>
  useSyncExternalStore(fn => { subs.add(fn); return () => subs.delete(fn) }, () => state)

const cache = new Map()

// Saturation-weighted average of a 24px thumbnail: picks the cover's character
// colour rather than its muddy mean.
export async function sampleColor(src) {
  if (cache.has(src)) return cache.get(src)
  const img = new Image()
  img.src = src
  await img.decode()
  const c = document.createElement('canvas')
  c.width = c.height = 24
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, 24, 24)
  const { data } = ctx.getImageData(0, 0, 24, 24)
  let r = 0, g = 0, b = 0, w = 0
  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2])
    const min = Math.min(data[i], data[i + 1], data[i + 2])
    const weight = (max - min) / 255 + 0.05
    r += data[i] * weight; g += data[i + 1] * weight; b += data[i + 2] * weight; w += weight
  }
  const rgb = [Math.round(r / w), Math.round(g / w), Math.round(b / w)]
  cache.set(src, rgb)
  return rgb
}

import { useSyncExternalStore } from 'react'

// Shared "flying cover" state. A transition between the carousel and an album
// page animates one fixed, transform-only layer instead of morphing both pages'
// DOM, which keeps the work on the compositor (no per-frame layout/paint).
// state: { id, src, dir: 'in' | 'out', from: { x, y, w, h } } | null
let state = null
const subs = new Set()
const emit = () => subs.forEach(fn => fn())

export const getFlight = () => state
export const startFlight = (flight) => { state = flight; emit() }
export const endFlight = () => { if (state) { state = null; emit() } }
export const useFlight = () =>
  useSyncExternalStore(fn => { subs.add(fn); return () => subs.delete(fn) }, () => state)

// Visible cover element on a given page ('wall' | 'detail')
export const coverEl = (id, page) =>
  document.querySelector(`[data-cover-slot="${id}"][data-cover-page="${page}"]`)

export const rectOf = (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

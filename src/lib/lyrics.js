/**
 * Fetch lyrics for a track from Lyrics.ovh.
 * Returns the lyrics string, or null if not found / on any error.
 */
export async function fetchLyrics(artist, trackTitle) {
  try {
    const a = encodeURIComponent(artist)
    const t = encodeURIComponent(trackTitle)
    const res = await fetch(`https://api.lyrics.ovh/v1/${a}/${t}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.error || !data.lyrics) return null
    return data.lyrics.trim() || null
  } catch {
    return null
  }
}

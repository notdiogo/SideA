/**
 * Fetch lyrics using a waterfall of free, CORS-friendly APIs:
 * 1. lrclib.net  — open-source, no key, great coverage
 * 2. lyrics.ovh  — legacy fallback
 * 3. ChartLyrics — XML-based, third fallback
 *
 * Returns the lyrics string, or null if none of the sources find them.
 */

async function fromLrclib(artist, trackTitle) {
  try {
    const params = new URLSearchParams({ artist_name: artist, track_name: trackTitle })
    const res = await fetch(`https://lrclib.net/api/get?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.plainLyrics?.trim() || null
  } catch {
    return null
  }
}

async function fromLyricsOvh(artist, trackTitle) {
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

async function fromChartLyrics(artist, trackTitle) {
  try {
    const a = encodeURIComponent(artist)
    const t = encodeURIComponent(trackTitle)
    const res = await fetch(
      `https://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=${a}&song=${t}`
    )
    if (!res.ok) return null
    const text = await res.text()
    const match = text.match(/<Lyric>([\s\S]*?)<\/Lyric>/)
    const lyrics = match?.[1]?.trim()
    return lyrics || null
  } catch {
    return null
  }
}

export async function fetchLyrics(artist, trackTitle) {
  const result = await fromLrclib(artist, trackTitle)
  if (result) return result

  const result2 = await fromLyricsOvh(artist, trackTitle)
  if (result2) return result2

  const result3 = await fromChartLyrics(artist, trackTitle)
  if (result3) return result3

  return null
}

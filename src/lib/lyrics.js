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

async function fetchFromLrclib(artist, trackTitle) {
  try {
    const a = encodeURIComponent(artist)
    const t = encodeURIComponent(trackTitle)
    const res = await fetch(`https://lrclib.net/api/get?artist_name=${a}&track_name=${t}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.plainLyrics?.trim() || null
  } catch {
    return null
  }
}

/**
 * Fetch lyrics for all tracks in an album that are missing lyrics.
 * Tries lrclib first, falls back to lyrics.ovh.
 * Returns the tracks array with lyrics filled in where found.
 */
export async function prefetchAlbumLyrics(artist, tracks) {
  return Promise.all(
    tracks.map(async (track) => {
      if (track.lyrics) return track
      const lyrics =
        (await fetchFromLrclib(artist, track.title)) ||
        (await fetchLyrics(artist, track.title))
      return lyrics ? { ...track, lyrics } : track
    })
  )
}

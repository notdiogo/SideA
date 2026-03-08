const UA = 'VinylApp/1.0 (contact@example.com)'
const MB = 'https://musicbrainz.org/ws/2'
const CAA = 'https://coverartarchive.org/release'
const MAX_SIZE = 600

async function mbFetch(path) {
  const res = await fetch(`${MB}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`)
  return res.json()
}

/**
 * Search MusicBrainz for a release and return its full details.
 * Returns { mbid, title, artist, year, tracks: [{ id, title }] }
 * Throws if nothing found.
 */
export async function searchRelease(artist, album) {
  const q = encodeURIComponent(`artist:"${artist}" AND release:"${album}"`)
  const search = await mbFetch(`/release/?query=${q}&fmt=json&limit=5`)

  const releases = search.releases ?? []
  if (releases.length === 0) throw new Error('No album found')

  const top = releases[0]
  const mbid = top.id
  const title = top.title
  const artistName = top['artist-credit']?.[0]?.name ?? artist
  const date = top.date ?? ''
  const year = date.slice(0, 4) || ''

  // Fetch full release to get tracklist
  const detail = await mbFetch(`/release/${mbid}?inc=recordings&fmt=json`)
  const media = detail.media ?? []
  const rawTracks = media.flatMap(m => m.tracks ?? [])

  const tracks = rawTracks.map(t => ({
    id: t.recording?.id ?? t.id ?? String(t.position),
    title: t.title,
    lyrics: '',
  }))

  return { mbid, title, artist: artistName, year, tracks }
}

/**
 * Fetch the front cover art for a MusicBrainz release ID.
 * Returns a base64 jpeg data URL (max 600px), or null if unavailable.
 */
export async function fetchCoverAsBase64(mbid) {
  try {
    const res = await fetch(`${CAA}/${mbid}/front`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return await compressBlob(blob)
  } catch {
    return null
  }
}

function compressBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')) }
    img.src = url
  })
}

const UA = 'VinylApp/1.0 (contact@example.com)'
const MB = 'https://musicbrainz.org/ws/2'
const CAA = 'https://coverartarchive.org/release'
const MAX_SIZE = 1000

async function mbFetch(path, signal) {
  const res = await fetch(`${MB}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`)
  return res.json()
}

const LUCENE_SPECIAL = /[+\-!(){}[\]^"~*?:\\/&|]/g

/**
 * Fuzzy, as-you-type search across album and artist names.
 * Every word must match album or artist; the last one as a prefix ("fleetwood rum" finds Fleetwood Mac - Rumours).
 * Searches release groups so each album appears once, not once per pressing.
 * Returns [{ groupId, title, artist, year, type }]
 */
export async function searchAlbums(term, signal) {
  const words = term.replace(LUCENE_SPECIAL, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  // Finished words match exactly, only the word still being typed matches as a prefix
  const query = words
    .map((w, i) => {
      const t = i === words.length - 1 ? `${w}*` : w
      return `(releasegroup:${t} OR artist:${t})`
    })
    .join(' AND ')
  const full = `${query} AND primarytype:(album OR ep OR single)`
  const search = await mbFetch(`/release-group/?query=${encodeURIComponent(full)}&fmt=json&limit=100`, signal)

  // MusicBrainz ranks by text match, which favours obscure short titles. How many releases a
  // group has is a good popularity proxy, so surface the well-known albums first.
  const groups = (search['release-groups'] ?? [])
    .sort((a, b) => (b.releases?.length ?? 0) - (a.releases?.length ?? 0))
    .slice(0, 15)

  return groups.map(g => ({
    groupId: g.id,
    title: g.title,
    artist: g['artist-credit']?.[0]?.name ?? '',
    year: (g['first-release-date'] ?? '').slice(0, 4),
    type: g['primary-type'] ?? '',
  }))
}

/**
 * Load full details for a search result (release group): picks a vinyl pressing when one
 * exists, otherwise the earliest release, and returns its tracklist.
 * Returns { mbid, groupId, title, artist, year, tracks: [{ id, title }] }
 */
export async function loadAlbum(group) {
  // Cheap listing first (no tracks) to choose a pressing, then fetch tracks for that one only
  const data = await mbFetch(`/release?release-group=${group.groupId}&inc=media&fmt=json&limit=100`)
  const releases = (data.releases ?? []).filter(r => (r.media ?? []).some(m => m['track-count']))
  if (releases.length === 0) throw new Error('No album found')

  const isVinyl = r => r.media.some(m => /vinyl/i.test(m.format ?? ''))
  const byDate = (a, b) => (a.date || '9999').localeCompare(b.date || '9999')
  const pick = releases.filter(isVinyl).sort(byDate)[0] ?? releases.sort(byDate)[0]

  const release = await mbFetch(`/release/${pick.id}?inc=recordings&fmt=json`)
  return {
    mbid: pick.id,
    groupId: group.groupId,
    title: group.title,
    artist: group.artist,
    year: group.year || (pick.date ?? '').slice(0, 4),
    tracks: toTracks(release.media),
  }
}

/**
 * Look up a release by barcode (UPC/EAN). Returns { mbid, title, artist, year, tracks }.
 * Throws 'No album found' if the barcode is unknown.
 */
export async function searchReleaseByBarcode(barcode) {
  const q = encodeURIComponent(`barcode:${barcode}`)
  const search = await mbFetch(`/release/?query=${q}&fmt=json&limit=5`)

  const releases = search.releases ?? []
  if (releases.length === 0) throw new Error('No album found')

  // Prefer a vinyl pressing when several releases share the barcode
  const isVinyl = r => (r.media ?? []).some(m => /vinyl/i.test(m.format ?? ''))
  return loadRelease(releases.find(isVinyl) ?? releases[0], '')
}

async function loadRelease(top, fallbackArtist) {
  const mbid = top.id
  const title = top.title
  const artistName = top['artist-credit']?.[0]?.name ?? fallbackArtist
  const date = top.date ?? ''
  const year = date.slice(0, 4) || ''

  // Fetch full release to get tracklist
  const detail = await mbFetch(`/release/${mbid}?inc=recordings&fmt=json`)
  return { mbid, title, artist: artistName, year, tracks: toTracks(detail.media) }
}

function toTracks(media = []) {
  return media.flatMap(m => m.tracks ?? []).map(t => ({
    id: t.recording?.id ?? t.id ?? String(t.position),
    title: t.title,
    lyrics: '',
  }))
}

/** Small cover thumbnail URL for a release group (404s when there is no art). */
export const groupThumbUrl = groupId => `https://coverartarchive.org/release-group/${groupId}/front-250`

/**
 * Fetch the front cover art for a release (optionally trying its release group first).
 * Returns a base64 jpeg data URL (max 1000px), or null if unavailable.
 */
export async function fetchCoverAsBase64(mbid, groupId) {
  const urls = [
    groupId && `https://coverartarchive.org/release-group/${groupId}/front`,
    `${CAA}/${mbid}/front`,
  ].filter(Boolean)
  for (const url of urls) {
    try {
      // No custom headers: they force a CORS preflight, which can't follow the archive.org redirect
      const res = await fetch(url)
      if (res.ok) return await compressBlob(await res.blob())
    } catch { /* try next */ }
  }
  return null
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

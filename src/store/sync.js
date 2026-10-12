// Push-then-pull sync between IndexedDB and the Supabase `albums` table.
// Conflict rule: a locally dirty record always wins; `updated_at` is set by the server.
import { supabase } from '../lib/supabase'
import { getAllRecords, putRecords, getMeta, setMeta } from './localDb'

const PAGE = 20
const CURSOR_KEY = 'pullCursor'

const toRow = (r) => ({
  id: r.id,
  title: r.title,
  artist: r.artist,
  year: r.year || null,
  cover_image: r.coverImage || null,
  tracks: r.tracks ?? [],
  created_at: new Date(r.createdAt).toISOString(),
  deleted_at: r.deletedAt ? new Date(r.deletedAt).toISOString() : null,
})

const fromRow = (row) => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  year: row.year ?? '',
  coverImage: row.cover_image ?? '',
  tracks: row.tracks ?? [],
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
  deletedAt: row.deleted_at ? new Date(row.deleted_at).getTime() : null,
  dirty: false,
})

async function push() {
  const dirty = (await getAllRecords()).filter(r => r.dirty)
  if (!dirty.length) return
  // Small batches: base64 covers make rows large.
  for (let i = 0; i < dirty.length; i += 5) {
    const batch = dirty.slice(i, i + 5)
    const { error } = await supabase.from('albums').upsert(batch.map(toRow))
    if (error) throw error
    // Clear the flag only if the record wasn't edited again while we were pushing.
    const current = new Map((await getAllRecords()).map(r => [r.id, r]))
    await putRecords(
      batch
        .filter(b => current.get(b.id)?.updatedAt === b.updatedAt)
        .map(b => ({ ...current.get(b.id), dirty: false }))
    )
  }
}

async function pull() {
  const cursor = await getMeta(CURSOR_KEY)
  const local = new Map((await getAllRecords()).map(r => [r.id, r]))
  let newCursor = cursor
  let changed = false

  for (let from = 0; ; from += PAGE) {
    let q = supabase.from('albums').select('*')
      .order('updated_at', { ascending: true }).order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (cursor) q = q.gt('updated_at', cursor)
    const { data, error } = await q
    if (error) throw error

    const incoming = data
      .filter(row => !local.get(row.id)?.dirty)
      .map(fromRow)
    if (incoming.length) {
      await putRecords(incoming)
      changed = true
    }
    if (data.length) newCursor = data[data.length - 1].updated_at
    if (data.length < PAGE) break
  }

  if (newCursor !== cursor) await setMeta(CURSOR_KEY, newCursor)
  return changed
}

/** Returns true if the local store changed. Throws on network/server errors. */
export async function syncNow() {
  await push()
  return pull()
}

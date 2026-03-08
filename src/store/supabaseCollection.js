import { supabase } from '../lib/supabase'

export { generateId } from './collection'

function toAlbum(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year ?? '',
    coverImage: row.cover_image ?? '',
    tracks: row.tracks ?? [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

export async function getAll() {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toAlbum)
}

export async function getById(id) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return toAlbum(data)
}

export async function save(album) {
  const { data: { user } } = await supabase.auth.getUser()
  const now = new Date().toISOString()
  const row = {
    id: album.id,
    user_id: user.id,
    title: album.title,
    artist: album.artist,
    year: album.year || null,
    cover_image: album.coverImage || null,
    tracks: album.tracks ?? [],
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('albums')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return toAlbum(data)
}

export async function remove(id) {
  const { error } = await supabase.from('albums').delete().eq('id', id)
  if (error) throw error
}

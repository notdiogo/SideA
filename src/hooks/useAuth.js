import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns the current Supabase session.
 * - undefined  → still loading (don't render anything yet)
 * - null       → not authenticated
 * - object     → authenticated session
 */
export function useAuth() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return session
}

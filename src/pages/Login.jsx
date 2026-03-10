import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const inputStyle = {
    width:           '100%',
    padding:         '14px 16px',
    borderRadius:     12,
    border:          '1.5px solid var(--color-border)',
    background:      'var(--color-card)',
    color:           'var(--color-foreground)',
    fontSize:         16,
    outline:         'none',
    WebkitAppearance:'none',
  }

  return (
    <div
      style={{
        minHeight:      '100dvh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--color-background)',
        padding:        '24px 24px',
        paddingTop:     'max(24px, env(safe-area-inset-top))',
        paddingBottom:  'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 360 }}
      >
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--color-foreground)' }}>
            Side A
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ fontSize: 13, color: 'oklch(55% 0.18 25)', margin: 0 }}>
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              marginTop:      4,
              padding:       '14px',
              borderRadius:   12,
              background:    'var(--color-primary)',
              color:         'var(--color-primary-foreground)',
              fontSize:       15,
              fontWeight:     500,
              cursor:         loading ? 'not-allowed' : 'pointer',
              opacity:        loading ? 0.6 : 1,
              transition:    'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

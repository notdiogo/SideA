import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | loading | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    setErrorMsg('')

    const redirectTo = window.location.origin + import.meta.env.BASE_URL

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setErrorMsg(error.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--color-background)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '360px' }}
      >
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#1A1A1A',
            }}
          >
            Side A
          </h1>
          <p style={{ fontSize: '14px', color: '#9A9A9A', fontWeight: 300, marginTop: '6px' }}>
            Your vinyl collection
          </p>
        </div>

        {state === 'sent' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '999px',
                background: '#F0F0F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Mail size={20} strokeWidth={1.5} style={{ color: '#1A1A1A' }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>
              Check your email
            </p>
            <p style={{ fontSize: '13px', fontWeight: 300, color: '#9A9A9A', lineHeight: 1.5 }}>
              We sent a magic link to <strong style={{ color: '#1A1A1A', fontWeight: 500 }}>{email}</strong>.
              Tap it to sign in.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#9A9A9A',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={state === 'loading'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#F5F5F5',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#1A1A1A',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              {state === 'error' && (
                <p style={{ fontSize: '13px', color: 'oklch(55% 0.18 25)', margin: 0 }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={state === 'loading' || !email.trim()}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  background: (state === 'loading' || !email.trim()) ? '#E5E5E5' : '#1A1A1A',
                  color: (state === 'loading' || !email.trim()) ? '#9A9A9A' : '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s, color 0.2s',
                  cursor: state === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {state === 'loading' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={16} strokeWidth={1.5} />
                    </motion.div>
                    Sending…
                  </>
                ) : (
                  'Send magic link'
                )}
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

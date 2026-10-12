import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCollectionContext } from '../../App'

const STATUS_LABEL = {
  'signed-out': 'Not syncing',
  syncing: 'Syncing…',
  synced: 'Up to date',
  offline: 'Offline — will sync when back online',
  error: 'Sync failed — will retry',
}

const cardStyle = {
  background: 'var(--color-card)',
  borderRadius: 20,
  padding: 24,
  boxShadow: 'inset 0 0 0 1px var(--color-border), 0 8px 28px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--color-secondary)',
  border: 'none',
  borderRadius: 12,
  color: 'var(--color-foreground)',
  fontSize: 15,
  outline: 'none',
}

const buttonStyle = (disabled) => ({
  width: '100%',
  padding: 15,
  borderRadius: 999,
  // Disabled keeps the filled shape (dimmed) so it still reads as a button, not a field
  background: 'var(--color-foreground)',
  color: 'var(--color-background)',
  opacity: disabled ? 0.35 : 1,
  cursor: disabled ? 'default' : 'pointer',
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
})

function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // email | code
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const sendCode = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  const verify = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(), token: code.trim(), type: 'email',
    })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={step === 'email' ? sendCode : verify} style={cardStyle}>
      <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--color-muted-foreground)', lineHeight: 1.5, margin: 0 }}>
        {step === 'email'
          ? 'Sign in to sync your collection across devices. We’ll email you a 6-digit code.'
          : <>Enter the code sent to <strong style={{ fontWeight: 500 }}>{email}</strong>.</>}
      </p>
      {step === 'email' ? (
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" disabled={busy} style={inputStyle}
        />
      ) : (
        <input
          type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
          value={code} onChange={e => setCode(e.target.value)}
          placeholder="123456" disabled={busy} style={inputStyle} autoFocus
        />
      )}
      {error && <p style={{ fontSize: 13, color: 'oklch(55% 0.18 25)', margin: 0 }}>{error}</p>}
      <motion.button
        whileTap={busy || !(step === 'email' ? email.trim() : code.trim()) ? undefined : { scale: 0.96 }} type="submit"
        disabled={busy || !(step === 'email' ? email.trim() : code.trim())}
        style={buttonStyle(busy || !(step === 'email' ? email.trim() : code.trim()))}
      >
        {busy && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={16} strokeWidth={1.5} />
          </motion.div>
        )}
        {step === 'email' ? 'Send code' : 'Sign in'}
      </motion.button>
      {step === 'code' && (
        <button type="button" onClick={() => { setStep('email'); setCode(''); setError('') }}
          style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}>
          Use a different email
        </button>
      )}
    </form>
  )
}

export default function AccountPanel() {
  const { session, status, sync, exportJson, albums } = useCollectionContext()

  const download = async () => {
    const url = URL.createObjectURL(await exportJson())
    const a = document.createElement('a')
    a.href = url
    a.download = `side-a-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {session ? (
        <div style={cardStyle}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.015em', margin: 0 }}>{STATUS_LABEL[status]}</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--color-muted-foreground)', margin: '4px 0 0' }}>
              {session.user.email} · {albums.length} albums on this device
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={sync} style={buttonStyle(false)}>
            Sync now
          </motion.button>
          <button type="button" style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}
            onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      ) : (
        <SignIn />
      )}

      <div style={cardStyle}>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--color-muted-foreground)', lineHeight: 1.5, margin: 0 }}>
          Your collection is stored on this device and works offline. Download a backup copy any time.
        </p>
        <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={download} style={buttonStyle(false)}>
          Export backup (JSON)
        </motion.button>
      </div>
    </div>
  )
}

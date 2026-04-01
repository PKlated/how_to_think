import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

type MockUser = { name: string; email: string; password: string }

function getUsers(): MockUser[] {
  return JSON.parse(localStorage.getItem('mock_users') ?? '[]')
}

function saveUsers(users: MockUser[]) {
  localStorage.setItem('mock_users', JSON.stringify(users))
}

function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const users = getUsers()
    const found = users.find(
      (u) => u.email === loginEmail && u.password === loginPassword
    )
    if (!found) { setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return }
    localStorage.setItem('user', loginEmail)
    window.dispatchEvent(new Event('user-changed'))
    navigate({ to: '/chat' })
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!signupName || !signupEmail || !signupPassword) {
      setError('กรุณากรอกข้อมูลให้ครบ'); return
    }
    const users = getUsers()
    if (users.find((u) => u.email === signupEmail)) {
      setError('อีเมลนี้มีบัญชีอยู่แล้ว'); return
    }
    const newUser: MockUser = { name: signupName, email: signupEmail, password: signupPassword }
    saveUsers([...users, newUser])
    localStorage.setItem('user', signupEmail)
    window.dispatchEvent(new Event('user-changed'))
    navigate({ to: '/chat' })
  }

  const inputClass = "w-full px-5 py-4 rounded-2xl text-sm outline-none transition-all"
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.5)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    color: '#1a2e1a',
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #a8d5b5 0%, #c5e8d0 35%, #d6eedf 60%, #deeaf5 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* LEFT — branding */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 relative">
        <div
          className="absolute"
          style={{
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            filter: 'blur(2px)',
          }}
        />
        <img src="/images.png" alt="logo" style={{ width: 280, position: 'relative' }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h1
            className="tracking-widest text-sm font-semibold"
            style={{ color: '#2d6a4f', letterSpacing: '0.3em' }}
          >
            HOW TO THINK
          </h1>
          <p className="text-xs mt-1" style={{ color: '#52b788', letterSpacing: '0.05em' }}>
            Your intelligent thinking partner
          </p>
        </div>
      </div>

      {/* divider */}
      <div style={{ width: 1, margin: '60px 0', background: 'rgba(255,255,255,0.45)' }} />

      {/* RIGHT — form */}
      <div className="flex-1 flex justify-center items-center px-10">
        <div className="w-full" style={{ maxWidth: 500 }}>

          {/* Tab switcher */}
          <div
            className="flex gap-1 p-1.5 mb-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}
          >
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? '#1a2e1a' : '#52b788',
                  boxShadow: tab === t ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t === 'login' ? 'Login' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Card */}
          <div
            className="flex flex-col gap-5 p-9 rounded-3xl"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(255,255,255,0.8)',
              boxShadow: '0 8px 40px rgba(45,106,79,0.12)',
            }}
          >
            <div className="mb-1">
              <h3 className="text-xl font-semibold" style={{ color: '#1a2e1a' }}>
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h3>
              <p className="text-sm mt-1" style={{ color: '#74b894' }}>
                {tab === 'login' ? 'เข้าสู่ระบบเพื่อเริ่มต้น' : 'สร้างบัญชีใหม่ได้เลย'}
              </p>
            </div>

            {error && (
              <div
                className="text-xs text-center py-2.5 px-4 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}
              >
                {error}
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Email Address"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <input
                  type="password"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 mt-1"
                  style={{
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
                    letterSpacing: '0.03em',
                  }}
                >
                  Login →
                </button>
              </form>
            )}

            {/* Signup Form */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Full Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Email Address"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
                <input
                  type="password"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 mt-1"
                  style={{
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
                    letterSpacing: '0.03em',
                  }}
                >
                  Create Account →
                </button>
              </form>
            )}
          </div>

         
        </div>
      </div>
    </div>
  )
}
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login, signup } from '../server/ai' // ✅ ใช้ API จริง

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // ===== LOGIN =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!loginEmail || !loginPassword) {
      setError('กรุณากรอก Email และ Password')
      return
    }

    try {
      const user = await login(loginEmail, loginPassword)

      // ✅ เก็บ userId จาก backend
      localStorage.setItem('userId', user._id)
      localStorage.setItem('user', JSON.stringify(user))
      window.dispatchEvent(new Event('user-changed'))
      navigate({ to: '/chat' })
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  // ===== SIGNUP =====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!signupName || !signupEmail || !signupPassword) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    try {
      const user = await signup(signupName, signupEmail, signupPassword)

      // ✅ เก็บ userId จาก backend
      localStorage.setItem('userId', user._id)
      localStorage.setItem('user', JSON.stringify(user))
      window.dispatchEvent(new Event('user-changed'))
      navigate({ to: '/chat' })
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    }
  }

  const inputClass =
    "w-full px-5 py-4 rounded-2xl text-sm outline-none transition-all"

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
        background:
          'linear-gradient(135deg, #a8d5b5 0%, #c5e8d0 35%, #d6eedf 60%, #deeaf5 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* LEFT */}
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
          <p className="text-xs mt-1" style={{ color: '#52b788' }}>
            Your intelligent thinking partner
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, margin: '60px 0', background: 'rgba(255,255,255,0.45)' }} />

      {/* RIGHT */}
      <div className="flex-1 flex justify-center items-center px-10">
        <div className="w-full" style={{ maxWidth: 500 }}>

          {/* Tabs */}
          <div
            className="flex gap-1 p-1.5 mb-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          >
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? '#1a2e1a' : '#52b788',
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
              border: '1.5px solid rgba(255,255,255,0.8)',
            }}
          >
            <h3 className="text-xl font-semibold">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h3>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {/* LOGIN */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Email"
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
                <button className="bg-black text-white py-3 rounded-xl">
                  Login
                </button>
              </form>
            )}

            {/* SIGNUP */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Email"
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
                <button className="bg-black text-white py-3 rounded-xl">
                  Signup
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
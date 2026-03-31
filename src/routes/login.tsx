import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

// ---- Mock Auth Helpers ----
type MockUser = { name: string; email: string; password: string }

function getUsers(): MockUser[] {
  return JSON.parse(localStorage.getItem('mock_users') ?? '[]')
}

function saveUsers(users: MockUser[]) {
  localStorage.setItem('mock_users', JSON.stringify(users))
}

// ---- Component ----
function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup fields
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [error, setError] = useState('')
  const navigate = useNavigate()

  // ---- Handlers ----
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const users = getUsers()
    const found = users.find(
      (u) => u.email === loginEmail && u.password === loginPassword
    )

    if (!found) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      return
    }

    localStorage.setItem('user', loginEmail)
    window.dispatchEvent(new Event('user-changed'))
    navigate({ to: '/chat' })
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!signupName || !signupEmail || !signupPassword) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    const users = getUsers()
    if (users.find((u) => u.email === signupEmail)) {
      setError('อีเมลนี้มีบัญชีอยู่แล้ว')
      return
    }

    const newUser: MockUser = {
      name: signupName,
      email: signupEmail,
      password: signupPassword,
    }
    saveUsers([...users, newUser])
    localStorage.setItem('user', signupEmail)
    window.dispatchEvent(new Event('user-changed'))
    navigate({ to: '/chat' })
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-green-200 to-green-400">
      {/* LEFT */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <img src="/logo.png" alt="logo" className="w-56 mb-5" />
        <h1 className="text-green-600 tracking-widest text-xl font-bold">
          HOW TO THINK
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex justify-center items-center">
        <div className="w-80 flex flex-col gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">
            {tab === 'login' ? 'Log in' : 'Sign up'}
          </h3>

          {/* Tab switcher */}
          <div className="flex gap-2 bg-gray-200 p-1 rounded-full">
            <button
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'login' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab('signup'); setError('') }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'signup' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                className="p-3 rounded-full bg-gray-200 outline-none"
                placeholder="Email Address"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                className="p-3 rounded-full bg-gray-200 outline-none"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button
                type="submit"
                className="p-3 rounded-full bg-gray-700 text-white mt-1"
              >
                Login
              </button>
            </form>
          )}

          {/* Signup Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="flex flex-col gap-3">
              <input
                className="p-3 rounded-full bg-gray-200 outline-none"
                placeholder="Full Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
              <input
                className="p-3 rounded-full bg-gray-200 outline-none"
                placeholder="Email Address"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <input
                type="password"
                className="p-3 rounded-full bg-gray-200 outline-none"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
              <button
                type="submit"
                className="p-3 rounded-full bg-gray-700 text-white mt-1"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
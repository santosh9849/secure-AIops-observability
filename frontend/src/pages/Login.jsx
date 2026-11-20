
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  Loader2,
} from 'lucide-react'

import { loginUser } from '../services/api'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      const result = await loginUser(email.trim(), password)

      if (!result.access_token) {
        throw new Error('The server did not return an access token.')
      }

      // Keep the token for this browser session.
      sessionStorage.setItem('access_token', result.access_token)
      sessionStorage.setItem('user_email', result.email || email.trim())

      navigate('/dashboard', { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail

      setError(
        typeof detail === 'string'
          ? detail
          : err.message || 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-logo">
          <Activity size={32} />
        </div>

        <h1>SentinelOps <span>AI</span></h1>
        <p>INTELLIGENT OBSERVABILITY</p>
      </div>

      <div className="login-card">
        <div className="login-icon">
          <ShieldCheck size={28} />
        </div>

        <h2>Welcome Back</h2>
        <p className="login-subtitle">
          Sign in to access your observability workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>

          <div className="login-input-wrapper">
            <Mail size={18} />

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <label htmlFor="password">Password</label>

          <div className="login-input-wrapper">
            <LockKeyhole size={18} />

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="login-spinner" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-security">
          <LockKeyhole size={14} />
          Secure access to your monitoring workspace
        </div>
      </div>

      <p className="login-footer">
        © 2026 SentinelOps AI · Intelligent Observability Platform
      </p>
    </div>
  )
}

export default Login

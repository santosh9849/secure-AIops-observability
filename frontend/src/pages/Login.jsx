
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
} from 'lucide-react'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setMessage(
      'Login interface is ready. Backend authentication will be connected next.'
    )
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
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-submit">
            Sign In
            <ArrowRight size={18} />
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

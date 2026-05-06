import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    const r = await login(nickname, password)
    if (!r.ok) {
      setMsg(r.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="page narrow-auth">
      <header className="page-head">
        <h1 className="page-title">登录</h1>
        <p className="page-desc">使用注册时的<strong>昵称</strong>与密码登录。</p>
      </header>

      <section className="card form-card">
        <form className="form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>昵称</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {msg ? <p className="form-msg">{msg}</p> : null}
          <button type="submit" className="btn primary">
            登录
          </button>
        </form>
        <p className="muted small" style={{ marginTop: '1rem' }}>
          还没有账号？<Link to="/register">去注册</Link>
        </p>
      </section>
    </div>
  )
}

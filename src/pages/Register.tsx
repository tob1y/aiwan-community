import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [realName, setRealName] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    if (password !== password2) {
      setMsg('两次输入的密码不一致。')
      return
    }
    const r = await register({ nickname, realName, password })
    if (!r.ok) {
      setMsg(r.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="page narrow-auth">
      <header className="page-head">
        <h1 className="page-title">注册</h1>
        <p className="page-desc">
          注册时需填写<strong>昵称</strong>（社区内展示、登录用）与<strong>姓名</strong>（实名信息，仅保存在本机账号数据中）。
        </p>
      </header>

      <section className="card form-card">
        <form className="form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>昵称</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="登录与发帖时对外显示"
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>姓名</span>
            <input
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="真实姓名"
              autoComplete="name"
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
          </label>
          <label className="field">
            <span>确认密码</span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {msg ? <p className="form-msg">{msg}</p> : null}
          <button type="submit" className="btn primary">
            注册并登录
          </button>
        </form>
        <p className="muted small" style={{ marginTop: '1rem' }}>
          已有账号？<Link to="/login">去登录</Link>
        </p>
      </section>
    </div>
  )
}

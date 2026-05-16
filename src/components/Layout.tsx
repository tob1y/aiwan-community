import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'

const nav = [
  { to: '/', label: '社区介绍', end: true },
  { to: '/activities', label: '往期项目' },
  { to: '/ideas', label: '创意区' },
  { to: '/forum', label: '讨论区' },
  { to: '/board', label: '公告栏' },
]

export function Layout() {
  const { user, logout, authLoading } = useAuth()
  const { communityLoading, communityError, clearCommunityError } = useCommunity()

  return (
    <div className="shell">
      <header className="top">
        <NavLink to="/" className="brand">
          <img src="/logo.jpg" alt="爱玩社区" className="brand-mark" />
          <span className="brand-text">
            <span className="brand-title">爱玩社区</span>
            <span className="brand-sub">机会 · 动手 · 一起玩</span>
          </span>
        </NavLink>
        <div className="top-right">
          <nav className="nav" aria-label="主导航">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="auth-bar" aria-label="账号">
            {user ? (
              <>
                <span className="auth-user muted small">
                  <span className="auth-nick">{user.nickname}</span>
                  <span className="auth-name"> · {user.realName}</span>
                </span>
                <button type="button" className="btn text small" onClick={logout}>
                  退出
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link">
                  登录
                </NavLink>
                <NavLink to="/register" className="nav-link nav-link-accent">
                  注册
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      {communityError ? (
        <p className="banner" role="alert">
          {communityError}{' '}
          <button type="button" className="btn text small" onClick={clearCommunityError}>
            关闭
          </button>
        </p>
      ) : null}
      {communityLoading || authLoading ? (
        <p className="muted small" style={{ margin: '0 0 0.5rem' }}>
          {communityLoading ? '正在同步社区数据…' : ''}
          {authLoading ? '正在校验登录状态…' : ''}
        </p>
      ) : null}
      <main className="main">
        <Outlet />
      </main>
      <footer className="foot">
        <p>
          数据由自建 API 写入 PostgreSQL（共同数据库）。本地仅保存登录令牌；部署说明见项目内{' '}
          <code>docker-compose.yml</code> 与 <code>server/.env.example</code>。
        </p>
      </footer>
    </div>
  )
}

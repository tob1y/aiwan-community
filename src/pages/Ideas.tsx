import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { formatDate } from '../lib/format'

export function Ideas() {
  const { user } = useAuth()
  const { ideas, addIdea } = useCommunity()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [peopleNeeded, setPeopleNeeded] = useState(3)
  const [msg, setMsg] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setMsg('请先登录后再发布创意。')
      return
    }
    if (!title.trim() || !description.trim() || !budget.trim()) {
      setMsg('请填写标题、说明与预算。')
      return
    }
    if (peopleNeeded < 1) {
      setMsg('需要人数至少为 1。')
      return
    }
    try {
      await addIdea({
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim(),
        peopleNeeded,
        authorName: user.nickname,
        authorUserId: user.id,
      })
      setTitle('')
      setDescription('')
      setBudget('')
      setPeopleNeeded(3)
      setMsg('已发布。发起人为你当前登录账号，可在本页进入详情后编辑或删除。')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '发布失败')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">创意区</h1>
        <p className="page-desc">
          发帖时写清预算与大概人数；其他人可报名。人数凑齐后，发起人按公告栏「申请须知」向主理人提交。想发图、聊天请到「讨论区」。
        </p>
      </header>

      <section className="card form-card">
        <h2 className="card-title">发布新创意</h2>
        {!user ? (
          <p className="muted">
            发布创意需要先 <Link to="/login">登录</Link>；还没有账号请 <Link to="/register">注册</Link>（需填写昵称与姓名）。
          </p>
        ) : (
          <p className="muted small">
            当前账号：<strong>{user.nickname}</strong>（{user.realName}）— 将以该昵称作为发起人显示。
          </p>
        )}
        <form className="form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>标题</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：春季追光讲堂 · 某主题" />
          </label>
          <label className="field">
            <span>说明</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="想做什么、为什么好玩、交付物或体验大概是什么"
            />
          </label>
          <div className="form-row">
            <label className="field">
              <span>预算（大致区间即可）</span>
              <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="例如：3000–5000 元" />
            </label>
            <label className="field narrow">
              <span>需要人数</span>
              <input
                type="number"
                min={1}
                value={peopleNeeded}
                onChange={(e) => setPeopleNeeded(Number(e.target.value) || 1)}
              />
            </label>
          </div>
          {msg ? <p className="form-msg">{msg}</p> : null}
          <button type="submit" className="btn primary" disabled={!user}>
            发布创意
          </button>
        </form>
      </section>

      <section>
        <h2 className="section-title">全部创意</h2>
        {ideas.length === 0 ? (
          <p className="muted">还没有创意，做第一个发帖的人吧。</p>
        ) : (
          <ul className="idea-list">
            {ideas.map((idea) => (
              <li key={idea.id} className="idea-row card">
                <div className="idea-row-main">
                  <Link to={`/ideas/${idea.id}`} className="idea-title">
                    {idea.title}
                  </Link>
                  <p className="idea-meta">
                    {idea.authorName} · 更新 {formatDate(idea.updatedAt)} · 报名 {idea.signups.length}/
                    {idea.peopleNeeded} 人
                  </p>
                  <p className="idea-budget">预算：{idea.budget}</p>
                </div>
                <Link to={`/ideas/${idea.id}`} className="btn ghost">
                  查看
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

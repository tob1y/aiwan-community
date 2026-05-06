import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { formatDate } from '../lib/format'

export function IdeaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const uid = user?.id ?? null
  const { ideas, canEditIdea, updateIdea, addSignup, removeIdea } = useCommunity()

  const idea = useMemo(() => ideas.find((i) => i.id === id), [ideas, id])
  const editable = id ? canEditIdea(id, uid) : false

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [peopleNeeded, setPeopleNeeded] = useState(1)
  const [editDirty, setEditDirty] = useState(false)

  const [signupNote, setSignupNote] = useState('')
  const [banner, setBanner] = useState('')

  useEffect(() => {
    if (!idea || editDirty) return
    setTitle(idea.title)
    setDescription(idea.description)
    setBudget(idea.budget)
    setPeopleNeeded(idea.peopleNeeded)
  }, [idea, idea?.title, idea?.description, idea?.budget, idea?.peopleNeeded, idea?.updatedAt, editDirty])

  if (!idea) {
    return (
      <div className="page">
        <p>找不到该创意。</p>
        <Link to="/ideas">返回创意区</Link>
      </div>
    )
  }

  const row = idea

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editable) return
    try {
      await updateIdea(row.id, uid, { title, description, budget, peopleNeeded })
      setEditDirty(false)
      setBanner('已保存修改。')
    } catch (err) {
      setBanner(err instanceof Error ? err.message : '保存失败')
    }
  }

  async function onSignup(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setBanner('请先登录后再报名。')
      return
    }
    if (row.signups.some((s) => s.userId === user.id)) {
      setBanner('你已经报过名了。')
      return
    }
    try {
      await addSignup(row.id, user.nickname, signupNote || undefined, user.id)
      setSignupNote('')
      setBanner('报名已记录。')
    } catch (err) {
      setBanner(err instanceof Error ? err.message : '报名失败')
    }
  }

  async function onDeleteIdea() {
    if (
      !window.confirm(
        '确定删除该创意？报名记录会一并删除且不可恢复。想聊天发图请到「讨论区」单开帖子。',
      )
    ) {
      return
    }
    try {
      await removeIdea(row.id, uid)
      navigate('/ideas')
    } catch (err) {
      setBanner(err instanceof Error ? err.message : '删除失败')
    }
  }

  const filled = row.signups.length >= row.peopleNeeded

  return (
    <div className="page">
      <nav className="crumb">
        <Link to="/ideas">创意区</Link>
        <span aria-hidden> / </span>
        <span>{row.title}</span>
      </nav>

      {banner ? <p className="banner">{banner}</p> : null}

      <header className="page-head tight">
        <h1 className="page-title">{row.title}</h1>
        <p className="page-desc">
          发起人 {row.authorName} · 发布于 {formatDate(row.createdAt)}
        </p>
      </header>

      {editable ? (
        <section className="card form-card">
          <h2 className="card-title">编辑创意</h2>
          <form className="form" onSubmit={(e) => void saveEdit(e)}>
            <label className="field">
              <span>标题</span>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setEditDirty(true)
                }}
              />
            </label>
            <label className="field">
              <span>说明</span>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setEditDirty(true)
                }}
                rows={5}
              />
            </label>
            <div className="form-row">
              <label className="field">
                <span>预算</span>
                <input
                  value={budget}
                  onChange={(e) => {
                    setBudget(e.target.value)
                    setEditDirty(true)
                  }}
                />
              </label>
              <label className="field narrow">
                <span>需要人数</span>
                <input
                  type="number"
                  min={1}
                  value={peopleNeeded}
                  onChange={(e) => {
                    setPeopleNeeded(Number(e.target.value) || 1)
                    setEditDirty(true)
                  }}
                />
              </label>
            </div>
            <div className="form-actions-row">
              <button type="submit" className="btn primary">
                保存修改
              </button>
              <button type="button" className="btn text danger" onClick={onDeleteIdea}>
                删除该创意
              </button>
            </div>
          </form>
        </section>
      ) : row.authorUserId ? (
        <section className="card prose">
          <p className="muted small">仅发起人所登录的账号可以编辑或删除本创意。</p>
        </section>
      ) : (
        <section className="card prose">
          <p className="muted small">
            本创意为早期数据（按浏览器绑定编辑权）。若你是发起人但无法编辑，请在新账号下重发一条或联系主理人迁移说明。
          </p>
        </section>
      )}

      <section className="card prose">
        <h2>说明</h2>
        <p className="pre-wrap">{row.description}</p>
        <p>
          <strong>预算：</strong>
          {row.budget}
        </p>
        <p>
          <strong>人数：</strong>已报名 {row.signups.length} / 目标 {row.peopleNeeded} 人
          {filled ? <span className="tag ok">已凑满，可提交主理人</span> : null}
        </p>
        <p className="muted small">
          想讨论方案、发图聊天请前往 <Link to="/forum">讨论区</Link>。
        </p>
      </section>

      <section className="card form-card">
        <h2 className="card-title">我要报名</h2>
        {!user ? (
          <p className="muted">
            报名需要先 <Link to="/login">登录</Link>；还没有账号请 <Link to="/register">注册</Link>。
          </p>
        ) : (
          <>
            <p className="muted small">
              将以昵称 <strong>{user.nickname}</strong> 报名（同一账号对同一创意不可重复报名）。
            </p>
            <form className="form" onSubmit={(e) => void onSignup(e)}>
              <label className="field">
                <span>备注（可选）</span>
                <input
                  value={signupNote}
                  onChange={(e) => setSignupNote(e.target.value)}
                  placeholder="能做什么角色、时间段等"
                />
              </label>
              <button type="submit" className="btn primary">
                报名
              </button>
            </form>
          </>
        )}
        {row.signups.length > 0 ? (
          <ul className="signup-list">
            {row.signups.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>
                {s.note ? <span className="muted"> — {s.note}</span> : null}
                <span className="muted small"> · {formatDate(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}

import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { formatDate } from '../lib/format'
import { fileToDataUrl } from '../lib/imageData'

export function ForumThread() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const uid = user?.id ?? null
  const { forumPosts, canEditForumPost, addForumReply, removeForumPost } = useCommunity()
  const post = useMemo(() => forumPosts.find((p) => p.id === id), [forumPosts, id])
  const editable = id ? canEditForumPost(id, uid) : false

  const [body, setBody] = useState('')
  const [replyImage, setReplyImage] = useState<string | undefined>(undefined)
  const [banner, setBanner] = useState('')

  if (!post) {
    return (
      <div className="page">
        <p>找不到该帖。</p>
        <Link to="/forum">返回讨论区</Link>
      </div>
    )
  }

  const row = post

  async function onPickReplyImage(file: File | null) {
    setBanner('')
    if (!file) {
      setReplyImage(undefined)
      return
    }
    try {
      setReplyImage(await fileToDataUrl(file))
    } catch (e) {
      setBanner(e instanceof Error ? e.message : '图片读取失败')
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setBanner('请先登录后再回复。')
      return
    }
    if (!body.trim()) {
      setBanner('请填写回复内容。')
      return
    }
    try {
      await addForumReply(row.id, user.nickname, body, replyImage, user.id)
      setBody('')
      setReplyImage(undefined)
      setBanner('已发送。')
    } catch (err) {
      setBanner(err instanceof Error ? err.message : '发送失败')
    }
  }

  async function onDeletePost() {
    if (!window.confirm('确定删除该帖？所有回复会一并删除且不可恢复。')) return
    const pid = row.id
    try {
      await removeForumPost(pid, uid)
      navigate('/forum', { replace: true })
    } catch (err) {
      setBanner(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="page">
      <nav className="crumb">
        <Link to="/forum">讨论区</Link>
        <span aria-hidden> / </span>
        <span>{row.title}</span>
      </nav>

      {banner ? <p className="banner">{banner}</p> : null}

      <header className="page-head tight">
        <h1 className="page-title">{row.title}</h1>
        <p className="page-desc">
          {row.authorName} · {formatDate(row.createdAt)}
        </p>
      </header>

      <section className="card prose forum-op">
        <p className="pre-wrap forum-body">{row.body}</p>
        {row.images.length > 0 ? (
          <div className="forum-gallery">
            {row.images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="forum-gallery-link">
                <img src={src} alt={`配图 ${i + 1}`} className="forum-gallery-img" loading="lazy" />
              </a>
            ))}
          </div>
        ) : null}
        {editable ? (
          <button type="button" className="btn text danger pad-top" onClick={onDeletePost}>
            删除该帖
          </button>
        ) : row.authorUserId ? (
          <p className="muted small pad-top">仅发帖人所登录的账号可以删除本帖。</p>
        ) : (
          <p className="muted small pad-top">本帖为早期数据（按浏览器绑定删帖权限）。</p>
        )}
      </section>

      <section className="card form-card">
        <h2 className="card-title">回复</h2>
        {!user ? (
          <p className="muted">
            回复需要先 <Link to="/login">登录</Link>；还没有账号请 <Link to="/register">注册</Link>。
          </p>
        ) : (
          <p className="muted small">
            以 <strong>{user.nickname}</strong> 回复
          </p>
        )}
        <form className="form" onSubmit={(e) => void onReply(e)}>
          <label className="field">
            <span>内容</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </label>
          <label className="field">
            <span>配图（可选）</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onPickReplyImage(e.target.files?.[0] ?? null)}
            />
          </label>
          {replyImage ? (
            <figure className="forum-preview-fig">
              <img src={replyImage} alt="" className="forum-preview-img" />
              <button type="button" className="btn text small" onClick={() => setReplyImage(undefined)}>
                移除配图
              </button>
            </figure>
          ) : null}
          <button type="submit" className="btn primary" disabled={!user}>
            发送回复
          </button>
        </form>
      </section>

      <section className="card prose">
        <h2 className="card-title" style={{ marginTop: 0 }}>
          全部回复（{row.replies.length}）
        </h2>
        {row.replies.length === 0 ? (
          <p className="muted">还没有回复，来抢沙发吧。</p>
        ) : (
          <ul className="forum-reply-list">
            {[...row.replies].reverse().map((r) => (
              <li key={r.id} className="forum-reply">
                <div className="comment-head">
                  <strong>{r.authorName}</strong>
                  <span className="muted small">{formatDate(r.createdAt)}</span>
                </div>
                <p className="pre-wrap">{r.body}</p>
                {r.imageDataUrl ? (
                  <a href={r.imageDataUrl} target="_blank" rel="noreferrer" className="forum-reply-img-wrap">
                    <img src={r.imageDataUrl} alt="" className="forum-reply-img" loading="lazy" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

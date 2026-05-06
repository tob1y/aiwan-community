import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { formatDate } from '../lib/format'
import { fileToDataUrl } from '../lib/imageData'

const MAX_POST_IMAGES = 4

export function Forum() {
  const { user } = useAuth()
  const { forumPosts, addForumPost } = useCommunity()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return
    setMsg('')
    const next: string[] = [...images]
    try {
      for (let i = 0; i < files.length && next.length < MAX_POST_IMAGES; i++) {
        const url = await fileToDataUrl(files[i])
        next.push(url)
      }
      setImages(next)
      if (files.length + images.length > MAX_POST_IMAGES) {
        setMsg(`最多保留 ${MAX_POST_IMAGES} 张图，已截断。`)
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '图片添加失败')
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setMsg('请先登录后再发帖。')
      return
    }
    if (!title.trim() || !body.trim()) {
      setMsg('请填写标题与正文。')
      return
    }
    try {
      const id = await addForumPost({
        title: title.trim(),
        body: body.trim(),
        images: [...images],
        authorName: user.nickname,
        authorUserId: user.id,
      })
      setTitle('')
      setBody('')
      setImages([])
      setMsg('')
      navigate(`/forum/${id}`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '发布失败')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">讨论区</h1>
        <p className="page-desc">
          发图、回帖、闲聊与追问都可以在这里进行。数据存在本机浏览器；单张图请控制在约 900KB 以内。
        </p>
      </header>

      <section className="card form-card">
        <h2 className="card-title">发起新帖</h2>
        {!user ? (
          <p className="muted">
            发帖需要先 <Link to="/login">登录</Link>；还没有账号请 <Link to="/register">注册</Link>。
          </p>
        ) : (
          <p className="muted small">
            当前账号：<strong>{user.nickname}</strong>（{user.realName}）
          </p>
        )}
        <form className="form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>标题</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一句话说明主题"
            />
          </label>
          <label className="field">
            <span>正文</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="想说的话、问题、梗图配文……"
            />
          </label>
          <label className="field">
            <span>配图（可选，最多 {MAX_POST_IMAGES} 张）</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void onPickImages(e.target.files)}
            />
          </label>
          {images.length > 0 ? (
            <div className="forum-preview-row">
              {images.map((src, idx) => (
                <figure key={idx} className="forum-preview-fig">
                  <img src={src} alt="" className="forum-preview-img" />
                  <button
                    type="button"
                    className="btn text small"
                    onClick={() => setImages(images.filter((_, j) => j !== idx))}
                  >
                    移除
                  </button>
                </figure>
              ))}
            </div>
          ) : null}
          {msg ? <p className="form-msg">{msg}</p> : null}
          <button type="submit" className="btn primary" disabled={!user}>
            发布
          </button>
        </form>
      </section>

      <section>
        <h2 className="section-title">全部帖子</h2>
        {forumPosts.length === 0 ? (
          <p className="muted">还没有帖子，做第一个发帖的人吧。</p>
        ) : (
          <ul className="idea-list">
            {forumPosts.map((post) => (
              <li key={post.id} className="idea-row card">
                <div className="idea-row-main">
                  <Link to={`/forum/${post.id}`} className="idea-title">
                    {post.title}
                  </Link>
                  <p className="idea-meta">
                    {post.authorName} · 更新 {formatDate(post.updatedAt)} · {post.replies.length} 条回复
                    {post.images.length > 0 ? ` · ${post.images.length} 图` : null}
                  </p>
                </div>
                <Link to={`/forum/${post.id}`} className="btn ghost">
                  进入
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

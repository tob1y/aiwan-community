import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { formatDate } from '../lib/format'
import { fileToDataUrl } from '../lib/imageData'

const TAGS = ['出行', '讲堂', '黑客松', '其他'] as const
const MAX_IMAGES = 6

export function Activities() {
  const { user } = useAuth()
  const { pastActivities, addPastActivity, updatePastActivity, removePastActivity } = useCommunity()

  // 上传表单
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [date, setDate] = useState('')
  const [tag, setTag] = useState<string>(TAGS[0])
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined)
  const [images, setImages] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null)

  function resetForm() {
    setTitle('')
    setSummary('')
    setDate('')
    setTag(TAGS[0])
    setBody('')
    setCoverImage(undefined)
    setImages([])
    setEditingId(null)
  }

  async function onPickCover(file: File | null) {
    if (!file) {
      setCoverImage(undefined)
      return
    }
    try {
      setCoverImage(await fileToDataUrl(file))
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '封面图读取失败')
    }
  }

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return
    const next = [...images]
    try {
      for (let i = 0; i < files.length && next.length < MAX_IMAGES; i++) {
        next.push(await fileToDataUrl(files[i]))
      }
      setImages(next)
      if (files.length + images.length > MAX_IMAGES) {
        setMsg(`最多 ${MAX_IMAGES} 张配图，已截断。`)
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '配图读取失败')
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setMsg('请先登录后再上传。')
      return
    }
    if (!title.trim() || !summary.trim() || !date || !body.trim()) {
      setMsg('标题、摘要、日期与正文为必填。')
      return
    }
    try {
      await addPastActivity({
        title: title.trim(),
        summary: summary.trim(),
        date,
        tag,
        body: body.trim(),
        coverImage: coverImage ?? undefined,
        images: [...images],
      })
      resetForm()
      setMsg('已发布往期项目。')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '发布失败')
    }
  }

  async function onEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    try {
      await updatePastActivity(editingId, {
        title: title.trim(),
        summary: summary.trim(),
        date,
        tag,
        body: body.trim(),
        coverImage: coverImage ?? undefined,
        images: [...images],
      })
      resetForm()
      setMsg('已更新。')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '更新失败')
    }
  }

  function startEdit(id: string) {
    const a = pastActivities.find((p) => p.id === id)
    if (!a) return
    setEditingId(id)
    setTitle(a.title)
    setSummary(a.summary)
    setDate(a.date)
    setTag(a.tag)
    setBody(a.body)
    setCoverImage(a.coverImage)
    setImages([...a.images])
  }

  function cancelEdit() {
    resetForm()
  }

  async function onDelete(id: string) {
    if (!window.confirm('确定删除该项目？图文不可恢复。')) return
    try {
      await removePastActivity(id)
      if (editingId === id) resetForm()
      setMsg('已删除。')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '删除失败')
    }
  }

  const isEditing = editingId !== null

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">往期项目</h1>
        <p className="page-desc">
          归档人生万里行、追光讲堂、黑客松等活动；每人可上传图文回顾。
        </p>
      </header>

      {msg ? <p className="banner">{msg}</p> : null}

      {/* 上传 / 编辑表单 */}
      <section className="card form-card">
        <h2 className="card-title">{isEditing ? '编辑项目' : '上传往期项目'}</h2>
        {!user ? (
          <p className="muted">请先登录后再上传。</p>
        ) : isEditing ? (
          <p className="muted small">正在编辑「{pastActivities.find((a) => a.id === editingId)?.title}」</p>
        ) : null}
        <form className="form" onSubmit={(e) => void (isEditing ? onEditSubmit(e) : onSubmit(e))}>
          <label className="field">
            <span>标题</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：九寨沟出行 · 2026 春" />
          </label>

          <label className="field">
            <span>一句话摘要</span>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="一行总结，卡片预览时显示" />
          </label>

          <div className="form-row">
            <label className="field">
              <span>活动日期</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field narrow">
              <span>标签</span>
              <select value={tag} onChange={(e) => setTag(e.target.value)}>
                {TAGS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>正文（图文回顾）</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="写一篇回顾文字：过程、亮点、照片说明、参与者感想……"
            />
          </label>

          <label className="field">
            <span>封面图（可选，建议横版）</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
            />
          </label>
          {coverImage ? (
            <figure className="forum-preview-fig">
              <img src={coverImage} alt="封面预览" className="forum-preview-img" />
              <button type="button" className="btn text small" onClick={() => setCoverImage(undefined)}>
                移除封面
              </button>
            </figure>
          ) : null}

          <label className="field">
            <span>配图（可选，最多 {MAX_IMAGES} 张）</span>
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
                  <img src={src} alt={`配图 ${idx + 1}`} className="forum-preview-img" />
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

          <div className="form-actions-row">
            <button type="submit" className="btn primary" disabled={!user}>
              {isEditing ? '保存修改' : '发布项目'}
            </button>
            {isEditing ? (
              <button type="button" className="btn text" onClick={cancelEdit}>
                取消编辑
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {/* 项目列表 */}
      <section>
        <h2 className="section-title">已归档项目（{pastActivities.length}）</h2>
        {pastActivities.length === 0 ? (
          <p className="muted">还没有归档的项目，来做第一个上传的人吧。</p>
        ) : (
          <div className="activity-grid">
            {pastActivities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                isOwner={!!user}
                onEdit={() => startEdit(a.id)}
                onDelete={() => void onDelete(a.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/** 单个项目卡片，点击可展开正文与图片 */
function ActivityCard({
  activity: a,
  isOwner,
  onEdit,
  onDelete,
}: {
  activity: ReturnType<typeof useCommunity>['pastActivities'][number]
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <article className="card activity-card">
      {a.coverImage ? (
        <div className="activity-cover" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          <img src={a.coverImage} alt={a.title} loading="lazy" />
        </div>
      ) : (
        <div className="activity-cover empty" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          <span className="muted">点击展开</span>
        </div>
      )}

      <div className="activity-card-body">
        <header className="activity-card-head">
          <h3>{a.title}</h3>
          <div className="activity-meta-row">
            <span className="tag suggest">{a.tag}</span>
            <time className="muted small">{a.date}</time>
          </div>
        </header>
        <p className="activity-summary">{a.summary}</p>

        {open ? (
          <div className="activity-detail">
            <p className="pre-wrap activity-body">{a.body}</p>
            {a.images.length > 0 ? (
              <div className="forum-gallery">
                {a.images.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer" className="forum-gallery-link">
                    <img src={src} alt={`${a.title} 配图 ${i + 1}`} className="forum-gallery-img" loading="lazy" />
                  </a>
                ))}
              </div>
            ) : null}
            {isOwner ? (
              <div className="activity-actions">
                <button type="button" className="btn secondary small" onClick={onEdit}>
                  编辑
                </button>
                <button type="button" className="btn text danger small" onClick={onDelete}>
                  删除
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className="btn text small"
          onClick={() => setOpen(!open)}
          style={{ marginTop: '0.5rem' }}
        >
          {open ? '收起' : '展开详情'}
        </button>
      </div>
    </article>
  )
}

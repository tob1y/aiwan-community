import { useEffect, useState, type FormEvent } from 'react'
import type { OngoingProject } from '../types'
import { useCommunity } from '../context/CommunityContext'
import { formatDate } from '../lib/format'

function OngoingCard({
  project: p,
  onUpdateSummary,
  onAddLog,
  onRemove,
}: {
  project: OngoingProject
  onUpdateSummary: (id: string, s: string) => void | Promise<void>
  onAddLog: (id: string, note: string) => void | Promise<void>
  onRemove: (id: string) => void | Promise<void>
}) {
  const [sum, setSum] = useState(p.currentSummary)
  const [log, setLog] = useState('')
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setSum(p.currentSummary)
  }, [p.currentSummary, p.updatedAt])

  return (
    <article className="card project-card">
      <header className="project-card-head">
        <h3>{p.name}</h3>
        <button type="button" className="btn text" onClick={() => setOpen(!open)}>
          {open ? '收起' : '展开'}
        </button>
      </header>
      <p className="muted small">
        负责人 {p.lead} · 更新 {formatDate(p.updatedAt)}
      </p>
      {p.team ? (
        <p>
          <strong>小组：</strong>
          {p.team}
        </p>
      ) : null}
      {p.feishuUrl ? (
        <p>
          <a href={p.feishuUrl} className="link" target="_blank" rel="noreferrer">
            打开飞书协作
          </a>
        </p>
      ) : null}
      {open ? (
        <>
          <label className="field tight">
            <span>当前进度摘要</span>
            <textarea value={sum} onChange={(e) => setSum(e.target.value)} rows={3} />
          </label>
          <button
            type="button"
            className="btn secondary small"
            onClick={() => void onUpdateSummary(p.id, sum)}
          >
            保存摘要
          </button>
          <div className="log-box">
            <h4>进度记录</h4>
            {p.progressLogs.length === 0 ? (
              <p className="muted small">暂无阶段性更新。</p>
            ) : (
              <ul className="log-list">
                {[...p.progressLogs].reverse().map((l) => (
                  <li key={l.id}>
                    <time className="muted small">{formatDate(l.at)}</time>
                    <p className="pre-wrap">{l.note}</p>
                  </li>
                ))}
              </ul>
            )}
            <label className="field tight">
              <span>追加一条进度</span>
              <textarea value={log} onChange={(e) => setLog(e.target.value)} rows={2} placeholder="例如：本周已确定场地；下周出海报初稿" />
            </label>
            <button
              type="button"
              className="btn primary small"
              onClick={() => {
                if (!log.trim()) return
                void (async () => {
                  await onAddLog(p.id, log)
                  setLog('')
                })()
              }}
            >
              追加记录
            </button>
          </div>
        </>
      ) : null}
      <button type="button" className="btn text danger pad-top" onClick={() => void onRemove(p.id)}>
        从看板移除
      </button>
    </article>
  )
}

export function Board() {
  const {
    announcements,
    ongoingProjects,
    addAnnouncement,
    removeAnnouncement,
    addOngoingProject,
    updateOngoingSummary,
    addProgressLog,
    removeOngoingProject,
  } = useCommunity()

  const [aTitle, setATitle] = useState('')
  const [aBody, setABody] = useState('')
  const [pName, setPName] = useState('')
  const [pLead, setPLead] = useState('')
  const [pTeam, setPTeam] = useState('')
  const [pSum, setPSum] = useState('')
  const [pFeishu, setPFeishu] = useState('')
  const [hint, setHint] = useState('')

  async function submitAnnouncement(e: FormEvent) {
    e.preventDefault()
    if (!aTitle.trim() || !aBody.trim()) {
      setHint('公告标题与正文都要填写。')
      return
    }
    try {
      await addAnnouncement(aTitle, aBody)
      setATitle('')
      setABody('')
      setHint('已发布公告。')
    } catch (err) {
      setHint(err instanceof Error ? err.message : '发布失败')
    }
  }

  async function submitProject(e: FormEvent) {
    e.preventDefault()
    if (!pName.trim() || !pLead.trim() || !pSum.trim()) {
      setHint('项目名称、负责人与当前进度摘要为必填。')
      return
    }
    try {
      await addOngoingProject({
        name: pName,
        lead: pLead,
        team: pTeam,
        currentSummary: pSum,
        feishuUrl: pFeishu || undefined,
      })
      setPName('')
      setPLead('')
      setPTeam('')
      setPSum('')
      setPFeishu('')
      setHint('已添加进行中的项目。')
    } catch (err) {
      setHint(err instanceof Error ? err.message : '添加失败')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">公告栏</h1>
        <p className="page-desc">置顶为申请与协作须知；下方为当期公告与「正在干」的进度看板。</p>
      </header>

      <section className="card pin-card" id="guide">
        <div className="pin-label">置顶 · 申请须知</div>
        <h2 className="card-title">爱玩社区 · 项目申请与协作说明</h2>
        <p className="muted small">最后更新：由主理人维护本页文字；改规则时改日期即可。</p>

        <div className="guide">
          <h3>1. 谁拍板</h3>
          <p>预算与是否立项由主理人根据当期资金池批复；社区页面负责把规则说清楚、把过程晒出来。</p>

          <h3>2. 从创意到开干</h3>
          <ol>
            <li>在「创意区」发帖：写清想做什么、预算区间、大概需要多少人。</li>
            <li>成员可报名；发起人可根据反馈更新方案（建议同步到飞书文档并在此留链接）。发图与闲聊请使用「讨论区」。</li>
            <li>
              <strong>凑满人</strong>不仅看人数：至少要有可执行的<strong>负责人</strong>与分工预期；若只有「围观报名」，主理人可要求发起人重新组队。
            </li>
            <li>人数与角色就绪后，发起人按下方「提交包」准备材料，向主理人正式提交。</li>
          </ol>

          <h3>3. 提交包建议包含</h3>
          <ul>
            <li>目标与交付物（哪怕很粗）</li>
            <li>预算明细区间：上限、可删减项、是否可能超支</li>
            <li>时间表：开始时间、关键节点、结束与复盘时间</li>
            <li>风险与取消条件（天气、审批、安全、嘉宾档期等）</li>
          </ul>

          <h3>4. 主理人反馈</h3>
          <p>
            建议约定：提交后 <strong>N 个工作日内</strong>（由主理人填写具体数字）给出「通过 / 需补材料 / 暂缓」之一，避免石沉大海。
          </p>

          <h3>5. 队列与批次</h3>
          <p>若资金按学期或季度释放，请在本栏另发「本期预算窗口」公告：写明<strong>截止时间</strong>与<strong>本期大致额度量级</strong>，避免多项目挤在同一窗口。</p>

          <h3>6. 未通过时</h3>
          <p>若暂未通过，发起人应通知报名者，并说明是否改期重提；网站可继续保留创意帖作为记录。</p>

          <h3>7. 日常协作</h3>
          <p>
            讨论、文档、会议与文件建议放在<strong>飞书</strong>（群 + 云文档 + 任务）。本站公告栏用于<strong>公示</strong>：谁在带队、当前摘要、阶段性进度更新；飞书链接可贴在项目卡里。
          </p>

          <h3>8. 「本期窗口」公告</h3>
          <p className="muted">
            主理人可在下方「动态公告」单独发一条短期置顶信息（例如本学期预算申报截止日），不必每次改动全文须知。
          </p>
        </div>
      </section>

      {hint ? <p className="banner">{hint}</p> : null}

      <section className="card form-card">
        <h2 className="card-title">发布动态公告</h2>
        <p className="muted small">用于本期预算窗口、已通过项目公示、临时通知等。</p>
        <form className="form" onSubmit={(e) => void submitAnnouncement(e)}>
          <label className="field">
            <span>标题</span>
            <input value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="例如：2026 春季项目申报截止提醒" />
          </label>
          <label className="field">
            <span>正文</span>
            <textarea value={aBody} onChange={(e) => setABody(e.target.value)} rows={5} />
          </label>
          <button type="submit" className="btn primary">
            发布公告
          </button>
        </form>
      </section>

      <section>
        <h2 className="section-title">动态公告</h2>
        {announcements.length === 0 ? (
          <p className="muted">暂无公告。</p>
        ) : (
          <ul className="announce-list">
            {announcements.map((a) => (
              <li key={a.id} className="card announce-card">
                <div className="announce-head">
                  <h3>{a.title}</h3>
                  <time className="muted small">{formatDate(a.createdAt)}</time>
                </div>
                <p className="pre-wrap announce-body">{a.body}</p>
                <button
                  type="button"
                  className="btn text danger"
                  onClick={() => void removeAnnouncement(a.id).catch((err: unknown) => setHint(err instanceof Error ? err.message : '删除失败'))}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card form-card">
        <h2 className="card-title">登记「正在干」的项目</h2>
        <p className="muted small">通过主理人立项后，在此公示负责人、队友与当前进度；细活仍在飞书。</p>
        <form className="form" onSubmit={(e) => void submitProject(e)}>
          <label className="field">
            <span>项目名称</span>
            <input value={pName} onChange={(e) => setPName(e.target.value)} />
          </label>
          <label className="field">
            <span>负责人</span>
            <input value={pLead} onChange={(e) => setPLead(e.target.value)} />
          </label>
          <label className="field">
            <span>核心成员 / 小组（可简述）</span>
            <input value={pTeam} onChange={(e) => setPTeam(e.target.value)} placeholder="例如：张三、李四（内容）；王五（外联）" />
          </label>
          <label className="field">
            <span>当前进度摘要</span>
            <textarea value={pSum} onChange={(e) => setPSum(e.target.value)} rows={3} placeholder="一句话告诉大家卡在哪、下一步是什么" />
          </label>
          <label className="field">
            <span>飞书文档或群链接（可选）</span>
            <input value={pFeishu} onChange={(e) => setPFeishu(e.target.value)} placeholder="https://..." />
          </label>
          <button type="submit" className="btn secondary">
            添加到看板
          </button>
        </form>
      </section>

      <section>
        <h2 className="section-title">进行中的项目</h2>
        {ongoingProjects.length === 0 ? (
          <p className="muted">还没有登记的项目。</p>
        ) : (
          <div className="project-grid">
            {ongoingProjects.map((p) => (
              <OngoingCard
                key={p.id}
                project={p}
                onUpdateSummary={(id, s) => updateOngoingSummary(id, s)}
                onAddLog={(id, note) => addProgressLog(id, note)}
                onRemove={(id) => removeOngoingProject(id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

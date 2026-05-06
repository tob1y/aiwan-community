export function Activities() {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">往期项目</h1>
        <p className="page-desc">归档人生万里行、追光讲堂、黑客松等活动；内容由社区陆续上传。</p>
      </header>

      <div className="empty-grid" aria-hidden>
        {[1, 2, 3].map((i) => (
          <div key={i} className="empty-card">
            <div className="empty-shimmer" />
            <p className="empty-label">待上传</p>
            <p className="empty-hint">标题 · 时间 · 图文回顾</p>
          </div>
        ))}
      </div>

      <p className="muted center pad-top">
        这一块预留给你填充：建议每条包含封面图、一句总结、日期与标签（出行 / 讲堂 / 黑客松等）。
      </p>
    </div>
  )
}

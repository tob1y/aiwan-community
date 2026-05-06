export function Home() {
  return (
    <div className="page">
      <section className="hero-block">
        <p className="eyebrow">社区门户 · 对内优先</p>
        <h1 className="page-title">欢迎来到爱玩社区</h1>
        <p className="lead">
          我们前身是西南财经大学的鲲鹏班；现在独立成一个小共同体，希望大家不只是观众，而是自己提案、自己凑队、愿意把手弄脏、一起把事做成。
        </p>
      </section>

      <section className="prose card">
        <h2>我们在做什么</h2>
        <p>
          主理人每年有固定的资金投入，更愿意花在「更值得一起玩」的事情上：可以是集体出行，可以是请人来讲，可以是黑客松式的闭关创作，也可以是你还没想到、但只要讲得清楚、凑得到人，我们就愿意认真听。
        </p>
        <p>
          已经跑通过的形态包括：开班时一起规划接下来怎么玩；「人生万里行」式的出行（例如九寨沟、西昌、杭州）；「追光讲堂」邀请前辈与嘉宾来聊；在都江堰组队闭关、用
          AI 做项目的黑客松……这些背后都有真实的资源支持。
        </p>
      </section>

      <section className="prose card">
        <h2>我们能提供什么</h2>
        <ul className="checklist">
          <li>项目与活动层面的资金支持（具体以当期公告与主理人批复为准）</li>
          <li>组织背书与协调：行程、嘉宾、场地、宣传等需要人盯的事</li>
          <li>一个把想法说清楚、把人凑起来、把进度晒出来的线上中枢</li>
        </ul>
      </section>

      <section className="prose card">
        <h2>我们希望遇到怎样的成员</h2>
        <ul className="checklist">
          <li>愿意发起或跟队，把创意写成别人看得懂的方案</li>
          <li>愿意承担一小段落地责任，而不是只围观</li>
          <li>愿意在活动结束后做简短复盘，让下一届少走弯路</li>
        </ul>
        <p className="muted small">
          主理人介绍与照片位暂空，之后可在此补充；预算拍板与申请细则见「公告栏」置顶说明。
        </p>
      </section>
    </div>
  )
}

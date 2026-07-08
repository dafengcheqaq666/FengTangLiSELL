const dailyNewsItems = [
  {
    time: "06:30",
    tag: "晨采",
    title: "清晨分批开剪，只摘果香成熟的一批",
    desc: "按果面色泽、手感与甜香逐颗挑选，保留清脆汁水和自然蜜甜。",
  },
  {
    time: "09:20",
    tag: "分选",
    title: "中大果优先装箱，坏果与磕碰果二次剔除",
    desc: "人工复检果皮、果形和成熟度，让到家的每一箱更稳定。",
  },
  {
    time: "12:10",
    tag: "鲜达",
    title: "今日鲜果篮陆续出库，物流单号同步生成",
    desc: "产地直发，防震网套独立保护，减少路途中的挤压与磕碰。",
  },
  {
    time: "16:40",
    tag: "提醒",
    title: "收货后先通风静置，常温回甜风味更圆润",
    desc: "偏脆口感可即食，喜欢蜜感更浓的顾客建议放置 1-2 天。",
  },
];

export function DailyNews() {
  const todayLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Shanghai",
  }).format(new Date());

  return (
    <section className="daily-news" id="news" aria-labelledby="daily-news-title">
      <div className="container news-grid">
        <div className="news-copy reveal">
          <div className="news-kicker">
            <span className="news-dot" aria-hidden="true" />
            DAILY ORCHARD NEWS
          </div>
          <h2 id="daily-news-title">每日新闻</h2>
          <p className="news-summary">
            记录仁寿吴家祠蜂糖李从晨采、分选到发出的每一个鲜活节点。新闻滚动播放，顾客一眼就能看到今日果园状态。
          </p>
          <div className="news-digest" aria-label="今日果园摘要">
            <div><strong>{todayLabel}</strong><span>今日播报</span></div>
            <div><strong>4 条</strong><span>鲜果动态</span></div>
            <div><strong>24h</strong><span>采后快发</span></div>
          </div>
        </div>
        <div className="news-reel reveal" aria-label="每日新闻滚动播放">
          <div className="news-track">
            <div className="news-list">
              {dailyNewsItems.map((item) => <NewsItem key={item.time} item={item} />)}
            </div>
            <div className="news-list" aria-hidden="true">
              {dailyNewsItems.map((item) => <NewsItem key={`loop-${item.time}`} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsItem({ item }: { item: (typeof dailyNewsItems)[number] }) {
  return (
    <article className="news-item">
      <div className="news-time">
        <strong>{item.time}</strong>
        <span>{item.tag}</span>
      </div>
      <div className="news-body">
        <h3>{item.title}</h3>
        <p>{item.desc}</p>
      </div>
    </article>
  );
}

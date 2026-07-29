// ============================================================
// 冷不丁就厉害了 - 数据源
// ============================================================

// 运动推荐 - 抗阻运动优先
const EXERCISE_RECOMMEND = [
  { name: "俯卧撑", meta: "胸部 · 4 组 × 15 次", icon: "💪" },
  { name: "深蹲", meta: "腿部 · 4 组 × 20 次", icon: "🦵" },
  { name: "平板支撑", meta: "核心 · 3 组 × 60 秒", icon: "🧘" },
  { name: "仰卧起坐", meta: "腹部 · 4 组 × 20 次", icon: "🏋️" },
  { name: "哑铃弯举", meta: "手臂 · 3 组 × 12 次", icon: "💪" },
  { name: "弓步蹲", meta: "下肢 · 3 组 × 12 次/侧", icon: "🦵" },
  { name: "波比跳", meta: "全身 · 3 组 × 10 次", icon: "🔥" },
  { name: "臀桥", meta: "臀部 · 3 组 × 15 次", icon: "🧘" },
  { name: "开合跳", meta: "心肺 · 3 组 × 30 次", icon: "⚡" },
  { name: "卷腹", meta: "腹部 · 3 组 × 20 次", icon: "🏋️" },
];

// 学习推荐
const STUDY_RECOMMEND = [
  { name: "📖 阅读 30 分钟", meta: "每天读书，遇见更好的自己" },
  { name: "✍️ 写作 20 分钟", meta: "每天写下所思所想" },
  { name: "🎧 听书 / 播客", meta: "通勤路上学习" },
  { name: "📝 记笔记", meta: "复述当天学到的内容" },
  { name: "🧠 学习一门网课", meta: "每天进步一点点" },
];

// 100天技能挑战
const SKILL_CHALLENGE = [
  { day: 1, name: "学一道新菜", icon: "🍳" },
  { day: 2, name: "学一段舞蹈", icon: "💃" },
  { day: 3, name: "学一首新歌", icon: "🎤" },
  { day: 4, name: "学摄影构图", icon: "📷" },
  { day: 5, name: "学基础 PS", icon: "🎨" },
  { day: 6, name: "学剪视频", icon: "🎬" },
  { day: 7, name: "学理财基础", icon: "💰" },
  { day: 8, name: "学一门外语", icon: "🌍" },
  { day: 9, name: "学手账制作", icon: "📔" },
  { day: 10, name: "学写代码", icon: "💻" },
];

// 每日要闻 - 国际
const NEWS_WORLD = [
  { title: "联合国发布最新全球可持续发展报告", meta: "联合国 · 2小时前", tag: "国际组织" },
  { title: "全球气候变化峰会召开，多国承诺减排新目标", meta: "路透社 · 4小时前", tag: "气候" },
  { title: "AI 领域新突破：通用人工智能研究取得重要进展", meta: "BBC · 6小时前", tag: "科技" },
  { title: "欧洲央行宣布最新利率决议", meta: "法新社 · 8小时前", tag: "财经" },
  { title: "世卫组织发布最新全球健康报告", meta: "WHO · 10小时前", tag: "健康" },
  { title: "国际空间站迎来新一批宇航员", meta: "NASA · 12小时前", tag: "航天" },
];

// 每日要闻 - 国内
const NEWS_CHINA = [
  { title: "国家统计局发布最新经济数据", meta: "央视新闻 · 1小时前", tag: "财经" },
  { title: "全国科技工作会议在京召开", meta: "新华社 · 3小时前", tag: "科技" },
  { title: "教育部发布最新教育政策", meta: "人民网 · 5小时前", tag: "教育" },
  { title: "我国新能源汽车销量再创新高", meta: "光明日报 · 7小时前", tag: "产业" },
  { title: "国家卫生健康委部署秋冬健康防护工作", meta: "健康报 · 9小时前", tag: "健康" },
  { title: "中国航天再传捷报：新型火箭首飞成功", meta: "中国日报 · 11小时前", tag: "航天" },
];

// 每日要闻 - 科技
const NEWS_TECH = [
  { title: "国产大模型取得新突破，多项指标国际领先", meta: "36氪 · 1小时前", tag: "AI" },
  { title: "新一代 5.5G 通信技术开始试点", meta: "虎嗅 · 3小时前", tag: "通信" },
  { title: "量子计算原型机发布，性能再创新高", meta: "量子前线 · 5小时前", tag: "量子" },
  { title: "国产芯片设计实现重要技术突破", meta: "雷锋网 · 7小时前", tag: "芯片" },
  { title: "人形机器人商业化进程加速", meta: "机器之心 · 9小时前", tag: "机器人" },
];

// 每日要闻 - 财经
const NEWS_FINANCE = [
  { title: "A股三大指数集体收涨，科技股领涨", meta: "财经网 · 1小时前", tag: "股市" },
  { title: "央行公开市场操作平稳，流动性合理充裕", meta: "上海证券报 · 3小时前", tag: "金融" },
  { title: "数字人民币试点场景再扩容", meta: "21财经 · 5小时前", tag: "数字货币" },
  { title: "新能源板块持续走强，多家公司业绩亮眼", meta: "证券时报 · 7小时前", tag: "行业" },
];

const NEWS_DATA = {
  world: NEWS_WORLD,
  china: NEWS_CHINA,
  tech: NEWS_TECH,
  finance: NEWS_FINANCE
};

// 任务配置
const TASKS = [
  { key: 'morning', name: '7:20 起床', icon: '⏰', iconImg: 'assets/task-1.jpg', page: 'morning' },
  { key: 'baduanjin', name: '八段锦 2 遍', icon: '🧘', iconImg: 'assets/task-2.jpg', page: 'morning' },
  { key: 'plan', name: '安排行程', icon: '📋', iconImg: 'assets/task-3.jpg', page: 'morning' },
  { key: 'exercise', name: '运动 1 小时', icon: '🏃', iconImg: 'assets/task-4.jpg', page: 'exercise' },
  { key: 'study', name: '学习 1 小时', icon: '📚', iconImg: 'assets/task-5.jpg', page: 'study' },
  { key: 'skill', name: '新技能 1 小时', iconImg: 'assets/task-6.jpg', page: 'skill' },
  { key: 'review', name: '睡前复盘', iconImg: 'assets/task-7.jpg', page: 'review' },
  { key: 'sleep', name: '10:30 入睡', iconImg: 'assets/task-8.jpg', page: 'review' },
];

// 奖励文案
const REWARD_TEXTS = [
  { title: '太棒了！', text: '完成了一项任务，继续加油！' },
  { title: '超厉害！', text: '你又解锁了一项成就！' },
  { title: '稳！', text: '今日份的努力已打卡！' },
  { title: '为你点赞！', text: '今天的你比昨天更厉害！' },
  { title: '满分！', text: '坚持就是胜利！' },
  { title: '冷不丁就厉害了！', text: '你又离目标近了一步！' },
];

// 每日金句
const DAILY_QUOTES = [
  "今天，又是全新的一天",
  "慢慢来，比较快",
  "你比你想象的更强大",
  "每一个小小的坚持，都在改变你",
  "种一棵树最好的时间是十年前，其次是现在",
  "所有的惊艳，都来自长久的努力",
  "自律给我自由",
  "不为模糊不清的未来担忧，只为清清楚楚的现在努力",
  "越努力，越幸运",
  "你现在偷的每一个懒，都是给未来挖的坑",
];

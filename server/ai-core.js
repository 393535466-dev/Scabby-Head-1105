/**
 * 「臭脑子」AI 加工核心逻辑。
 * 只在 Node 侧运行：Vercel Serverless (api/ai.js)、Vite 本地代理 (vite.config.js)、
 * 以及单端口预览服务 (server/preview.mjs) 共用这一份。
 * 前端永远拿不到 DEEPSEEK_API_KEY。
 */
export const DEFAULT_MODEL = 'deepseek-flash';
const BASE_URL = 'https://api.deepseek.com';
const VALID_ACTIONS = new Set(['extend', 'caption', 'poster', 'suggestTags']);

const TONE_GUIDE = {
  温和: '友善、平实、带一点鼓励，不夸张',
  犀利: '直截了当、抓关键，但不刻薄、不人身攻击',
  幽默: '轻快俏皮，仍然尊重用户',
  文艺: '有画面感、克制、略带诗意',
  极简: '短句、少修饰、信息密度高',
};
const DIRECTION_GUIDE = {
  正经好用: '给具体、可执行、能落地的建议或下一步，不写空话',
  无厘头: '轻松荒诞、脑洞大开、有画面感，但不贬低用户、不给危险建议',
};

const TAG_RULES = [
  ['馋了', /(吃|饭|餐|咖啡|奶茶|面|辣|甜|味道|外卖|厨|烘焙|水果|喝)/],
  ['走过的', /(走|路|街|地铁|公交|公园|旅|逛|店|散步|街角|车)/],
  ['想太多', /(想|如果|万一|焦虑|纠结|梦|担心|是不是|要不要)/],
  ['工作脑', /(需求|会议|上线|方案|产品|代码|评审|汇报|客户|项目|加班|bug)/i],
  ['小确幸', /(开心|舒服|喜欢|天气|阳光|猫|花|笑|礼物|周末|睡)/],
  ['新点子', /(点子|想法|试试|做一个|搞一个|灵感|idea)/i],
  ['没头绪', /(不知道|随便|发呆|说不清|啊|嗯)/],
];

export function suggestByRules(texts, existing = []) {
  const blob = (texts || []).join('\n').slice(0, 4000);
  const hit = TAG_RULES.filter(([tag, re]) => re.test(blob) && !existing.includes(tag)).map(([tag]) => tag);
  const spare = ['日常', '碎片', '值得记'].filter((t) => !existing.includes(t));
  return [...hit, ...spare].slice(0, 5);
}

function str(v, fallback = '') {
  return typeof v === 'string' ? v.trim() : fallback;
}

function lines(text) {
  return String(text || '')
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:\d+[.、)]|[-*•])\s*/, '').trim())
    .filter(Boolean);
}

function arr(v) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
  if (typeof v === 'string') return lines(v);
  return [];
}

function buildSpec(action, p) {
  const tone = str(p.tone, '温和');
  const direction = str(p.direction, '正经好用');
  const common = [
    '你是「臭脑子」App 的内容加工助手。「臭脑子」只是产品名，不代表你要嘲讽用户；不得贬低、攻击或羞辱用户本人。',
    '一律使用简体中文。',
    `语气要求：${TONE_GUIDE[tone] || `语气为「${tone}」`}。`,
    `本次推演方向：${direction} —— ${DIRECTION_GUIDE[direction] || `取向为「${direction}」`}。方向只决定这一次生成，不是用户的长期标签。`,
  ].join('\n');
  const text = str(p.text || p.note, '').slice(0, 1200);
  const image = typeof p.photoDataUrl === 'string' && p.photoDataUrl.startsWith('data:image/') ? p.photoDataUrl : null;

  if (action === 'extend') {
    return {
      system: `${common}\n任务：把这条随手记延展成 3~5 条彼此不同的想法或下一步。每条 20~60 字，不编号、不解释、不加开场白。\n只输出 json，格式示例：{"items":["第一条","第二条","第三条"]}。`,
      user: `随手记：${text || '（用户只留了一笔空白）'}`,
      image: null,
    };
  }
  if (action === 'caption') {
    return {
      system: `${common}\n任务：为这张照片写 2~3 条配文，像明信片背面的一句话，每条不超过 30 字，不编号、不解释。\n只输出 json，格式示例：{"items":["第一条","第二条"]}。`,
      user: `照片备注：${text || '（无备注，请看照片）'}`,
      image,
    };
  }
  if (action === 'poster') {
    return {
      system: `${common}\n任务：把这条记录写成「今日最臭」打卡海报文案。主标题 4~10 字，副文案 15~40 字，落款一句不超过 14 字；有记忆点、轻松，不嘲讽用户。\n只输出 json，格式示例：{"title":"主标题","body":"副文案","footer":"落款"}。`,
      user: `今日选中的记录：${text || '（一张照片，没有文字）'}`,
      image: null,
    };
  }
  const existing = Array.isArray(p.existing) ? p.existing.join('、') : '';
  const recent = Array.isArray(p.recent) ? p.recent.slice(0, 15).map((t, i) => `${i + 1}. ${String(t).slice(0, 80)}`).join('\n') : '';
  return {
    system: '你是「臭脑子」App 的标签助理。气味标签是描述一个人长期关注什么的画像标签，2~6 个汉字，名词或名词短语，例如「路过的店」「想太多」。根据近期记录推荐 3~5 个，避开已有标签，不解释、不编号。只输出 json，格式示例：{"tags":["标签一","标签二"]}。',
    user: `已有标签：${existing || '（无）'}\n近期记录：\n${recent || '（暂无记录）'}`,
    image: null,
  };
}

/** 无 Key 或 AI 不可用时的演示兜底，保证主路径永远能验收。 */
function demoData(action, p) {
  const raw = str(p.text || p.note, '');
  const subject = raw ? (raw.length > 16 ? `${raw.slice(0, 16)}…` : raw) : '这一笔';
  const direction = str(p.direction, '正经好用');
  const tone = str(p.tone, '温和');
  if (action === 'extend') {
    const serious = [
      `把「${subject}」拆成三步：先写下动机，再找一个 10 分钟能试的动作，最后约个时间回看。`,
      `给「${subject}」配个最小版本：今天只做最不费力的那一小步，别一次做完。`,
      `找个人把「${subject}」讲一遍，讲不清楚的地方就是接下来要补的信息。`,
      `为「${subject}」写一条反例：如果一周后完全没动，最可能卡在哪一步。`,
      `把「${subject}」打上气味标签，月底和同类记录放在一起回看。`,
    ];
    const silly = [
      `如果「${subject}」有气味，大概是雨后操场混着烤红薯的那一缕。`,
      `给「${subject}」配一只会点头的橡皮鸭当顾问，会议效率立刻翻倍。`,
      `把「${subject}」收进一本不存在的百科全书，配图是一朵戴帽子的云。`,
      `「${subject}」申请成立独立部门，目前成员只有你和一盏加班的台灯。`,
    ];
    return { items: direction === '无厘头' ? silly : serious };
  }
  if (action === 'caption') {
    return {
      items: [
        `${subject}｜今天也值得留一张。`,
        tone === '文艺' ? '光落在这一秒，正好被我碰见。' : '随手一拍，居然有点好看。',
        direction === '无厘头' ? '此照片已获得本人点头认可。' : '记下来，免得明天就忘。',
      ],
    };
  }
  if (action === 'poster') {
    return {
      title: direction === '无厘头' ? '今日脑内放晴' : '今天记了一笔',
      body: `${subject}｜${tone}地说，想法先存下来，慢慢发酵就好。`,
      footer: '臭脑子 · 今日最臭打卡',
    };
  }
  return { tags: suggestByRules(Array.isArray(p.recent) ? p.recent : [], Array.isArray(p.existing) ? p.existing : []) };
}

async function requestDeepSeek({ apiKey, model, spec, variant }) {
  const userContent = spec.image && variant === 0
    ? [
      { type: 'text', text: spec.user },
      { type: 'image_url', image_url: { url: spec.image } },
    ]
    : spec.user;
  const body = {
    model,
    messages: [
      { role: 'system', content: spec.system },
      { role: 'user', content: userContent },
    ],
    stream: false,
    temperature: 0.9,
    max_tokens: 900,
  };
  // 第一次尝试：JSON Output + 关闭思考（更快、更省）；失败后退回纯文本再解析。
  if (variant === 0) {
    body.response_format = { type: 'json_object' };
    body.thinking = { type: 'disabled' };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let resp;
  try {
    resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const detail = (await resp.text().catch(() => '')).slice(0, 240);
    throw new Error(`DeepSeek ${resp.status} ${detail}`);
  }
  const json = await resp.json();
  return str(json?.choices?.[0]?.message?.content, '');
}

function parseLoose(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  try { return JSON.parse(t); } catch { /* 继续宽松解析 */ }
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s >= 0 && e > s) {
    try { return JSON.parse(t.slice(s, e + 1)); } catch { /* noop */ }
  }
  const a = t.indexOf('[');
  const b = t.lastIndexOf(']');
  if (a >= 0 && b > a) {
    try { return { items: JSON.parse(t.slice(a, b + 1)) }; } catch { /* noop */ }
  }
  const ls = lines(t).map((x) => x.replace(/^["'「]+|["'」，,。]+$/g, '')).filter(Boolean);
  return ls.length ? { items: ls } : null;
}

function normalize(action, parsed, p) {
  const o = parsed && typeof parsed === 'object' ? parsed : {};
  if (action === 'poster') {
    const d = demoData('poster', p);
    return {
      title: str(o.title) || str(o.主标题) || d.title,
      body: str(o.body) || str(o.subtitle) || str(o.副文案) || d.body,
      footer: str(o.footer) || str(o.落款) || d.footer,
    };
  }
  if (action === 'suggestTags') {
    const tags = arr(o.tags || o.items || o.labels).slice(0, 6);
    return { tags: tags.length ? tags : demoData('suggestTags', p).tags };
  }
  let items = arr(o.items || o.list || o.results || o.文案)
    .map((x) => x.replace(/^["「]+|["」]+$/g, ''))
    .filter(Boolean);
  items = items.slice(0, action === 'extend' ? 5 : 3);
  if (action === 'extend' && items.length < 3) {
    items = items.concat(demoData(action, p).items.filter((x) => !items.includes(x))).slice(0, 5);
  }
  if (!items.length) items = demoData(action, p).items;
  return { items };
}

/**
 * @param {{action: string, payload: object}} input
 * @param {{apiKey?: string, model?: string}} env
 * @returns {Promise<{ok: boolean, source: string, model: string, data: object, degraded?: boolean, reason?: string, error?: string}>}
 */
export async function runAI(input, env = {}) {
  const action = str(input?.action, '');
  const p = input && typeof input.payload === 'object' && input.payload ? input.payload : {};
  if (!VALID_ACTIONS.has(action)) return { ok: false, error: '未知的加工类型' };

  const apiKey = str(env.apiKey, '');
  const model = str(env.model, '') || DEFAULT_MODEL;
  const demo = (reason) => ({
    ok: true,
    source: 'demo',
    model,
    data: demoData(action, p),
    degraded: true,
    reason,
  });

  if (!apiKey) return demo('未配置 DEEPSEEK_API_KEY，使用演示文案');

  const spec = buildSpec(action, p);
  let content = '';
  let lastErr = '';
  for (const variant of [0, 1]) {
    try {
      content = await requestDeepSeek({ apiKey, model, spec, variant });
      if (content) break;
      lastErr = '模型返回空白内容';
    } catch (err) {
      lastErr = err?.message || String(err);
    }
  }
  if (!content) return demo(lastErr || '模型返回空白内容');

  const parsed = parseLoose(content);
  return {
    ok: true,
    source: 'deepseek',
    model,
    data: normalize(action, parsed, p),
    ...(parsed ? {} : { degraded: true, reason: '模型输出非结构化，已按行解析' }),
  };
}

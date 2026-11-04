# 臭脑子 · 2 天 H5 Demo

随手记（文字为主，照片可上传）→ 选语气 + 本次推演方向 → AI 加工 → 贴气味标签 → 日历回看；另有「今日最臭」打卡海报。

> 「臭脑子」只是产品壳，**不表示系统默认嘲讽用户**。默认语气是「温和」，用户随时可改。

## 范围（已拍板，不再扩展）

| 做 | 不做 |
| --- | --- |
| 点子延展 3~5 条、照片配文 + 图文合成下载 | 餐厅推荐 / POI（2 天不实现、不露入口） |
| 提醒（设时间 + 到期高亮 + 浏览器通知） | 语音 ASR（后置；文字路径完整可用） |
| 日历按日聚合 + 气味标签筛选 | 登录中台、社区、账号体系 |
| 「今日最臭」选记录 → 海报文案 → Canvas 保存 | 完整版年报（仅保留 V1.0 占位） |
| 气味标签 CRUD + 自动建议、导出 JSON | 接入 mem0 记忆层、跨端同步 |

载体：H5（Vite + React），部署目标 Vercel。不做原生 App、不做微信小程序。

## 技术栈与结构

```
├── api/ai.js              # Vercel Serverless：唯一读取 DEEPSEEK_API_KEY 的地方
├── server/ai-core.js      # 四类加工提示词 / DeepSeek 调用 / 演示兜底（仅 Node 侧）
├── server/preview.mjs     # 单端口 Node 服务：静态 dist + 同一个 /api/ai（用于本地/预览部署）
├── vite.config.js         # 本地 dev/preview 的 /api/ai 中间件（Key 只在 Node 侧）
├── vercel.json            # Vercel 构建配置（framework: vite）
├── src/
│   ├── lib/               # store / IndexedDB / 设置 / 时区 / Canvas / AI 客户端
│   ├── components/        # TabBar、Chip、空状态、确认框、今日最臭面板
│   └── pages/             # 记一下 / 加工台 / 日历 / 我的
└── .env.example
```

- 模型：`deepseek-flash`（Base `https://api.deepseek.com`），使用 JSON Output 并关闭思考模式；解析失败会自动重试一次纯文本模式，再失败则降级为演示文案。
- 存储：记录（含压缩后的照片 dataURL）优先 IndexedDB，回退 localStorage；设置与标签在 localStorage。导出 JSON 包含两者。
- 时区：全链路 `Asia/Shanghai`，`datetime-local` 按 +08:00 墙钟时间解释。
- **生产环境 Key 不在前端**：前端只 `fetch('/api/ai')`；环境变量没有 `VITE_` 前缀，`.env.local` 已被 `.gitignore` 排除。

## 本地启动

```bash
npm install
cp .env.example .env.local     # 可选：不填 Key 也能跑完整流程（演示模式）
npm run dev                    # http://localhost:5173
```

`.env.local` 中填写：

```dotenv
DEEPSEEK_API_KEY=sk-你的key
# DEEPSEEK_MODEL=deepseek-flash   # 可选，默认就是 deepseek-flash
```

本地 `/api/ai` 由 Vite 的 Node 中间件提供；生产由 Vercel Function 提供，两边复用 `server/ai-core.js`。

生产构建本地预览（含 API）：

```bash
npm run build
npm start                      # http://localhost:3000，监听 0.0.0.0:$PORT
```

## 部署到 Vercel

1. 把本仓库推到 GitHub（仓库：`https://github.com/393535466-dev/Scabby-Head-1105.git`），在 Vercel 选择 **Add New → Project → Import Git Repository**。
2. Framework Preset 选 **Vite**（`vercel.json` 已声明），Build Command `npm run build`，Output Directory `dist`，其余默认。
3. **Project Settings → Environment Variables** 新增：
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek Key（Production / Preview 按需勾选）
   - `DEEPSEEK_MODEL` = `deepseek-flash`（可选，不填即用默认值）
4. Deploy。部署完成后 Vercel 给出的 `https://<project>.vercel.app` 即为线上地址。
5. 想用 CLI：`npm i -g vercel && vercel --prod`，Key 同样通过 `vercel env add DEEPSEEK_API_KEY` 写入。

> Key 只在 `api/ai.js` 里通过 `process.env` 读取，不会进入 `dist/`。可用 `grep -R "DEEPSEEK_API_KEY" dist/` 自查（应无结果）。

## 验收路径（逐条对照）

| # | 验收标准 | 操作路径 |
| --- | --- | --- |
| 1 | 文字录入 → 选语气 + 方向 → 延展 3~5 条并保存 | 记一下：写一句 → 选语气/方向 → 「存下并去加工」→ 加工台「延展点子」→ 结果自动写入「已保存的加工」 |
| 2 | 上传照片 → 选语气 → 配文；可选图文合成下载 | 记一下：加张照片并保存 → 加工台「生成配文」→ 「设为配文」→「合成明信片」→「下载明信片 PNG」 |
| 3 | 提醒：设时间 + 到期列表高亮（通知能开则开） | 记一下：设提醒（或用「1 小时后」快捷）→ 到期后「到期提醒」区高亮 → 我的 →「开启浏览器通知」 |
| 4 | 日历按日聚合 + 按气味标签筛选 | 日历：月历圆点/条数 → 选某天看列表 → 上方标签 chip 筛选 |
| 5 | 今日最臭：选当日一条（用户确认）→ 海报文案 → Canvas 保存；语气跟用户方向 | 加工台底部「今日最臭」→ 选中记录 → 确认弹窗 → 生成文案 →「保存海报 PNG」（文案用当前语气/方向） |
| 6 | 气味标签自定义 + 自动建议 | 我的 → 气味标签：增删改名 /「根据历史记录自动建议」；加工台 → 标签 chip 打在记录上 |
| 7 | 无记录时空状态、不报错 | 清空数据后依次打开四个 Tab，均显示空状态 |
| 8 | 生产 Key 不在前端 | `npm run build && grep -R "DEEPSEEK_API_KEY" dist/` 无结果；前端 bundle 只出现 `/api/ai` |

无 DeepSeek Key 时，`/api/ai` 返回 `source: 'demo'` 的演示文案，页面顶部出现「演示模式」标记，**以上 1~7 条仍可完整走通**；配置 Key 后自动切换为真实模型输出。

## 数据模型（节选）

```json
{
  "id": "r_xxx",
  "kind": "text | photo",
  "text": "原始随手记",
  "photoDataUrl": "data:image/jpeg;base64,...",
  "createdAt": "ISO",
  "dateKey": "YYYY-MM-DD (Asia/Shanghai)",
  "tone": "温和",
  "direction": "正经好用 | 无厘头",
  "outputs": [{ "id": "o_xxx", "text": "…", "kind": "extend | caption", "tone": "…", "direction": "…" }],
  "caption": "当前选中的配文",
  "tags": ["馋了"],
  "remindAt": "ISO | ''",
  "notified": false,
  "remindDone": false,
  "poster": { "title": "…", "body": "…", "footer": "…" }
}
```

设置：`{ defaultTone, defaultDirection, tags[], dailyPoster: { "YYYY-MM-DD": {...} } }`。

**气味标签与推演方向严格分离**：方向是「这一次生成往哪推」，标签是「长期个人画像」；方向存在每次加工请求和记录上，标签存在设置库和记录的 `tags` 上，日历只按标签筛。

## 开源参考与许可

只借鉴交互与数据模型思路，**未 fork、未复制任何仓库代码**（尤其注意列表中的 GPL / AGPL 项目不引入本仓）。参考方向：memex（文/图→时间线的流程）、freenote（本地优先 AI 日记的 H5 形态）、journiv（日历与隐私默认）、reflect-open（本地优先结构）、InkTime（日更海报/年报灵感）、FlareMo（Web 部署与记录形态）、mem0（记忆层思路，本次不接入）。本仓代码全部手写，依赖仅 React / Vite。

## 已知限制 / V1.0 待办

- 浏览器通知需要页面保持打开；无 Service Worker 后台推送。
- 照片按 1200px JPEG 压缩后存在本地，导出 JSON 体积会随照片增长。
- 年报仅占位；语音 ASR、地图 POI、餐厅推荐、登录与社区、mem0 均不在 2 天范围。

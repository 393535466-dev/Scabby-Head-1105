# 臭脑子 · H5 Demo V0.11

随手记 → 用户选择语气和方向加工 → 选中一个版本 → 生成风格图片或留待再思 → 按时间和分类回看。

### V0.11 记录首页与头像动效

- 保留品牌首屏及个人资料创建流程，进入记录首页后依次出现头像、三个操作泡泡、欢迎语及本地句库文案。点击「喂点新鲜事」「快来记录一下」打开记录面板，「换个说法」「换一句试试」轮换欢迎文案。
- 头像按确认稿缩小 25%，右侧泡泡避开耳朵，尖角朝左上指向头像；叹号、问号从头像右上方依次向外弹出，想法云逐个显示连接圆点与云朵。
- 九个默认头像使用各自校准的眼白、瞳孔与高光图层，自动移动视线，也可跟随鼠标。自定义头像保留原图，不套用默认头像的眼睛坐标。
- 底部加号线宽加倍，入场时用 2.4 秒由快到慢旋转停正；连续 10 秒无点击或按键后再播放一次。每段闲置只提示一次，操作后重新计时。记录弹窗打开、页面隐藏或开启系统减少动态效果时暂停。
- 正式首页与本地 `/record-home-preview.html` 共用 `src/components/record-home/`；九头像校准页仅保留在本地预览，不加入生产构建。

### V0.10 记录 / 提醒、古风与手机阅读

- 「记一笔」切换记录或提醒。记录保留文字、照片、语音和语气加工；提醒填写内容及具体年月日、时间，不会触发 AI 加工。时间统一按北京时间解释，拒绝过去时间，提供 1 小时后和明天 9 点快捷项。
- 提醒进入预定日期的周 / 月日历，以橙色圆点区分；详情可修改时间、完成、恢复或取消。取消只移除提醒安排，保留原文。旧记录附带的提醒兼容保留；同一天不重复计数。
- 页面打开时按最近到期时间检查，显示应用内提示；浏览器已授权时使用 Service Worker 显示系统通知。**没有服务端定时推送，不能保证关闭网页后的通知**。提醒详情支持导出带闹铃的 `.ics` 文件，用户需在手机日历确认导入；修改或取消不会自动同步到外部日历。
- 「极简」改成「古风」，文字使用古典诗意表达，图片使用水墨淡彩意境。旧偏好切换到古风，已经保存的极简文案及标签不重写。
- 记录正文从 15px 调到 16px、加工结果从 12px 调到 14px、时间与辅助文字从 10px 调到 12px；表单保持至少 16px，不整体放大品牌和分类方块。

验收：切换提醒 → 填写未来时间 → 保存 → 日历对应日期 → 修改时间 / 完成 / 恢复 / 取消；记录模式选择古风并加工。`npm test` 覆盖时区、跨年、日历聚合、日期校验、日历导出、通知通道和文字 / 图片风格。

### V0.9 照片生成专属 Q 版头像

- 首次创建资料和「头像与昵称」中，选择「上传照片，生成 Q 版头像」，预览原照片后主动点击生成。
- 复用已配置的百炼密钥，头像使用 `qwen-image-2.0-pro`（可通过 `DASHSCOPE_AVATAR_MODEL` 覆盖），`POST /api/image` 接收 `{ purpose: 'avatar', photoDataUrl }`。服务端固定附上现有九宫格作为美术参考，保留照片人物特征，生成同系列的单个 3D 大头头像；客户端不能替换风格参考。
- 生成图移除纯色背景、居中缩小到 512px，保留透明背景；用户可换照片、换一版，满意后「用这个头像」，保存资料才同步到欢迎页、页头和设置页。失败不覆盖上一版，关闭弹层放弃当前等待。
- 原照片只用于本次请求，不写入资料或记录；本机资料只保存选用的头像。模板头像和旧资料保持兼容。生成需要网络和有效的生图密钥；取消等待不能撤销已提交给模型的请求。

验收路径：上传单人照 → 点击生成 → 比较照片与 Q 版 → 用这个头像 → 保存资料 → 刷新核对。`npm test` 覆盖请求校验、固定风格参考、透明底处理和资料往返。

### V0.8 风格生图与手机体验

- 欢迎按钮使用手绘弯箭头；创建资料的头像预览和模板去掉圆形底色。
- 灵感库中英文字号放大 30%；手机表单字号至少 16px，限制页面缩放，并处理 Safari 的页面缩放手势。
- 「生成图片」替代明信片合成，默认继承选中文案的语气，可选温和、文艺、搞笑、腹黑、犀利、极简。可编辑画面内容、补充要求，或选择参考原照片。
- 生图使用阿里云百炼 `qwen-image-2.0`，调用实际图像生成/编辑接口。结果立即转为图片数据，随记录存入 IndexedDB，避免服务方的临时图片 URL 失效；支持重试、下载、收进图片库。
- 未配置生图服务时明确显示暂不可用，不以模板、照片套字或演示文案伪装生图。历史封面数据保留。

#### 开通图片生成

1. 在[阿里云百炼北京地域 API Key 页](https://bailian.console.aliyun.com/cn-beijing/model/settings/api-key)创建密钥。创建账号和服务开通由账号所有者完成，可参照[官方说明](https://help.aliyun.com/zh/model-studio/get-api-key)。
2. Vercel 项目 → Settings → Environment Variables：增加 `DASHSCOPE_API_KEY`，选择 Production，保存后重新部署。不要将密钥提交到 GitHub 或加上 `VITE_` 前缀。
3. 本地调试时将同一变量填入 `.env.local`，重启 `npm run dev`。其他地域可设置 `DASHSCOPE_BASE_URL`，需与密钥地域匹配；模型可用 `DASHSCOPE_IMAGE_MODEL` 覆盖。
4. `GET /api/image` 返回 `configured` 状态；记录详情 → 选一版 → 生成图片 → 选择风格 → 生成 → 收进图片库。一次生成一张，失败不覆盖先前图片。

服务实现依据[千问文生图文档](https://help.aliyun.com/zh/model-studio/qwen-image-api)和[图像编辑文档](https://help.aliyun.com/zh/model-studio/qwen-image-edit-api)。运行 `npm test` 检查风格映射、照片请求、图片下载持久化和失败路径；真实出图需配置有效密钥后另行验证。

### V0.7.1 底栏与记录详情修正

- 底部导航增加不透明底衬，覆盖悬浮底栏边缘、中央凹槽和底部安全区，避免滚动内容从底栏下方露出。
- 记录详情移除「后来又想到」栏目及补记输入；既有记录数据继续保留，「留到下次接着想」和标签功能照常使用。

### V0.7 品牌、手写字体与底部导航

- 品牌首屏使用整面珊瑚主题色，深色脑形与中英文字标均来自用户提供的原图；应用页头保留「臭脑」黑色、「子」主题色。
- Tab、昵称、心情与灵感库标题使用同源托管的「小赖字体 / Xiaolai SC」，字体按 Unicode 分片加载，OFL 许可随源码保留于 `public/fonts/OFL.txt`。字体依赖固定为 `@chinese-fonts/xiaolai@3.0.0`，`npm run dev` / `npm run build` 会先自动准备字体资源，生成的分片不重复提交到 Git。
- 用户指定的「小熊布丁的假期」原文件尚未取得，当前不会把小赖字体标为该字体；已预留本机字体优先匹配入口。
- 个人欢迎和页头直接展示头像；底部为圆角导航与平滑中央凹槽，记录按钮嵌入其中。
- 灵感库使用白色标题、独立图形与白色圆形数量标识；短屏下调整方块高度，避免底栏遮挡图标。

### V0.4 个人欢迎与固定页面框架

- 品牌开场 → 首次选择头像和昵称 → 个人欢迎页。日常进入后，四个顶部筛选默认均不选中，点击后才显示记录。
- 用户提供的九宫格头像作为九套模板展示，也可上传图片；头像和昵称保存在本机，并同步到欢迎页、页头和个人设置。
- 欢迎页展示日期对应的趣味心情签，可手动换一句；使用本地文案，不分析用户的真实情绪，不调用通知推送。
- 页头与双语筛选栏固定，中间记录、日历、灵感库、设置各自滚动。
- 灵感库改为「脑洞 / IDEAS」「换语 / REPHRASE」「图片 / IMAGES」「再思 / RETHINK」，白色图标位于右下。图片分组同时包含照片与文字封面，数量来自实际记录。

### V0.3 前端调整

- 新增品牌欢迎页；页头只保留 Logo、日期、搜索、提醒和个人设置。
- 记录入口为「全部 / 文字 / 图片 / 日历」，底部中央记录按钮嵌入凹槽；记录与日历下方使用紧凑时间线。
- 日历支持月 / 周切换、选择月份、前后翻页、回到今天；记住用户选择的视图，默认周视图。
- 灵感库按脑洞点子、换个说法、我的封面、接着想组织；计数和筛选由已有记录产生，同一记录可同时出现在多个相关分组。
- 记录时直接选择温和、文艺、搞笑、腹黑、犀利、极简，以及正经好用 / 无厘头；可仅保存，或保存原文后开始改写 / 延展 / 照片配文。
- 语音入口接浏览器 Web Speech API，将最终识别结果写进可编辑文本。识别失败、无麦克风和不支持时有明确提示；关闭输入会停止录音。语音识别服务和可用性取决于浏览器，不支持时可使用系统键盘的听写功能。[接口说明](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)。
- 标签改为具体内容主题，旧记录标签兼容迁移；筛选器仅展示记录实际使用的标签。

本次检查不录制用户环境音，真实麦克风识别需用户在浏览器授权后体验。

V0.2 借鉴 Memex 的记录流、统一输入和卡片详情交互，沿用本项目 React / Vite / Node 技术栈独立实现。未引入 Memex 的 Flutter 源码、图标或品牌素材。

- 底部「记录 / 灵感库」，中央按钮统一记录文字和照片。
- 每条记录保留原文、加工版本、选中版本、问题、后续补记；补记会参与下一次 AI 加工。
- 封面可修改文案，选择是否带照片和原文，生成 PNG，并选作当天封面。
- 灵感库按项目、领域、资源、归档分类；保留搜索、日历、气味标签和提醒。
- 兼容旧记录，新字段包括 `collection`、`selectedOutputId`、`pending`、`continuationQuestion`、`notes` 和 `cover`。首次进入为空，示例由用户主动加载并标明。

发布方式：向 GitHub `main` 推送后，由已连接的 Vercel 项目构建并发布到以下正式地址。

> 「臭脑子」只是产品壳，**不表示系统默认嘲讽用户**。默认语气是「温和」，用户随时可改。

## 线上地址

| 环境 | 地址 | 说明 |
| --- | --- | --- |
| 正式（Vercel） | https://scabbyhead1105vercal.vercel.app | 从 GitHub 仓库导入部署；需在 Vercel 配置 `DEEPSEEK_API_KEY` 才会走真实模型 |
| 开发预览（单端口 Node） | https://chounaozi-notes.app.workbuddy.host/?sharecode=QFG2KJ22VF | 工作区发布的预览，**不是 Vercel**；未注入 Key，页面显示「演示模式」 |

> ✅ 已在 Vercel 面板核实：域名就是 `scabbyhead1105vercal.vercel.app`，且项目**已连接 GitHub 仓库**——向 `main` 推送提交会自动触发生产部署。部署状态和来源提交以 Vercel 面板为准。
> 注意：**连接 Git 只同步代码，不会同步环境变量**。`.env.local` 被 `.gitignore` 排除、本来就不在仓库里，DeepSeek Key 必须在 Vercel「环境变量」中单独配置，配置后还需 Redeploy。

预览环境未注入 Key 时由服务端返回兜底文案，录入、延展、配文、明信片、提醒、日历筛选、今日最臭海报、标签 CRUD 仍可完整点通。本机 `.env.local` 已填入 Key，`npm run dev` / `npm start` 会直接调用真实 `deepseek-flash`（`source: "deepseek"`）。

### 如何确认正式站已用上真实模型

1. 浏览器打开正式地址，页面顶部**不应**出现「演示模式」标记。
2. 或直接请求接口，看返回的 `source` 字段：
   ```bash
   curl -sS -X POST https://scabbyhead1105vercal.vercel.app/api/ai \
     -H 'Content-Type: application/json' \
     -d '{"action":"extend","payload":{"text":"线上自检","tone":"温和","direction":"正经好用"}}'
   ```
   `source: "deepseek"` = 已用真实模型；`source: "demo"` = 未配置 Key 或改完环境变量没重新部署。
3. 若返回 `demo`：Vercel → **Project Settings → Environment Variables** 添加 `DEEPSEEK_API_KEY`（勾选 Production / Preview）→ **Deployments → Redeploy**。环境变量变更不会自动作用于已有部署。
4. 前端产物自查：下载页面引用的 `assets/*.js`，`grep` 不应出现 `DEEPSEEK_API_KEY` 或 `api.deepseek.com`。

## 初版范围（V0.1，供回查）

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
│   ├── components/        # 统一输入、记录卡片、弹层、封面编辑、确认框
│   └── pages/             # 记录流 / 记录详情 / 灵感库 / 日历 / 设置
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

`npm start` 会通过 `prestart` 自动先执行 `npm run build`，适合「一个 HTTP 端口」的托管环境；只想启动已构建产物时用 `npm run serve`。

## 部署到 Vercel

1. 把本仓库推到 GitHub（仓库：`https://github.com/393535466-dev/Scabby-Head-1105.git`），再在 Vercel 选择 **Add New → Project → Import Git Repository**。本地仓库已 `git init`、已提交、配置好 `origin`，并已推送到该仓库（首次推送需要认证，方式见下）：
   ```bash
   git push -u origin main
   ```
   GitHub 已不支持账号密码推送（直接推会报 `Invalid username or token`）。任选一种认证方式：

   **方式 A · GitHub CLI（推荐）**
   ```bash
   brew install gh
   gh auth login          # GitHub.com → HTTPS → Login with a web browser，按提示在浏览器完成授权
   git push -u origin main
   ```

   **方式 B · Personal Access Token + macOS 钥匙串（不装任何工具）**
   1. GitHub → 右上角头像 → **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**
   2. Note 随意、Expiration 选 90 天、勾选 **`repo`** → Generate token → **立刻复制**（只显示一次）
   3. 本机执行：
      ```bash
      git config --global credential.helper osxkeychain
      git push -u origin main
      ```
      Username 填 `393535466-dev`，Password **粘贴 PAT**（不是账号密码）。凭据存进钥匙串，之后推送免输。

   **方式 C · 一次性带 Token 的 URL（临时机器）**
   ```bash
   git remote set-url origin https://393535466-dev:<PAT>@github.com/393535466-dev/Scabby-Head-1105.git
   git push -u origin main
   git remote set-url origin https://github.com/393535466-dev/Scabby-Head-1105.git   # 推完立刻改回，避免明文留存
   ```
   > 若建仓时勾选了初始化 README，推送会报非快进：先 `git pull --rebase origin main` 再推。
   > PAT 只用于认证，**不要写进任何会被提交的文件**；`.env.local` 同样不要进仓库。
2. Framework Preset 选 **Vite**（`vercel.json` 已声明），Build Command `npm run build`，Output Directory `dist`，其余默认。
3. **Project Settings → Environment Variables** 新增：
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek Key（Production / Preview 按需勾选）
   - `DEEPSEEK_MODEL` = `deepseek-flash`（可选，不填即用默认值）
4. Deploy。部署完成后 Vercel 给出的 `https://<project>.vercel.app` 即为线上地址（本项目当前地址见「线上地址」章节）。改完环境变量记得 **Redeploy**。
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
  "entryType": "record | reminder",
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

- 浏览器通知需要页面保持打开；Service Worker 只负责展示通知，没有服务端定时推送。关闭网页后的提醒可通过导出到手机日历实现，需手动确认导入。
- 照片按 1200px JPEG 压缩后存在本地，导出 JSON 体积会随照片增长。
- 年报仅占位；语音 ASR、地图 POI、餐厅推荐、登录与社区、mem0 均不在 2 天范围。

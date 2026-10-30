# 科研工作台（模板）

一个给研究生用的私人工作台：AI 对话（可联网、查文献）、研究项目与决策记录、科研/生活记录、论文投稿追踪、「今天」总览（毕业进度、项目地层、截止提醒、周回顾）、AI 资讯，以及给 Codex / Claude 用的 MCP 接口。

这是一份**不含任何数据和密钥**的模板。你需要用自己的账号和密钥部署，你的数据只存在你自己的数据库里。

## 最快的开始方式：让 AI 帮你搭

在这个文件夹里打开 Codex 或 Claude Code，对它说：

> 请按照 SETUP_WITH_AI.md 帮我搭建这个工作台。

它会一步步问你需要的信息、替你改配置、本地预览，需要你登录账号或填密钥时会停下来告诉你怎么做。

## 先看看效果（不需要任何密钥）

需要 Node.js 22。

```
npm ci --ignore-scripts
npm run demo
```

打开命令行里打印的地址，就能用一套虚构数据看到完整界面（对话需要模型密钥，其他都能用）。演示数据在 `.data-demo/`，删掉即可重置。

## 改成你自己的

- `public/config.js`：工作台名字、助手名字、时区、入学与毕业日期、论文目标。不填日期，毕业卡片自动隐藏。
- `agent/instructions.txt`：对话助手的行为规则；`agent/skills.json`：科研、写作、审稿方法，可以改成你自己领域的写法。
- 密钥与数据库：复制 `env.example` 为 `.env`（本地）或填到 Vercel 环境变量（线上）。

## 本地正式使用

```
npm ci --ignore-scripts
npm start
```

不配置云端时，数据保存在本机 `.data/`（已被 git 忽略）；访问密钥在 `.data/access-token`。Windows 可双击 `启动工作台.cmd`。

## 部署到网上（可选）

Vercel（网站）+ Supabase（数据库与私密文件）。详细步骤见 `SETUP_WITH_AI.md` 的「部署」部分。推送到 main 会自动部署，构建时会先跑 `npm test`。

## MCP（给本地 AI 读写你的科研数据）

分层读取：`get_overview`（一屏总览）→ `get_project`（单个项目，或 `all`）→ `search_records` / `get_record`，接续工作用 `get_changes`。写入工具（更新项目进度、论文状态等）建议在客户端设为每次确认。只开放科研数据，生活记录和照片不进入 MCP。

## 代码位置

- `public/`：页面、交互、样式（`config.js` 是你的个人设置）
- `api/`、`lib/`：后端、模型、MCP、数据管理
- `agent/`：助手说明与技能
- `test/`：使用虚构数据的测试
- `schema.sql`：首次初始化 Supabase 用，已有数据库不要重复执行

## 使用须知

- 仅供受邀同学个人使用，请勿公开或转发本仓库。
- AI 资讯来自 AIHOT，个人非商业使用免费；联网搜索（Tavily）和模型调用按各自服务计费。

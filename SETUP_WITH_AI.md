# 用 AI 搭建你的科研工作台（给 Codex / Claude 的执行指南）

> 给 AI：请按顺序执行。每一步先用一两句话告诉用户你要做什么。需要用户提供信息时一次只问一组；需要登录账号、付费或填写密钥时停下来，说明在哪里操作，让用户自己完成。Git 写操作和部署前先征得同意。不要让用户把密钥贴进聊天，引导他们填进 `.env` 或 Vercel。

## 0. 检查环境
- 确认 Node.js 版本是 22（`node --version`）。不是的话，告诉用户去 https://nodejs.org 安装 22 LTS。
- 运行 `npm ci --ignore-scripts`，再运行 `npm test`，确认全部通过。

## 1. 先看演示
- 运行 `npm run demo`，把打印出来的地址给用户，请他打开看看界面（虚构数据）。
- 问用户整体是否满意，记下想改的地方，第 4 步再处理。演示完停掉这个进程。

## 2. 个性化设置（`public/config.js`）
依次问用户，然后替他改：
1. 工作台叫什么名字（`appName`），对话助手叫什么（`assistantName`）。
2. 所在时区（`timezone`，例如 `Asia/Shanghai`、`Europe/London`）。
3. 是否需要「毕业进度」卡片：入学日期、预计毕业日期（YYYY-MM-DD）、发表论文目标篇数，以及毕业日下方想显示的一句话（可留空）。不需要就保持 `start`、`end` 为空。

## 3. 让助手懂你的研究
- 问用户：研究领域、常用方法、写作语言习惯、希望助手怎么说话。
- 据此改写 `agent/skills.json` 里 research、writing 的 `text`（保持 JSON 合法、保留原有的严谨规则），必要时在 `agent/instructions.txt` 开头补一句领域说明。不要写入任何密钥或私人数据。

## 4. 界面调整（可选）
- 根据第 1 步记下的意见修改 `public/`。每次改完用 `npm run demo` 预览给用户看，再跑 `npm test`。
- 想清空演示数据重新看，删除 `.data-demo/` 目录。

## 5. 选择使用方式
问用户只在自己电脑上用，还是要能在手机、其他电脑上访问：
- **只在本机用**：跳到第 7 步本地使用。
- **要在网上用**：继续第 6 步部署。

## 6. 部署（Vercel + Supabase）
1. **代码仓库**：用户在 GitHub 新建一个**私有**仓库。经同意后 `git init`、提交、推送（提交前确认 `.env`、`.data`、`.data-demo` 没有被加入）。
2. **Supabase**（https://supabase.com，免费版即可）：
   - 用户新建一个项目，在 SQL Editor 里粘贴并运行 `schema.sql`，确认返回 `initialized=true`、`rls_enabled=true`。
   - 在 Storage 新建两个**私有**存储桶：`workbench-private-photos`、`workbench-private-papers`。
   - 在 Project Settings → API 找到 Project URL 和 secret key（service role），用户自己保管，下一步填到 Vercel。
3. **Vercel**（https://vercel.com）：
   - 用户用 GitHub 登录，Import 刚才的私有仓库，Framework 选 Other。
   - 在 Settings → Environment Variables 填（参考 `env.example`）：`WORKBENCH_ACCESS_TOKEN`（帮用户生成一串 48 位以上随机字符，让他自己复制填入并保存好，这就是网页登录密码）、`SUPABASE_URL`、`SUPABASE_SECRET_KEY`、至少一个模型密钥（`DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`），可选 `TAVILY_API_KEY`。
   - 部署，打开网址，用访问密钥登录，确认能新建一个测试项目、刷新后还在。
4. 以后推送 main 就会自动更新网站。

## 7. 本地使用（不部署时）
- 复制 `env.example` 为 `.env`，只填需要的模型密钥（不填数据库，数据保存在 `.data/`）。
- `npm start`（Windows 可双击 `启动工作台.cmd`），访问密钥在 `.data/access-token`。

## 8. 可选：让 Codex / Claude 读取工作台
- 用户在 Vercel 环境变量里加 `MCP_REMOTE_TOKEN`（一串随机字符）并重新部署。
- 在用户电脑上把这串字符存为环境变量（例如 `WORKBENCH_MCP_TOKEN`），不要写进任何文件。
- 给客户端配置 HTTP MCP：地址 `https://<他的网址>/mcp`，请求头 `Authorization: Bearer ${WORKBENCH_MCP_TOKEN}`。
- 读取工具 `get_overview`、`get_project`、`search_records`、`get_record`、`get_changes`、`get_papers` 可以直接允许；写入工具（`create_submission`、`update_submission_status`、`update_project_progress`、`propose_research_note`）设为每次确认。

## 9. 收尾
告诉用户：网址或本地启动方式、访问密钥保存在哪里、以后怎么改界面（让 AI 改 `public/`）、怎么改个人设置（`public/config.js`）。提醒他不要把密钥发给别人，也不要把仓库设为公开。

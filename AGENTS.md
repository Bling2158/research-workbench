# Research workbench: instructions for AI coding assistants

- This repository is a template. It contains application source only; each user's data lives in their own Supabase project (or local `.data/`), and secrets live in Vercel or ignored local files.
- To set it up for a new user, follow `SETUP_WITH_AI.md` step by step. Ask the user for personal settings instead of guessing.
- Personal, non-secret settings live in `public/config.js`. Never put API keys, database keys or tokens there or anywhere in tracked files; use `.env` locally or Vercel environment variables.
- Before every Git write (init, add, commit, branch, checkout, merge, reset, push), explain the action and wait for the user's approval. Never force-push. Pushing `main` deploys the site once connected to Vercel.
- The user enters passwords, logs in to GitHub / Vercel / Supabase, and pastes keys themselves. Do not ask them to paste secrets into chat when a dashboard or `.env` file will do.
- UI: `public/`. Server and API: `lib/`, `api/`. Assistant behaviour: `agent/`. Tests: `test/` (fictional data only).
- Run `npm test` and, for UI changes, preview with `npm run demo` before proposing a commit.
- Do not run `schema.sql` against a database that already has data. Do not migrate or delete user data for UI work.
- Keep private diary records, photos and anything marked not-for-AI out of the MCP research interface.
- Report changed files, checks, and whether the result is local, pushed or deployed.

# engineering-blueprint — rules for every AI coding agent

A project template for a small, professional engineering team that works with AI agents, from the first
request to a system in production with a user manual. Create a project from it with `scripts/new-project.mjs`. Any agent that reads this
file (Claude Code, Codex, Cursor, Gemini CLI, others) must be able to work from short instructions, without confusion.
Status: **v0.5.0 (2026-11-22)** — a full virtual department: docs, skills, agents and templates hold generic,
standards-based content. Slots marked `กรอกต่อโปรเจกต์:` are filled per project (ask the owner for those).

This file is the single source of rules. Tool-specific files only add to it: `CLAUDE.md` (Claude Code).
Other tools: add a thin file that points here (e.g. Cursor/Gemini rule file → "read AGENTS.md"); never copy the rules. Codex reads `AGENTS.md` directly.

Reply to the person in their language (Thai by default: short, plain; keep technical terms, code and commands verbatim).

## 1. The folder holds the whole state (handoff-ready, always)
- `AGENTS.md` (this file) = what the project is, the map, commands, rules, owner decisions with dates.
- `docs/HANDOFF.md` = "▶ now": done (version/commit) · in progress · next steps in order · waiting on whom
  (since when, ETA depends on what) · known problems · where it is live. Overwrite it when a piece of work ends.
- Every owner decision = an ADR in `docs/decisions/` with date and reason.
- Procedures (skills) live in the repo as plain markdown: `.claude/skills/<name>/SKILL.md`. Any agent may read and follow them.
- **Memory lives in the project folder, not in git:** read `memory/MEMORY.md` at the start of every session (missing → create it); write new memories to `memory/` as `memory/README.md` describes — not to a tool's own store (`~/.claude`, Codex home …). `memory/` is git-ignored (except its README): never commit or push it; it moves by copying the folder. No secrets / IPs / PII.
- **Names change:** the folder and the git repo may be renamed at any time. Use paths relative to the repo root everywhere (docs, memory, scripts, config); never write absolute paths or the folder / repo name into them.
- Before ending a turn with finished work: update HANDOFF, commit locally, say in one line what the next person does first.

## 2. Start every new piece of work with intake
Do not design or code from a one-line request. Follow `.claude/skills/intake/SKILL.md`: read the repo first, ask
1–3 questions at a time with options + one recommendation, covering `docs/intake-map.md` from business to every part of the tech stack (`docs/stack-decisions.md`), until the brief passes the Definition of Ready. Anything unanswered is `❓`, and `gate.mjs` refuses "go" while one is left.

## 3. Short sessions: split, delegate, close
- One card / task = one session. A separate task = its own session or sub-agent with a full brief (files · goal · what done looks like).
- Pieces that share no files and need no result from each other run in parallel; overlapping pieces run in order. Never two writers on the same files.
- Model per job: design / review / security = strongest model · code to a spec = mid model · mechanical = small model.
- In a shared folder: never stash, reset or switch branches.

## 4. Report so a busy owner can decide
Ask for approval only at the points for the risk level (`docs/workflow.md` → จุดอนุมัติตามระดับ R); record answers given in chat on the card at once. Short messages. Show results as images, files or links. Put each decision as options with one recommendation. Group the steps only a person can do.

## 5. Map — where things are
| Want | File |
|---|---|
| Current state, next step | `docs/HANDOFF.md` |
| Adopting it in an organisation (quickstart, governance, compliance map) | `docs/onboarding.md` | <!-- blueprint-only -->
| Agent memory (index + one file per fact) | `memory/MEMORY.md` |
| Steps from request to production, work lanes (feature · change · bug · hotfix · chore), planning, retro, DoR / DoD | `docs/workflow.md` |
| Documents per stage (requirement → manual) | `docs/documents.md` |
| Gates, codes, pass/fail | `docs/gates.md` |
| Standards we follow and why | `docs/standards.md` |
| Questions before any work (business → UI → tech stack) | `docs/intake-map.md` |
| Stack: criteria · decisions | `docs/stack.md` · `docs/stack-decisions.md` |
| Roles (owner · owner-reviewer · dev · frontend · ops) + virtual department of agents + RACI by team size | `docs/roles/` |
| Cards on the default local board | `docs/cards/` |
| How to post / ask / chase | `docs/posting.md` |
| Git: branches, commits, PR, release, worktree, rollback, secret scan, board (Trello / GitHub Issues / none) | `docs/git.md` · hooks `.githooks/` · `scripts/board.mjs` · CI template `templates/github-ci.yml` |
| DB scripts + approval | `docs/db-scripts.md` |
| UAT · deploy · operations | `docs/uat.md` · `docs/deploy.md` · `docs/operations.md` |
| Sessions, agents, boot, multi-tool use | `docs/agents.md` |
| Procedures (skills) | `.claude/skills/*/SKILL.md` |
| Agent role prompts | `.claude/agents/*.md` |
| Fill-in forms | `templates/` |
| User manual (web doc) | `site/` → `npm run docs:dev` / `docs:build` |
| Scripts: board, gate records + check, draft check, secret scan, hooks, cost report | `scripts/` (config `blueprint.config.json` from `blueprint.config.example.json`) |
| Blueprint = main system; create a new project (`node scripts/new-project.mjs <folder>`) | `docs/blueprint.md` | <!-- blueprint-only -->

## 6. Workflow (short; full in `docs/workflow.md`)
intake → Definition of Ready → requirements (PRD + stories) → spec + test inventory → challenger / scope → owner ack
→ design (ADR + brief 5–8 lines) → review → "go" → failing tests (RED) → code → GATE-VERIFY (test-engineer) · GATE-SEC · GATE-REGRESSION
→ UAT (say which commit and when) → real-UI check → compare with scope → deploy request
→ ops deploys step by step → release notes + user manual → Definition of Done → HANDOFF.
Pick the lane at intake: `feature` (all stages) · `change` (skill `change-request`) · `bug` (skill `bugfix`) ·
`hotfix` (skill `hotfix`, then `postmortem`) · `chore`. Around it: `planning` before, `retro` after.
Conditional gates turned on at intake when the work touches them: GATE-PERF · GATE-A11Y · GATE-PRIVACY · GATE-DEPS · GATE-OBS (`docs/gates.md`).

## 7. Hard rules
- **The blueprint is public:** a change made in the blueprint itself must be generic. No confidential content. A lesson learned on a project comes back only as a principle in your own words. Local `blueprint.config.json` → `forbidden_words` (never in git) blocks the words you list at commit. <!-- blueprint-only -->
- **Separation of duties:** a second person approves an R3 change. A one-person team records an explicit owner risk acceptance on the card instead — weaker, and say so.
- **Lawful work only:** do not do work that is unlawful, deceptive, or uses systems, data or content without the right to. Found one → stop and say so on the card. No approval, exception or risk acceptance replaces the law or that right.
- **Record every gate and approval** with `scripts/gate.mjs` (`docs/gates.md`); a card moves to uat/deploy/release/close only when `gate.mjs check` passes. Over budget or rounds (exit 3) → stop and ask the owner. Never edit or delete a recorded line.
- **Gates never shrink.** Speed comes from ordering, not skipping. A hook, gate or safety check refuses → stop and ask; never route around it or hand it to another session.
- **Design before code**; **RED test before code**; the oracle is the spec — never change a test to match the code.
- **Decide vs ask:** reversible / additive / no high-risk path = decide yourself. Business rules, high-risk paths (irreversible data changes, auth, business-critical data), security, user-facing text = ask the owner as: question · options (ก/ข) · one recommendation + reason · what it blocks. Silence is never approval.
- **Every fact has a source:** `file:line@sha` · script path + sha256 + result line · log query + time range. Unchecked = write "ยังไม่ได้ตรวจ" (not checked).
- **DB reads on prod** need an approval bound to the script's hash. Change the script = ask again.
- **DB writes:** dry-run by default · exact DB name check · allowlist · backup + rollback before apply.
- **Never read** `.env*`, `.mcp.json`, `~/.secrets/*`, keys. **Never print or commit** secrets, IPs, personal data (PII).
- **Everyone works through cards.** Write a post to a file → `node scripts/board.mjs post <card> <file>` (runs `draft-check`, dry-run) → add `--send`. Read the latest comments first (`board.mjs read`).
- **Chase** only after reading the latest comments: and only after the response time the team agreed (per project).
- Git as in `docs/git.md`: Conventional Commits (hook `commit-msg`), secret scan (hook `pre-commit`), short branches, squash-merge PRs. Push only when asked. No force-push, no `--no-verify`, never unset `core.hooksPath`.

## 8. Commands
`npm install` (also turns on git hooks) · `npm run secret-scan` · docs site `npm run docs:dev` / `docs:build` · board `node scripts/board.mjs post|read <card>`.
กรอกต่อโปรเจกต์: dev · test · build · deploy.

## 9. Owner decisions
- 2026-11-21 · This blueprint is **public and free to use** (Apache-2.0, chosen 2026-11-22). Generic principles, international standards and original code only; roles are named by function. Repo name `engineering-blueprint` (rename allowed). <!-- blueprint-only -->
- 2026-11-21 · Intake first: detailed questions before any work; full skill set from requirement to user manual; user manual as a web doc. <!-- blueprint-only -->
- 2026-11-21 · Memory is stored in the project folder (`memory/`), not pushed to git, so the work moves between machines by copying the folder; folder and repo names may change. <!-- blueprint-only -->
- 2026-11-21 · This repo is the main system (blueprint); real work = projects created from it by `scripts/new-project.mjs`, any number, each self-contained. <!-- blueprint-only -->
- 2026-11-21 · Must work with Codex and other agents too → rules live in `AGENTS.md`; tool files only point here. <!-- blueprint-only -->

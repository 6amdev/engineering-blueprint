@AGENTS.md
@memory/MEMORY.md

# Claude Code only (adds to AGENTS.md, never repeats it)
- Skills in `.claude/skills/` load as Claude skills; start new work with the `intake` skill.
- Sub-agents in `.claude/agents/` — always pass `model`: design / review / security = opus · code to a spec = sonnet · mechanical = haiku.
- `.claude/settings.json` denies reading secret files and force/no-verify git. Never edit it to get past a block; stop and ask.
- Claude's auto-memory (`~/.claude/projects/.../memory`) is not used for this project: write memories to `memory/` here instead.

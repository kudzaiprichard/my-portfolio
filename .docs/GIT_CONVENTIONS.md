# Git Conventions

> Rules for how Claude Code performs git actions in this repo. Read this before any `commit`, `push`,
> `branch`, or other git operation.

## Attribution — never tag Claude/Anthropic

- **Do NOT** add Claude Code or Anthropic as a contributor, co-author, or committer.
- **Do NOT** add `Co-Authored-By: Claude ...`, `Generated with Claude Code`, or any similar trailer
  to commit messages or PR descriptions.
- Commits are authored solely by the repo's configured git user. (This is also enforced in
  `.claude/settings.json` via `attribution` + `includeCoAuthoredBy: false`, but follow it manually
  too in case settings change.)

## Committing — only when asked

Only create commits when the user explicitly asks. When you do:

- **Group files by feature, purpose, or domain** — do NOT commit one file at a time unless necessary.
- One logical change per commit; split unrelated changes into separate commits.

### Commit message format (use this exact shape, always)

```
type(scope): short summary of what was done
- Specific detail about one file or change
- Specific detail about another file or change
- Specific detail about another file or change
```

### Rules for commit messages

- **First line**: conventional-commits format — `feat`, `fix`, `refactor`, `chore`, `style`, `docs`,
  etc.
- **Scope** reflects the feature or domain (e.g. `auth`, `dashboard`, `api`, `ui`).
- **Bullet points must match the number of files in the commit** — exactly one bullet per file.
- Keep bullets short, technical, and human-readable.
- Do **NOT** be vague — avoid "update files", "misc changes", and similar.

### Example

```
feat(runner): add Python subprocess execution with timeout

- runner/src/exec.rs: spawn python3 subprocess and pipe stdin/stdout
- runner/src/timeout.rs: watchdog that kills the process after N seconds
- runner/src/lib.rs: expose run_python as a Tauri command
```

## Branching, push, and other git actions

- Never push, force-push, reset --hard, or rewrite history unless explicitly asked.
- If on the default branch and starting new work, create a branch first.

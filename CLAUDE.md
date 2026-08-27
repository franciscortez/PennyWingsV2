# CLAUDE.md

PennyWings keeps **one** agent guide, and it is not this file. `AGENTS.md` is the
single source of truth for workflow, safeguards, required skills, and validation.
Read it first and follow it as written.

@AGENTS.md

## Notes for Claude Code

- Anything in `AGENTS.md` wins. Do not duplicate its rules here; if guidance needs
  to change, edit `AGENTS.md` (or the relevant skill) rather than this file.
- CI (`.github/workflows/ci.yml`) gates every push and PR on `npm run lint`,
  `npm test`, `npm run build`, and `npm run test:e2e`. Run the same commands
  locally before handing work off, so CI is a confirmation and not a surprise.
- `npm run build` runs `tsc -b` first, so it doubles as the typecheck gate.
- E2E specs stub Supabase through `tests/e2e/helpers/authMock.ts`, so they need no
  running database. Local Supabase (`npm run db:start`) is only for real app use.

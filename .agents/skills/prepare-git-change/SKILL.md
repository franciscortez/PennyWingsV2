---
name: prepare-git-change
description: Inspect, summarize, stage, commit, or prepare a PennyWings change for review while preserving unrelated work. Use when asked for a Git handoff, conventional commit, branch, staging, PR preparation, or final diff review. Staging, committing, branching, and pushing remain separate actions and require the user's requested scope.
---

# Prepare a Git Change

Package only the intended work and leave pre-existing or unrelated edits untouched.

## Inspect before acting

1. Read root `AGENTS.md` and `git status --short`.
2. Review unstaged and staged diffs separately. Identify files that predate the task, contain mixed ownership, include secrets, or are generated.
3. Compare the diff with the request and validation evidence. Stop before including ambiguous files.

## Prepare the handoff

- Summarize behavior, architecture/database impact, risk, and validation results.
- Suggest a conventional commit: `<type>(<scope>): <imperative summary>`. Use a concise lowercase subject; add a body for reasoning, migration implications, or breaking behavior.
- For Codex-created branches, use `codex/<short-topic>` unless the user asks for another name.
- Stage explicit reviewed paths only. Never use `git add .`, `git add -A`, or blanket staging when other work exists.
- Never discard changes with reset, restore, checkout, clean, or history rewriting as part of preparation.

## Authorization boundaries

Do not create/switch a branch, stage files, commit, push, open a PR, deploy, or tag a release unless that action is requested. A request to "prepare" a commit authorizes analysis and a proposed message, not an automatic push or deployment. Before any requested commit, verify the staged diff and state what remains unstaged.

## Final report

Provide the intended file list, concise diff summary, validation status, proposed or created branch/commit details, and any excluded user changes. Never include secret values from `.env` or financial data.

---
name: maintain-ai-workflow
description: Create, audit, or update PennyWings AGENTS.md instructions, repository skills under .agents/skills, and their agents/openai.yaml metadata. Use when architecture, commands, recurring review feedback, or operational practices make the AI workflow stale, or when adding or renaming a reusable skill. Do not use for ordinary product implementation.
---

# Maintain the AI Workflow

Keep the centralized repository guide and reusable skills accurate, discoverable, and cheaper to maintain than duplicated prompt text.

## Audit

1. Read the root `AGENTS.md`, enumerate `.agents/skills/*/SKILL.md`, and inspect `package.json`, directory structure, CI/config, and relevant operational documentation.
2. Check claims against current code and commands. Treat stale product documentation as context, not proof.
3. Identify duplicated, conflicting, obsolete, overly broad, or missing instructions and skills.

## Place guidance correctly

- Keep root `AGENTS.md` as the repository's single centralized instruction file, including concise path-specific rules.
- Do not create nested `AGENTS.md` files. If the root grows too detailed, move repeatable procedures into a focused skill instead of creating another instruction file.
- Put a repeatable multi-step procedure in one focused skill.
- Keep one-off task details out of persistent configuration.
- Add `.codex/config.toml` only for a concrete project setting, never as a substitute for instructions.

## Add or update a skill

1. Use the installed `skill-creator` workflow to initialize new skills.
2. Use lowercase hyphen-case and make the folder name match frontmatter `name`.
3. Keep frontmatter to `name` and a trigger-rich `description` that states when to use and when not to use the skill.
4. Write imperative steps with explicit inputs, outputs, safety boundaries, and validation. Keep one job per skill.
5. Keep `agents/openai.yaml` in sync: quote strings, use a 25-64 character short description, and mention `$skill-name` in the default prompt.
6. Update the root catalog for additions, removals, or renames. Do not add unused resource folders or per-skill README files.

## Validate

Run the skill-creator `quick_validate.py` for every changed skill. Search the AI files for `TODO`, placeholder content, stale names, broken paths, and conflicts. Check that likely prompts trigger the intended skill and unrelated prompts do not. Run `git diff --check`, inspect the full diff, and confirm the centralized `AGENTS.md` remains compact and complete.

## Completion report

List changed guidance, skill trigger/boundary changes, validation evidence, and any repository behavior that still lacks an authoritative source.

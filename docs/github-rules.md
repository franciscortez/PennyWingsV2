# GitHub Commit Rules

## Commit Message Format

```
<type>(<scope>): <short description>
```

- **type** — what kind of change (see below)
- **scope** — optional, the area affected (e.g. `auth`, `home`, `supabase`, `routing`)
- **short description** — imperative, lowercase, no period at the end

---

## Types

| Type | When to use |
| --- | --- |
| `feat` | A new feature or page |
| `fix` | A bug fix |
| `refactor` | Code restructure with no behavior change |
| `style` | UI/CSS-only changes, no logic change |
| `chore` | Config, tooling, dependencies, non-src changes |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |

---

## Examples

```
feat(auth): add login and register pages with AuthShell layout
feat(home): add hero, features, and footer sections
refactor(auth): extract TextInput and PasswordInput into reusable components
fix(auth): correct forgot password link in PasswordInput
chore: add supabase-js and react-hook-form dependencies
docs: add supabase schema reference to docs/supabase-tables.md
style(home): adjust hero section spacing and gradient colors
```

---

## Rules

1. Always `git add .` before committing unless excluding specific files intentionally
2. One logical change per commit — don't mix features with refactors
3. Never commit directly to `main`/`master` for features — use a branch
4. Never push secrets, `.env` files, or credentials (already in `.gitignore`)
5. Never force push to shared branches
6. Branch naming follows the same type prefix: `feat/auth-forms`, `fix/login-redirect`

---

## Workflow (run this every time changes are ready to commit)

1. Analyze the current uncommitted changes with `git status` and `git diff HEAD`
2. Derive the branch name from the changes using the type prefix convention
3. `git checkout -b <branch-name>`
4. `git add .`
5. `git commit -m "<type>(<scope>): <short description>"`

Branch name mirrors the commit message slug: `feat/accounts-page-and-initial-loader`

---

## After Merge Cleanup (run this after a PR is merged on GitHub)

1. `git checkout main`
2. `git pull`
3. `git branch -d <branch-name>`

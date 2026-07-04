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

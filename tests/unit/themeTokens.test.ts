import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(__dirname, '../..')
const sourceRoot = path.join(projectRoot, 'src')

// Tailwind silently drops a utility whose colour token does not exist, so
// `dark:bg-slate-850` looked correct in review and rendered nothing. This walks
// the source and fails when a class names a shade the build cannot resolve.
const colorUtility =
  /\b(?:bg|text|border|ring|from|to|via|divide|outline|decoration|shadow|accent|caret|fill|stroke|placeholder)-(slate|gray|pink|rose|amber|violet|emerald|sky|blue|red|white|black)-(\d{2,3})\b/g

const tailwindShades = new Set([
  '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
])

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry)

    if (statSync(entryPath).isDirectory()) {
      return collectFiles(entryPath)
    }

    return /\.(ts|tsx|css)$/.test(entryPath) ? [entryPath] : []
  })

const getDeclaredTokens = () => {
  const css = readFileSync(path.join(sourceRoot, 'index.css'), 'utf8')
  const declared = new Set<string>()

  for (const match of css.matchAll(/--color-([a-z]+)-(\d{2,3})\s*:/g)) {
    declared.add(`${match[1]}-${match[2]}`)
  }

  return declared
}

describe('theme colour tokens', () => {
  it('resolves every colour utility used in src', () => {
    const declared = getDeclaredTokens()
    const unresolved = new Map<string, string[]>()

    for (const file of collectFiles(sourceRoot)) {
      const contents = readFileSync(file, 'utf8')

      for (const [, family, shade] of contents.matchAll(colorUtility)) {
        const token = `${family}-${shade}`

        // A shade resolves when the project declares it in `@theme` or when it
        // is one of Tailwind's own steps for that family.
        if (declared.has(token) || tailwindShades.has(shade)) {
          continue
        }

        const users = unresolved.get(token) ?? []

        users.push(path.relative(projectRoot, file))
        unresolved.set(token, [...new Set(users)])
      }
    }

    expect(Object.fromEntries(unresolved)).toEqual({})
  })
})

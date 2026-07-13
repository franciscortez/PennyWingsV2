import { type ReactNode } from 'react'

function parseInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  const regex = /(\*\*|\*|`|_)(.*?)\1/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const index = match.index
    const [fullMatch, delimiter, innerText] = match

    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index))
    }

    if (delimiter === '**') {
      parts.push(
        <strong key={index} className="font-black text-gray-900 dark:text-white">
          {innerText}
        </strong>,
      )
    } else if (delimiter === '*' || delimiter === '_') {
      parts.push(
        <em key={index} className="italic">
          {innerText}
        </em>,
      )
    } else if (delimiter === '`') {
      parts.push(
        <code
          key={index}
          className="rounded bg-pink-100/60 px-1.5 py-0.5 font-mono text-xs font-bold text-pink-600 dark:bg-slate-950 dark:text-pink-400"
        >
          {innerText}
        </code>,
      )
    } else {
      parts.push(fullMatch)
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: ReactNode[] = []

  let currentList: { type: 'ul' | 'ol'; items: ReactNode[] } | null = null
  let currentTable: { headers: ReactNode[][]; rows: ReactNode[][][] } | null = null

  const commitList = (key: number) => {
    if (currentList) {
      const ListTag = currentList.type
      const listClass =
        currentList.type === 'ul'
          ? 'list-disc pl-5 space-y-1 my-1.5'
          : 'list-decimal pl-5 space-y-1 my-1.5'
      elements.push(
        <ListTag key={`list-${key}`} className={listClass}>
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ListTag>,
      )
      currentList = null
    }
  }

  const commitTable = (key: number) => {
    if (currentTable) {
      elements.push(
        <div
          key={`table-wrapper-${key}`}
          className="my-3 overflow-x-auto rounded-lg border border-pink-100 dark:border-slate-800"
        >
          <table className="min-w-full divide-y divide-pink-100 text-xs dark:divide-slate-800">
            {currentTable.headers.length > 0 && (
              <thead className="bg-pink-50/50 dark:bg-slate-950/40">
                {currentTable.headers.map((row, rIdx) => (
                  <tr key={`th-${rIdx}`}>
                    {row.map((cell, cIdx) => (
                      <th
                        key={`thc-${cIdx}`}
                        className="px-3 py-2 text-left font-black text-gray-800 dark:text-slate-200"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
            )}
            <tbody className="divide-y divide-pink-50/60 bg-white dark:bg-slate-900 dark:divide-slate-800/60">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={`tdc-${cIdx}`}
                      className="whitespace-nowrap px-3 py-2 font-medium text-gray-600 dark:text-slate-300"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      currentTable = null
    }
  }

  const commitAll = (key: number) => {
    commitList(key)
    commitTable(key)
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    // A. Check for table rows
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|')
    if (isTableRow) {
      commitList(idx) // close lists if any

      const isDelimiter = trimmed.replace(/[|:\s-]/g, '') === ''
      if (isDelimiter) {
        // Skip delimiter rows
        return
      }

      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => parseInlineMarkdown(c.trim()))
      if (!currentTable) {
        currentTable = { headers: [cells], rows: [] }
      } else {
        currentTable.rows.push(cells)
      }
      return
    }

    // Since we are not in a table row, commit any open table
    commitTable(idx)

    // 1. Headers
    if (trimmed.startsWith('### ')) {
      commitList(idx)
      elements.push(
        <h4
          key={idx}
          className="mt-3 mb-1 text-sm font-black text-gray-900 first:mt-0 dark:text-white"
        >
          {parseInlineMarkdown(trimmed.substring(4))}
        </h4>,
      )
      return
    }
    if (trimmed.startsWith('## ')) {
      commitList(idx)
      elements.push(
        <h3
          key={idx}
          className="mt-3 mb-1 text-sm font-black text-gray-900 first:mt-0 dark:text-white"
        >
          {parseInlineMarkdown(trimmed.substring(3))}
        </h3>,
      )
      return
    }
    if (trimmed.startsWith('# ')) {
      commitList(idx)
      elements.push(
        <h2
          key={idx}
          className="mt-3 mb-1 text-sm font-black text-gray-900 first:mt-0 dark:text-white"
        >
          {parseInlineMarkdown(trimmed.substring(2))}
        </h2>,
      )
      return
    }

    // 2. Unordered Lists
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/)
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        commitList(idx)
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(parseInlineMarkdown(ulMatch[2]))
      return
    }

    // 3. Ordered Lists
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        commitList(idx)
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(parseInlineMarkdown(olMatch[2]))
      return
    }

    // 4. Empty line
    if (trimmed === '') {
      commitList(idx)
      elements.push(<div key={`br-${idx}`} className="h-2" />)
      return
    }

    // 5. Paragraph text
    commitList(idx)
    elements.push(
      <p key={idx} className="leading-relaxed">
        {parseInlineMarkdown(line)}
      </p>,
    )
  })

  commitAll(lines.length)

  return <div className="space-y-1.5">{elements}</div>
}

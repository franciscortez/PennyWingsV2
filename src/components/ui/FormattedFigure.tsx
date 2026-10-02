import { Fragment } from 'react'
import { figure } from '@/components/ui/surfaces'

// Preserve the formatter's exact text. Extreme values may wrap between
// thousands groups, never between digits or within the decimal portion.
export function FormattedFigure({ value, className = '' }: { value: string; className?: string }) {
  const groups = value.split(',')
  return (
    <span className={`${figure} ${className}`}>
      {groups.map((group, index) => (
        <Fragment key={index}>
          <span className="whitespace-nowrap">{group}{index < groups.length - 1 ? ',' : ''}</span>
          {index < groups.length - 1 ? <wbr /> : null}
        </Fragment>
      ))}
    </span>
  )
}

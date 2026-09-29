import { BentoCell } from '@/sections/home/bento/BentoCell'
import { mockSpendingWeeks } from '@/sections/home/landingMock'

// Same ramp the real daily spending calendar uses (see `--color-heat-*`).
const heatClasses = [
  'bg-pink-50',
  'bg-heat-1',
  'bg-heat-2',
  'bg-heat-3',
  'bg-heat-4',
  'bg-heat-5',
]

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function CalendarTile({ className, delay }: { className?: string; delay?: number }) {
  return (
    <BentoCell
      className={className}
      delay={delay}
      title="Spot the heavy days"
      body="The daily spending calendar shades each day by how much went out, and opens any day to show where it went."
    >
      <div
        role="img"
        aria-label="Illustrative daily spending calendar, shaded from light to deep pink by amount spent"
        className="max-w-[20rem]"
      >
        <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
          {weekdays.map((day, index) => (
            <span
              key={`${day}-${index}`}
              className="pb-1 text-center font-geist-mono text-[11px] font-medium text-slate-600"
            >
              {day}
            </span>
          ))}
          {mockSpendingWeeks.flat().map((level, index) => (
            <span
              key={index}
              className={`aspect-square rounded-lg ${heatClasses[level]} ${level === 0 ? 'border border-pink-100' : ''}`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-slate-600" aria-hidden="true">
          Less
          {heatClasses.slice(1).map((heat) => (
            <span key={heat} className={`h-3 w-3 rounded ${heat}`} />
          ))}
          More
        </div>
      </div>
    </BentoCell>
  )
}

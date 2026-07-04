import type { SVGProps } from 'react'

type PennyWingsMarkProps = SVGProps<SVGSVGElement>

export function PennyWingsMark({
  className = 'h-8 w-8',
  ...props
}: PennyWingsMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M 48 20 C 40 10 30 15 35 20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 52 20 C 60 10 70 15 65 20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 48 30 C 20 -5 0 20 15 45 C 0 65 20 95 48 65 Z"
        fill="currentColor"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M 52 30 C 80 -5 100 20 85 45 C 100 65 80 95 52 65 Z"
        fill="currentColor"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="25" cy="30" r="3" fill="currentColor" fillOpacity="0.2" />
      <circle cx="75" cy="30" r="3" fill="currentColor" fillOpacity="0.2" />
      <rect x="47" y="20" width="6" height="45" rx="3" fill="currentColor" />
      <circle cx="50" cy="18" r="4" fill="currentColor" />
    </svg>
  )
}

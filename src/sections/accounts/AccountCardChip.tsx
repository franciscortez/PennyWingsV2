import { useId } from 'react'

type AccountCardChipProps = {
  className?: string
}

/** Realistic gold EMV chip with contact pads, like on a physical card. */
export function AccountCardChip({
  className = 'h-8 w-10',
}: AccountCardChipProps) {
  const gradientId = useId()

  return (
    <svg
      className={className}
      viewBox="0 0 40 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6E27A" />
          <stop offset="0.4" stopColor="#E3B94D" />
          <stop offset="0.7" stopColor="#D2A237" />
          <stop offset="1" stopColor="#B07C1F" />
        </linearGradient>
      </defs>

      {/* Chip body */}
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="28.5"
        rx="5.5"
        fill={`url(#${gradientId})`}
        stroke="#8A621A"
        strokeWidth="1"
      />

      {/* Contact pad separations */}
      <path
        d="M0.75 10.5H13.5M0.75 19.5H13.5M26.5 10.5H39.25M26.5 19.5H39.25M13.5 0.75V10.5M26.5 0.75V10.5M13.5 19.5V29.25M26.5 19.5V29.25"
        stroke="#8A621A"
        strokeWidth="0.9"
        strokeOpacity="0.85"
      />
      {/* Center contact plate */}
      <rect
        x="13.5"
        y="10.5"
        width="13"
        height="9"
        rx="2.5"
        stroke="#8A621A"
        strokeWidth="0.9"
        strokeOpacity="0.85"
      />

      {/* Metallic sheen */}
      <path
        d="M4 27C14 18 27 12 37 4"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

type AccountCardChipProps = {
  className?: string
}

export function AccountCardChip({
  className = 'h-8 w-10',
}: AccountCardChipProps) {
  return (
    <div
      className={`${className} relative overflow-hidden rounded-lg bg-amber-400/80 ring-1 ring-amber-300`}
    >
      <svg
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full opacity-40 mix-blend-overlay"
        aria-hidden="true"
      >
        <path d="M0 20 H100" stroke="black" strokeWidth="1" />
        <path d="M0 40 H100" stroke="black" strokeWidth="1" />
        <path d="M0 60 H100" stroke="black" strokeWidth="1" />
        <path d="M33 0 V80" stroke="black" strokeWidth="1" />
        <path d="M66 0 V80" stroke="black" strokeWidth="1" />
        <rect x="33" y="20" width="34" height="40" stroke="black" strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent" />
    </div>
  )
}

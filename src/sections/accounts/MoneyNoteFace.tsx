import { FaHandHoldingDollar } from 'react-icons/fa6'
import type { ReactNode } from 'react'

import { noteColors } from '@/sections/accounts/bankCardDesigns'

type MoneyNoteFaceProps = {
  className?: string
  serial?: string
  subtitle: string
  title: string
  topRight?: ReactNode
  variant: 'cash' | 'lent'
}

/** Engraved portrait oval: concentric rings over fine hatch lines. */
function PortraitOval({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[24cqw] w-[19cqw] shrink-0">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 76 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Hatched engraving background */}
        {Array.from({ length: 12 }, (_, index) => (
          <line
            key={index}
            x1="8"
            x2="68"
            y1={12 + index * 6}
            y2={12 + index * 6}
            stroke="currentColor"
            strokeWidth="0.45"
            opacity="0.35"
          />
        ))}
        <ellipse
          cx="38"
          cy="48"
          rx="35"
          ry="45"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <ellipse
          cx="38"
          cy="48"
          rx="30.5"
          ry="40.5"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeDasharray="2 1.6"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

/** Round official-looking seal with a serif initial, like a district seal. */
function DistrictSeal({ initial }: { initial: string }) {
  return (
    <div className="relative flex h-[11cqw] w-[11cqw] shrink-0 items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="22" cy="22" r="20.5" stroke="currentColor" strokeWidth="1.4" />
        <circle
          cx="22"
          cy="22"
          r="16.5"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeDasharray="1.6 1.8"
        />
      </svg>
      <span className="font-serif text-[4.6cqw] font-black leading-none">
        {initial}
      </span>
    </div>
  )
}

/** Spirograph rosette seal, like the treasury seal. */
function RosetteSeal() {
  return (
    <svg
      className="h-[11cqw] w-[11cqw] shrink-0"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="20.5" stroke="currentColor" strokeWidth="1.2" />
      {[0, 30, 60, 90, 120, 150].map((angle) => (
        <ellipse
          key={angle}
          cx="22"
          cy="22"
          rx="19"
          ry="7"
          stroke="currentColor"
          strokeWidth="0.6"
          transform={`rotate(${angle} 22 22)`}
        />
      ))}
      <circle cx="22" cy="22" r="7.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

/**
 * Renders cash and lent accounts as an engraved banknote, modeled after real
 * bills: cream paper, ornate double frame, portrait oval, district and
 * treasury seals, duplicated serial numbers, corner denominations, and a
 * denomination band. Each kind has one fixed ink — dollar green for cash,
 * aged sepia for lent — so there is no color to choose. Sized in
 * container-query units so it scales like a printed bill at any width.
 */
export function MoneyNoteFace({
  className = '',
  serial = 'PW 00000000',
  subtitle,
  title,
  topRight,
  variant,
}: MoneyNoteFaceProps) {
  // Dark engraving ink and vivid serial ink, derived from the fixed note ink
  const color = noteColors[variant]
  const ink = `color-mix(in srgb, ${color} 42%, #26302b)`
  const serialInk = `color-mix(in srgb, ${color} 78%, #1e2a24)`
  const initial = (title.trim().charAt(0) || '₱').toUpperCase()

  return (
    <div
      className={`@container relative flex flex-col overflow-hidden rounded-2xl shadow-[0_14px_28px_-10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/10 ${className}`}
      style={{
        background: 'linear-gradient(120deg, #F8F5EB 0%, #F1EDDE 55%, #E9E4D0 100%)',
        color: ink,
      }}
    >
      {/* Color tint wash, like the subtle hue on modern bills */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 75% 90% at 50% 45%, ${color}1f 0%, transparent 72%)`,
        }}
      />

      {/* Security thread */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[30%] w-[0.9cqw] opacity-25"
        style={{
          background: `repeating-linear-gradient(0deg, ${serialInk} 0 6px, transparent 6px 11px)`,
        }}
      />

      {/* Ornate double frame */}
      <div className="pointer-events-none absolute inset-[1.8cqw] rounded-[1.6cqw] border-[0.8cqw] border-double border-current opacity-55" />
      <div className="pointer-events-none absolute inset-[3.6cqw] rounded-[1cqw] border border-current opacity-25" />

      {/* Corner denominations */}
      <span className="pointer-events-none absolute left-[4.6cqw] top-[3.6cqw] font-serif text-[4.6cqw] font-black leading-none opacity-80">
        ₱
      </span>
      <span className="pointer-events-none absolute right-[4.6cqw] top-[3.6cqw] font-serif text-[3.4cqw] font-black leading-none opacity-60">
        ₱
      </span>
      <span className="pointer-events-none absolute bottom-[3.6cqw] left-[4.6cqw] font-serif text-[3.4cqw] font-black leading-none opacity-60">
        ₱
      </span>
      <span className="pointer-events-none absolute bottom-[3.6cqw] right-[4.6cqw] font-serif text-[4.6cqw] font-black leading-none opacity-80">
        ₱
      </span>

      <div className="relative z-10 flex flex-1 flex-col p-[5.5cqw]">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate pl-[5cqw] text-[2.5cqw] font-black uppercase tracking-[0.34em] opacity-80">
            {variant === 'cash'
              ? 'PennyWings Reserve Note'
              : 'PennyWings Promissory Note'}
          </p>
          {topRight ? (
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              {topRight}
            </div>
          ) : null}
        </div>

        <p className="mt-[1.6cqw] truncate text-center font-serif text-[5.4cqw] font-black uppercase leading-tight tracking-[0.08em]">
          {title}
        </p>

        <div className="flex flex-1 items-center justify-between gap-[3cqw] px-[4cqw]">
          <div className="flex flex-col items-center gap-[1.6cqw]">
            <p
              className="font-mono text-[2.7cqw] font-bold tracking-[0.1em]"
              style={{ color: serialInk }}
            >
              {serial}
            </p>
            <DistrictSeal initial={initial} />
          </div>

          <PortraitOval>
            {variant === 'cash' ? (
              <span className="font-serif text-[9.5cqw] font-black leading-none">
                ₱
              </span>
            ) : (
              <FaHandHoldingDollar
                className="h-[8.5cqw] w-[8.5cqw]"
                aria-hidden="true"
              />
            )}
          </PortraitOval>

          <div className="flex flex-col items-center gap-[1.6cqw]">
            <div style={{ color: serialInk }}>
              <RosetteSeal />
            </div>
            <p
              className="font-mono text-[2.7cqw] font-bold tracking-[0.1em]"
              style={{ color: serialInk }}
            >
              {serial}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-full">
          <p
            className="truncate rounded-[1cqw] px-[4cqw] py-[1.1cqw] font-serif text-[3cqw] font-black uppercase tracking-[0.3em] text-[#F4F1E4]"
            style={{ backgroundColor: ink }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

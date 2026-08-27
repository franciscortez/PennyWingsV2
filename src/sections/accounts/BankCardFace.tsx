import type { ReactNode } from 'react'

import { AccountCardChip } from '@/sections/accounts/AccountCardChip'
import type {
  BankCardDesign,
  BankCardMotif,
} from '@/sections/accounts/bankCardDesigns'

type BankCardFaceProps = {
  className?: string
  design: BankCardDesign
  holderName: string
  numberLine: string
  topRight?: ReactNode
  typeLabel?: string
}

/** The EMV contactless indicator: four arcs opening to the right. */
function ContactlessIcon({
  className,
  color,
}: {
  className?: string
  color: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 9.4a4.6 4.6 0 0 1 0 5.2M6.4 7.2a8.6 8.6 0 0 1 0 9.6M9.8 5a12.8 12.8 0 0 1 0 14M13.2 2.8a17 17 0 0 1 0 18.4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Iridescent hologram patch, like the security foil on a physical card. */
function HologramPatch() {
  return (
    <div
      aria-hidden="true"
      className="h-[8cqw] w-[8cqw] rounded-full border border-white/40 opacity-80 mix-blend-screen"
      style={{
        background:
          'conic-gradient(from 210deg, #cfd6e4, #f2f6ff, #b7c6e0, #ecd9f2, #cfe8dd, #f6eec9, #cfd6e4)',
      }}
    />
  )
}

/** Monochrome payment-network mark: overlapping circles bottom-right. */
function NetworkMark({ typeLabel }: { typeLabel?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-[1cqw]">
      <div className="relative h-[7.5cqw] w-[12cqw]" aria-hidden="true">
        <span className="absolute left-0 top-0 h-[7.5cqw] w-[7.5cqw] rounded-full bg-white/30" />
        <span className="absolute left-[4.5cqw] top-0 h-[7.5cqw] w-[7.5cqw] rounded-full border border-white/50 bg-white/15" />
      </div>
      {typeLabel ? (
        <span className="text-[2.4cqw] font-black uppercase tracking-[0.22em] opacity-85">
          {typeLabel}
        </span>
      ) : null}
    </div>
  )
}

/** Per-bank face artwork echoing the pattern on the real card. */
function CardMotif({
  accent,
  motif,
}: {
  accent: string
  motif: BankCardMotif
}) {
  if (motif === 'minimal') return null

  if (motif === 'glow') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 88% 82%, ${accent}3d 0%, transparent 52%)`,
          }}
        />
        <div
          className="absolute -bottom-[18cqw] -right-[12cqw] h-[52cqw] w-[52cqw] rounded-full border-2"
          style={{ borderColor: `${accent}59` }}
        />
        <div
          className="absolute -bottom-[28cqw] right-[2cqw] h-[52cqw] w-[52cqw] rounded-full border"
          style={{ borderColor: `${accent}30` }}
        />
      </div>
    )
  }

  if (motif === 'circles') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-[16cqw] -right-[12cqw] h-[46cqw] w-[46cqw] rounded-full bg-white/10" />
        <div className="absolute -bottom-[2cqw] right-[24cqw] h-[28cqw] w-[28cqw] rounded-full bg-white/6" />
        <div className="absolute -left-[10cqw] -top-[14cqw] h-[38cqw] w-[38cqw] rounded-full border border-white/12" />
      </div>
    )
  }

  if (motif === 'waves') {
    return (
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 250"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 178C70 138 130 218 200 178S330 138 400 173"
          stroke={accent}
          strokeOpacity="0.35"
          strokeWidth="2.5"
        />
        <path
          d="M0 196C70 156 130 236 200 196S330 156 400 191"
          stroke="white"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        <path
          d="M0 214C70 174 130 254 200 214S330 174 400 209"
          stroke={accent}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  // arc — broad sweeping band, the most common PH card artwork
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 250"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M-30 265C90 145 260 245 430 70"
        stroke={accent}
        strokeOpacity="0.26"
        strokeWidth="46"
      />
      <path
        d="M-30 305C110 195 280 290 430 135"
        stroke="white"
        strokeOpacity="0.08"
        strokeWidth="26"
      />
    </svg>
  )
}

/**
 * Renders an account as a realistic bank card face: brand gradient and
 * artwork, gold EMV chip, contactless indicator, hologram, embossed card
 * number, VALID THRU line, holder name, and a payment-network mark.
 *
 * Every element is sized in container-query units so the card scales
 * proportionally at any width, exactly like a printed card.
 */
export function BankCardFace({
  className = '',
  design,
  holderName,
  numberLine,
  topRight,
  typeLabel,
}: BankCardFaceProps) {
  const wordmark = design.wordmark || holderName
  const showHolder =
    holderName.trim().toLowerCase() !== wordmark.trim().toLowerCase()
  const isLightText = design.text.toLowerCase() === '#ffffff'
  const embossShadow = isLightText
    ? '0 1px 1px rgba(0, 0, 0, 0.55), 0 -0.5px 0.5px rgba(255, 255, 255, 0.3)'
    : '0 1px 0.5px rgba(255, 255, 255, 0.45), 0 -0.5px 0.5px rgba(0, 0, 0, 0.2)'
  const numberGroups = numberLine.trim().split(/\s+/)

  return (
    <div
      className={`@container relative flex flex-col overflow-hidden rounded-2xl shadow-[0_14px_28px_-10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_2px_rgba(0,0,0,0.3)] ring-1 ring-black/10 ${className}`}
      style={{ background: design.background, color: design.text }}
    >
      <CardMotif accent={design.accent} motif={design.motif} />

      {/* Printed sheen: brand glow top-right + diagonal light sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 85% 10%, ${design.accent}2b 0%, transparent 50%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/14 via-transparent to-black/18"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between gap-[3cqw] p-[5.5cqw]">
        <div className="flex items-start justify-between gap-3">
          <p
            className="truncate text-[6cqw] font-black leading-tight tracking-tight drop-shadow-sm"
            style={{ color: design.wordmarkColor ?? design.text }}
          >
            {wordmark}
          </p>
          {topRight ? (
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              {topRight}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-[2.5cqw]">
            <AccountCardChip className="h-[8cqw] w-[10.7cqw]" />
            <ContactlessIcon className="h-[6cqw] w-[4.5cqw]" color={design.accent} />
          </div>
          <HologramPatch />
        </div>

        <div className="space-y-[2cqw]">
          <div
            className="flex items-baseline gap-x-[3cqw] font-mono text-[5.6cqw] font-semibold tracking-[0.08em]"
            style={{ textShadow: embossShadow }}
          >
            {numberGroups.map((group, groupIndex) => (
              <span key={`${group}-${groupIndex}`} className="truncate">
                {group}
              </span>
            ))}
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-[1.2cqw]">
              <div className="flex items-center gap-[1.5cqw]">
                <span className="text-[2.2cqw] font-bold uppercase leading-[2.6cqw] tracking-wider opacity-70">
                  Valid
                  <br />
                  Thru
                </span>
                <span
                  className="font-mono text-[3.4cqw] font-semibold"
                  style={{ textShadow: embossShadow }}
                >
                  ••/••
                </span>
              </div>
              <p
                className="truncate text-[3.6cqw] font-bold uppercase tracking-[0.14em]"
                style={{ textShadow: embossShadow }}
              >
                {showHolder ? holderName : 'Card Holder'}
              </p>
            </div>
            <NetworkMark typeLabel={typeLabel} />
          </div>
        </div>
      </div>
    </div>
  )
}

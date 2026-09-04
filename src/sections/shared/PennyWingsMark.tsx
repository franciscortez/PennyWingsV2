import type { ImgHTMLAttributes } from 'react'

type PennyWingsMarkProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'alt' | 'src'
>

export function PennyWingsMark({
  className = 'h-8 w-12',
  ...props
}: PennyWingsMarkProps) {
  return (
    <img
      src="/pennywings-logo.png"
      alt=""
      width={1254}
      height={854}
      className={`object-contain ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}

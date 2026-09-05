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
      src="/pennywings-butterfly-transparent.png"
      alt=""
      width={1254}
      height={1254}
      className={`object-contain ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}

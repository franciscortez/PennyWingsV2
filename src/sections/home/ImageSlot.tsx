import { ImageIcon } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import type { LandingImage } from '@/sections/home/landingContent'

type ImageSlotProps = {
  image: LandingImage
  className?: string
  priority?: boolean
}

// Renders the finished image once `image.src` is set, and a labelled
// wireframe until then. The wireframe keeps the final aspect ratio so the
// layout does not shift when the real asset lands.
export function ImageSlot({ image, className, priority = false }: ImageSlotProps) {
  const aspectRatio = `${image.width} / ${image.height}`

  if (image.src) {
    return (
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        style={{ aspectRatio }}
        className={twMerge('h-auto w-full object-contain', className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={image.alt}
      data-slot={image.id}
      title={image.prompt}
      style={{ aspectRatio }}
      className={twMerge(
        'relative isolate w-full overflow-hidden rounded-[2rem] border-2 border-dashed border-pink-300 bg-pink-50/70',
        className,
      )}
    >
      <svg
        className="absolute inset-0 -z-10 h-full w-full text-pink-200"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="flex max-w-[16rem] flex-col items-center gap-2 rounded-[1.25rem] border border-pink-200 bg-white/90 px-5 py-4 text-center">
          <ImageIcon className="h-5 w-5 text-pink-800" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-geist-mono text-xs font-medium text-pink-900">
            {image.id}
          </span>
          <span className="font-geist-mono text-[11px] text-slate-600">
            {image.width} × {image.height}
          </span>
        </div>
      </div>
    </div>
  )
}

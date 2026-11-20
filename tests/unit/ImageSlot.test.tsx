import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ImageSlot } from '@/sections/home/ImageSlot'
import { landingImages, type LandingImage } from '@/sections/home/landingContent'

const withVariants: LandingImage = {
  id: 'scene',
  src: '/landing/scene.webp',
  srcSet: '/landing/scene-800.webp 800w, /landing/scene.webp 1600w',
  sizes: '(min-width: 1024px) 600px, 92vw',
  alt: 'Scene',
  width: 1600,
  height: 1400,
  prompt: '',
}

describe('ImageSlot responsive candidates', () => {
  it('passes srcSet and the default sizes to the image', () => {
    render(<ImageSlot image={withVariants} />)

    const image = screen.getByRole('img', { name: 'Scene' })
    expect(image).toHaveAttribute('srcset', withVariants.srcSet)
    expect(image).toHaveAttribute('sizes', withVariants.sizes)
    expect(image).toHaveAttribute('width', '1600')
    expect(image).toHaveAttribute('height', '1400')
  })

  it('lets a slot override sizes when it renders narrower', () => {
    render(<ImageSlot image={withVariants} sizes="240px" />)

    expect(screen.getByRole('img', { name: 'Scene' })).toHaveAttribute('sizes', '240px')
  })

  it('omits sizes without a srcSet so the single file keeps its natural behaviour', () => {
    render(<ImageSlot image={{ ...withVariants, srcSet: undefined }} sizes="240px" />)

    const image = screen.getByRole('img', { name: 'Scene' })
    expect(image).not.toHaveAttribute('srcset')
    expect(image).not.toHaveAttribute('sizes')
  })

  it('keeps fetchpriority high only for the priority image', () => {
    const { rerender } = render(<ImageSlot image={withVariants} priority />)

    expect(screen.getByRole('img', { name: 'Scene' })).toHaveAttribute('fetchpriority', 'high')
    expect(screen.getByRole('img', { name: 'Scene' })).toHaveAttribute('loading', 'eager')

    rerender(<ImageSlot image={withVariants} />)

    expect(screen.getByRole('img', { name: 'Scene' })).toHaveAttribute('loading', 'lazy')
  })

  it('ships an 800w variant for every landing illustration', () => {
    for (const image of Object.values(landingImages)) {
      expect(image.srcSet).toMatch(/-800\.webp 800w, \/landing\/.+\.webp \d+w$/)
      expect(image.sizes).toBeTruthy()
    }
  })
})

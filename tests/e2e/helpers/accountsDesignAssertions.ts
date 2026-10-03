import { expect, type Page } from '@playwright/test'

// Resolve actual rendered sRGB colors, including alpha-composited nested surfaces.
export async function accountsContrastAudit(page: Page) {
  return page.locator('.accounts-design, .accounts-modal').evaluateAll(roots => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((value, index) => index === 3 ? value / 255 : value)
    }
    const blend = (a: number[], b: number[]) => a.slice(0, 3).map((value, index) => value * a[3] + b[index] * (1 - a[3])).concat(1)
    const luminance = (color: number[]) => color.slice(0, 3).map(value => {
      const v = value / 255
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const ratio = (a: number[], b: number[]) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
    const background = (element: Element) => {
      const ancestors: Element[] = []
      let current: Element | null = element
      while (current) { ancestors.unshift(current); current = current.parentElement }
      return ancestors.reduce((bg, ancestor) => blend(rgba(getComputedStyle(ancestor).backgroundColor), bg), [255, 255, 255, 1])
    }
    const samples: { name: string; ratio: number; minimum: number; foreground: string; background: number[] }[] = []
    const add = (element: Element, name: string, color: string, minimum = 4.5, bg = background(element)) => {
      samples.push({ name, ratio: ratio(blend(rgba(color), bg), bg), minimum, foreground: color, background: bg })
    }
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const element = node.parentElement!
        if (!node.textContent?.trim() || !element.getClientRects().length || element.closest('[aria-hidden="true"], [data-account-artwork], :disabled, option, .sr-only')) continue
        const style = getComputedStyle(element)
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)
        add(element, node.textContent.trim(), style.color, large ? 3 : 4.5)
      }
      for (const input of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')) {
        if (!input.getClientRects().length || input.disabled) continue
        const style = getComputedStyle(input)
        add(input, input.id || input.tagName, style.color)
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) add(input, `${input.id || input.tagName} ${side.toLowerCase()} border`, style[`border${side}Color`], 3)
        if (input instanceof HTMLInputElement && input.placeholder) add(input, `${input.id || input.tagName} placeholder`, getComputedStyle(input, '::placeholder').color)
      }
      for (const control of root.querySelectorAll('button, input, select')) {
        const style = getComputedStyle(control)
        if (!control.getClientRects().length || style.outlineStyle === 'none') continue
        add(control, `${control.getAttribute('aria-label') || control.id || control.textContent?.trim()} focus`, style.outlineColor, 3, background(control.parentElement!))
      }
    }
    return { samples, failures: samples.filter(sample => sample.ratio < sample.minimum) }
  })
}


export async function accountsGeometry(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  const failures = await page.locator('.accounts-design section, .accounts-design article, .accounts-design input, .accounts-design button, .accounts-design [data-account-balance], .accounts-modal, .accounts-modal .modal-body, .accounts-modal form, .accounts-modal input, .accounts-modal select, .accounts-modal button, [data-account-colors]').evaluateAll(elements => elements.filter(element => {
    if (!element.getClientRects().length || element.closest('[data-account-artwork]')) return false
    const box = element.getBoundingClientRect()
    return (!(element instanceof HTMLInputElement) && element.scrollWidth > element.clientWidth + 1) || box.left < 0 || box.right > innerWidth + 1
  }).map(element => element.tagName + ': ' + element.textContent?.slice(0, 70)))
  expect(failures).toEqual([])
}

export async function colorsGeometry(page: Page) {
  const failures = await page.locator('[data-account-colors]').evaluateAll(grids => grids.flatMap(grid => {
    const boundary = grid.getBoundingClientRect()
    const boxes = Array.from(grid.querySelectorAll('button')).map(button => button.getBoundingClientRect())
    return boxes.flatMap((box, index) => {
      const errors: string[] = []
      if (box.width < 44 || box.height < 44 || box.left < boundary.left - .5 || box.right > boundary.right + .5) errors.push('invalid bounds ' + index)
      for (const other of boxes.slice(index + 1)) {
        if (box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top) errors.push('overlap ' + index)
      }
      return errors
    })
  }))
  expect(failures).toEqual([])
}

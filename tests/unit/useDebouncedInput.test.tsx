import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedInput } from '@/hooks/useDebouncedInput'

describe('useDebouncedInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates the draft immediately but commits once after the pause', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedInput('', onCommit, 250))

    act(() => result.current[1]('c'))
    act(() => result.current[1]('co'))
    act(() => result.current[1]('cof'))
    expect(result.current[0]).toBe('cof')
    expect(onCommit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(249)
    })
    expect(onCommit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('cof')
  })

  it('restarts the wait on every keystroke', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDebouncedInput('', onCommit, 250))

    act(() => result.current[1]('a'))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    act(() => result.current[1]('ab'))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onCommit).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(onCommit).toHaveBeenCalledWith('ab')
  })

  it('follows an external value change such as browser back', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedInput(value, vi.fn(), 250),
      { initialProps: { value: 'coffee' } },
    )
    expect(result.current[0]).toBe('coffee')

    rerender({ value: '' })
    expect(result.current[0]).toBe('')
  })

  it('does not commit after unmount', () => {
    const onCommit = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedInput('', onCommit, 250))

    act(() => result.current[1]('late'))
    unmount()
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('always commits with the latest callback', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onCommit }) => useDebouncedInput('', onCommit, 250),
      { initialProps: { onCommit: first } },
    )

    act(() => result.current[1]('x'))
    rerender({ onCommit: second })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('x')
  })
})

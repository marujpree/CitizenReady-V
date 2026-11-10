import { describe, expect, it } from 'vitest'
import { questionCountFor } from './format.js'

describe('questionCountFor', () => {
  it('uses the real interview length for a mock test', () => {
    expect(questionCountFor('mock_test', 2008, undefined, 100)).toBe(10)
    expect(questionCountFor('mock_test', 2025, undefined, 128)).toBe(20)
  })

  it('ignores a client-sent count for a mock test', () => {
    expect(questionCountFor('mock_test', 2025, 3, 128)).toBe(20)
  })

  it('asks 10 questions in a 65/20 mock test for either version', () => {
    expect(questionCountFor('mock_test', 2008, undefined, 20, true)).toBe(10)
    expect(questionCountFor('mock_test', 2025, undefined, 20, true)).toBe(10)
  })

  it('falls back to the 2025 format for an unknown version', () => {
    expect(questionCountFor('mock_test', 1999, undefined, 10)).toBe(20)
  })

  it('defaults a practice exam to 20 and honors a requested count', () => {
    expect(questionCountFor('practice_exam', 2025, undefined, 128)).toBe(20)
    expect(questionCountFor('practice_exam', 2025, 15, 128)).toBe(15)
  })

  it('covers the whole topic unless a count is given', () => {
    expect(questionCountFor('category', 2025, undefined, 39)).toBe(39)
    expect(questionCountFor('category', 2025, 5, 39)).toBe(5)
  })
})

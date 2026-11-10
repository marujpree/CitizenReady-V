import { describe, expect, it } from 'vitest'
import { expandOptional, gradeAnswer, tokenize } from './grade.js'

const q = (accepted_answers: string[], required_count = 1) => ({ accepted_answers, required_count })

const constitution = q(['(U.S.) Constitution'])
const justices = q(['Nine (9)'])
const oneHundred = q(['One hundred (100)'])
const twoIdeas = q(
  ['Equality', 'Liberty', 'Social contract', 'Natural rights', 'Limited government', 'Self-government'],
  2,
)
const originalStates = q(
  ['New Hampshire', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New York', 'New Jersey', 'Virginia'],
  5,
)
const holidays = q(
  ['New Year’s Day', 'Martin Luther King, Jr. Day', 'Presidents Day (Washington’s Birthday)', 'Memorial Day', 'Juneteenth'],
  3,
)
const amendment = q(['14th Amendment'])

describe('tokenize', () => {
  it('lowercases, strips punctuation and articles', () => {
    expect(tokenize('The U.S. Constitution!')).toEqual(['us', 'constitution'])
  })
  it('turns number words into digits', () => {
    expect(tokenize('Twenty-seven')).toEqual(['27'])
    expect(tokenize('four hundred thirty five')).toEqual(['435'])
    expect(tokenize('one hundred and one')).toEqual(['101'])
  })
  it('handles curly apostrophes', () => {
    expect(tokenize('New Year’s Day')).toEqual(tokenize("new year's day"))
  })
})

describe('expandOptional', () => {
  it('returns the answer with and without bracketed text', () => {
    expect(expandOptional('(U.S.) Constitution').map((s) => s.trim())).toEqual(
      expect.arrayContaining(['(U.S.) Constitution'.replace(/[()]/g, ''), 'Constitution']),
    )
  })
})

describe('gradeAnswer: one answer', () => {
  it('accepts the exact answer', () => {
    expect(gradeAnswer('Constitution', constitution).isCorrect).toBe(true)
  })
  it('accepts the optional words too', () => {
    expect(gradeAnswer('the U.S. Constitution', constitution).isCorrect).toBe(true)
  })
  it('ignores case and punctuation', () => {
    expect(gradeAnswer('  CONSTITUTION!! ', constitution).isCorrect).toBe(true)
  })
  it('finds the answer inside a sentence', () => {
    expect(gradeAnswer('I think it is the Constitution', constitution).isCorrect).toBe(true)
  })
  it('forgives a small typo on a long word', () => {
    expect(gradeAnswer('Constituion', constitution).isCorrect).toBe(true)
  })
  it('rejects a wrong answer', () => {
    expect(gradeAnswer('The Bill of Rights', constitution).isCorrect).toBe(false)
  })
  it('rejects empty and one-letter answers', () => {
    expect(gradeAnswer('', constitution).isCorrect).toBe(false)
    expect(gradeAnswer('c', constitution).isCorrect).toBe(false)
    expect(gradeAnswer('!!!', constitution).isCorrect).toBe(false)
  })
  it('rejects an answer that negates the right words', () => {
    expect(gradeAnswer('It is not the Constitution', constitution).isCorrect).toBe(false)
  })
})

describe('gradeAnswer: numbers', () => {
  it('accepts the number as a word or a digit', () => {
    expect(gradeAnswer('nine', justices).isCorrect).toBe(true)
    expect(gradeAnswer('9', justices).isCorrect).toBe(true)
    expect(gradeAnswer('Nine (9)', justices).isCorrect).toBe(true)
  })
  it('rejects a different number', () => {
    expect(gradeAnswer('seven', justices).isCorrect).toBe(false)
    expect(gradeAnswer('8', justices).isCorrect).toBe(false)
  })
  it('handles compound numbers', () => {
    expect(gradeAnswer('one hundred', oneHundred).isCorrect).toBe(true)
    expect(gradeAnswer('100', oneHundred).isCorrect).toBe(true)
    expect(gradeAnswer('ninety', oneHundred).isCorrect).toBe(false)
  })
  it('never forgives a typo in a number', () => {
    expect(gradeAnswer('15th amendment', amendment).isCorrect).toBe(false)
    expect(gradeAnswer('14th amendment', amendment).isCorrect).toBe(true)
  })
})

describe('gradeAnswer: several answers', () => {
  it('needs the required number of different answers', () => {
    expect(gradeAnswer('Liberty', twoIdeas).isCorrect).toBe(false)
    expect(gradeAnswer('Liberty and equality', twoIdeas).isCorrect).toBe(true)
    expect(gradeAnswer('liberty, natural rights', twoIdeas).isCorrect).toBe(true)
  })
  it('does not count the same answer twice', () => {
    expect(gradeAnswer('liberty, liberty', twoIdeas).isCorrect).toBe(false)
  })
  it('does not count a wrong answer', () => {
    expect(gradeAnswer('liberty and pizza', twoIdeas).isCorrect).toBe(false)
  })
  it('handles five original states', () => {
    expect(
      gradeAnswer('New York, New Jersey, Virginia, Connecticut, Massachusetts', originalStates).isCorrect,
    ).toBe(true)
    expect(gradeAnswer('New York, New Jersey, Virginia, Texas, Ohio', originalStates).isCorrect).toBe(false)
  })
  it('handles accepted answers that contain a comma', () => {
    expect(gradeAnswer('Memorial Day, Juneteenth and Martin Luther King Jr Day', holidays).isCorrect).toBe(true)
    expect(gradeAnswer('Memorial Day, Juneteenth', holidays).isCorrect).toBe(false)
  })
})

describe('gradeAnswer: long answers', () => {
  const reason = q(['(Because there is) one star for each state', '(Because) each star represents a state'])
  it('matches on the key words', () => {
    expect(gradeAnswer('each star is for one state', reason).isCorrect).toBe(true)
  })
  it('rejects unrelated text', () => {
    expect(gradeAnswer('because it looks nice', reason).isCorrect).toBe(false)
  })
})

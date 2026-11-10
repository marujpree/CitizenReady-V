import { describe, expect, it } from 'vitest'
import { SEED_SENTENCES } from './sentences.js'
import { findUnknownWords, isFunctionWord, tokenize, VOCAB } from './vocab.js'

const reading = SEED_SENTENCES.filter((s) => s.test === 'reading')
const writing = SEED_SENTENCES.filter((s) => s.test === 'writing')

describe('vocabulary helpers', () => {
  it('splits text into lowercase words without punctuation', () => {
    expect(tokenize('Washington, D.C.')).toEqual(['washington', 'dc'])
    expect(tokenize('Presidents’ Day')).toEqual(['presidents', 'day'])
    expect(tokenize('Who was the first President?')).toEqual(['who', 'was', 'the', 'first', 'president'])
  })

  it('accepts words from the list and whole phrases', () => {
    expect(findUnknownWords('reading', 'Who is the Father of Our Country?')).toEqual([])
    expect(findUnknownWords('writing', 'Congress meets in Washington, D.C.')).toEqual([])
  })

  it('flags words that are not on the list', () => {
    expect(findUnknownWords('reading', 'Who is the Vice President?')).toEqual(['vice'])
    // "our" is only allowed inside "Father of Our Country".
    expect(findUnknownWords('reading', 'What is our flag?')).toEqual(['our', 'flag'])
  })

  it('keeps the reading and writing lists separate', () => {
    // "citizens" is a writing word; reading only has "citizen".
    expect(findUnknownWords('writing', 'Citizens can vote.')).toEqual([])
    expect(findUnknownWords('reading', 'Citizens can vote.')).toEqual(['citizens'])
  })

  it('knows the function words that may be skipped', () => {
    expect(VOCAB.reading.function).toHaveLength(9)
    expect(isFunctionWord('reading', 'the')).toBe(true)
    expect(isFunctionWord('reading', 'president')).toBe(false)
    // "and" and "during" are function words for writing only.
    expect(isFunctionWord('writing', 'and')).toBe(true)
    expect(isFunctionWord('reading', 'and')).toBe(false)
  })
})

describe('sentence bank', () => {
  it('has enough sentences for several practice rounds of three', () => {
    expect(reading.length).toBeGreaterThanOrEqual(15)
    expect(writing.length).toBeGreaterThanOrEqual(20)
  })

  it('uses only official vocabulary words', () => {
    for (const s of SEED_SENTENCES) {
      expect(findUnknownWords(s.test, s.text), `${s.id}: ${s.text}`).toEqual([])
    }
  })

  it('has unique ids and unique sentences', () => {
    expect(new Set(SEED_SENTENCES.map((s) => s.id)).size).toBe(SEED_SENTENCES.length)
    expect(new Set(SEED_SENTENCES.map((s) => s.text)).size).toBe(SEED_SENTENCES.length)
  })

  it('makes every reading sentence a question that starts with a question word', () => {
    for (const s of reading) {
      expect(s.text, s.id).toMatch(/\?$/)
      expect(s.text, s.id).toMatch(/^(How|What|When|Where|Who|Why)\b/)
    }
  })

  it('makes every writing sentence a statement', () => {
    for (const s of writing) expect(s.text, s.id).toMatch(/\.$/)
  })
})

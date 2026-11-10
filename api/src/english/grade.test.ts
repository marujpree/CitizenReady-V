import { describe, expect, it } from 'vitest'
import { gradeReading, gradeWriting } from './grade.js'
import { SEED_SENTENCES } from './sentences.js'
import { comparableWords, editDistance } from './match.js'

describe('word matching', () => {
  it('counts single-letter edits', () => {
    expect(editDistance('capital', 'capitol')).toBe(1)
    expect(editDistance('vote', 'boat')).toBe(3)
    expect(editDistance('right', 'rigth')).toBe(1) // two neighbors swapped
    expect(editDistance('same', 'same')).toBe(0)
  })

  it('treats spelled-out and written numbers the same, and joins spaced letters', () => {
    expect(comparableWords('fifty states')).toEqual(['50', 'states'])
    expect(comparableWords('one hundred Senators')).toEqual(['100', 'senators'])
    expect(comparableWords('Washington, D. C.')).toEqual(['washington', 'dc'])
  })
})

describe('gradeReading', () => {
  const q = 'Who lives in the White House?'

  it('passes the sentence read correctly, ignoring capitals and punctuation', () => {
    expect(gradeReading(q, 'who lives in the white house').passed).toBe(true)
  })

  it('passes when a short function word is skipped', () => {
    expect(gradeReading(q, 'Who lives the White House').passed).toBe(true)
    expect(gradeReading('What is the capital of the United States?', 'What is capital of United States').passed).toBe(true)
  })

  it('forgives small differences that come from an accent', () => {
    expect(gradeReading(q, 'Who lives in de White House').passed).toBe(true)
    expect(gradeReading('What is the capital of the United States?', 'What is the capitol of the United States').passed).toBe(true)
  })

  it('fails when a content word is left out', () => {
    const r = gradeReading(q, 'Who lives in the House')
    expect(r.passed).toBe(false)
    expect(r.missing).toEqual(['white'])
  })

  it('fails when a content word is replaced by another word', () => {
    const r = gradeReading('Who was Abraham Lincoln?', 'Who is Abraham Lincoln')
    expect(r.passed).toBe(false)
    expect(r.missing).toEqual(['was'])
    // "who" and "how" are different words, even though they are one letter apart.
    expect(gradeReading('Who was Abraham Lincoln?', 'How was Abraham Lincoln').passed).toBe(false)
  })

  it('allows a filler word or two but not a pile of extra words', () => {
    expect(gradeReading('Who was George Washington?', 'uh who was uh George Washington').passed).toBe(true)
    expect(gradeReading('Who was George Washington?', 'Who was George Washington and he was first').passed).toBe(false)
  })

  it('fails when nothing was heard', () => {
    const r = gradeReading(q, '   ')
    expect(r.passed).toBe(false)
    expect(r.note).toMatch(/did not hear/)
  })

  it('requires the content words in order', () => {
    expect(gradeReading('Who was Abraham Lincoln?', 'Lincoln Abraham was who').passed).toBe(false)
  })
})

describe('gradeWriting', () => {
  const s = 'Citizens have the right to vote.'

  it('passes the sentence written correctly, ignoring capitals and punctuation', () => {
    expect(gradeWriting(s, 'citizens have the right to vote').passed).toBe(true)
  })

  it('passes when short words are left out', () => {
    expect(gradeWriting(s, 'Citizens have right vote').passed).toBe(true)
  })

  it('forgives spelling slips that do not hide the meaning', () => {
    expect(gradeWriting(s, 'Citizens have the rigt to vote').passed).toBe(true)
    expect(gradeWriting(s, 'Citizens have the rigth to vote').passed).toBe(true)
    expect(gradeWriting('Independence Day is in July.', 'Independance Day is in July').passed).toBe(true)
  })

  it('accepts numbers as digits or words', () => {
    expect(gradeWriting('The United States has fifty states.', 'The United States has 50 states').passed).toBe(true)
    expect(gradeWriting('The United States has 50 states.', 'The United States has fifty states').passed).toBe(true)
  })

  it('accepts Presidents’ Day with or without the apostrophe', () => {
    expect(gradeWriting('Presidents’ Day is in February.', 'Presidents Day is in February').passed).toBe(true)
  })

  it('accepts Washington, D.C. however it is typed', () => {
    const t = 'Congress meets in Washington, D.C.'
    expect(gradeWriting(t, 'Congress meets in Washington DC').passed).toBe(true)
    expect(gradeWriting(t, 'congress meets in washington d.c.').passed).toBe(true)
  })

  it('does not accept a different word that merely sounds close', () => {
    expect(gradeWriting(s, 'Citizens have the rite to vote').passed).toBe(false)
  })

  it('fails on nothing, or only one or two words', () => {
    expect(gradeWriting(s, '').passed).toBe(false)
    expect(gradeWriting(s, 'Citizens').passed).toBe(false)
    expect(gradeWriting(s, 'Citizens vote').passed).toBe(false)
  })

  it('fails on a different sentence', () => {
    expect(gradeWriting(s, 'We pay taxes').passed).toBe(false)
  })

  it('fails and explains when a word is abbreviated', () => {
    const r = gradeWriting('The President lives in the White House.', 'The Pres. lives in the White House')
    expect(r.passed).toBe(false)
    expect(r.missing).toEqual(['president'])
    expect(r.note).toMatch(/abbreviate/)
  })

  it('fails when a content word is missing', () => {
    expect(gradeWriting('Lincoln was the President during the Civil War.', 'Lincoln was the President during the war').passed).toBe(false)
  })
})

describe('sentence bank', () => {
  it('can be passed: every sentence passes its own grader when given exactly', () => {
    for (const { id, test, text } of SEED_SENTENCES) {
      const grade = test === 'reading' ? gradeReading(text, text) : gradeWriting(text, text)
      expect(grade.passed, `${id}: ${text}`).toBe(true)
    }
  })

  it('reads and writes back the same without punctuation or capitals', () => {
    for (const { id, test, text } of SEED_SENTENCES) {
      const plain = text.toLowerCase().replace(/[.,?]/g, '')
      const grade = test === 'reading' ? gradeReading(text, plain) : gradeWriting(text, plain)
      expect(grade.passed, `${id}: ${plain}`).toBe(true)
    }
  })
})

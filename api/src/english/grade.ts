// Grades one reading or writing sentence by the USCIS scoring guidelines.
// An applicant passes a test by getting ONE of up to three sentences right, so these
// functions grade a single sentence; the caller stops at the first pass.
import { align } from './match.js'

export type EnglishGrade = {
  passed: boolean
  missing: string[] // content words that were left out or replaced
  heard: string // what we are comparing, cleaned up, so the screen can show it
  note?: string
}

const MAX_READING_EXTRA = 2 // a filler word or two ("uh") is fine

// READING. Pass: every content word is read, short function words may be skipped, small
// pronunciation differences are fine. Fail: a content word is left out or replaced.
// `heardText` is what speech-to-text heard, so spelling slips from accents are tolerated.
export function gradeReading(sentence: string, heardText: string): EnglishGrade {
  const a = align('reading', sentence, heardText)
  const heard = a.heard.join(' ')
  if (a.heard.length === 0) {
    return { passed: false, missing: [], heard, note: 'We did not hear anything.' }
  }
  if (a.missing.length > 0) return { passed: false, missing: a.missing, heard }
  if (a.extra > MAX_READING_EXTRA) {
    return { passed: false, missing: [], heard, note: 'Read only the sentence on the screen.' }
  }
  return { passed: true, missing: [], heard }
}

// WRITING. Pass: same general meaning as the dictated sentence. Spelling, capitalization
// and punctuation slips are fine, short words may be left out, numbers may be digits or
// words. Fail: nothing or one or two words, a different sentence, or an abbreviated word.
export function gradeWriting(sentence: string, typed: string): EnglishGrade {
  const a = align('writing', sentence, typed)
  const heard = a.heard.join(' ')
  if (a.heard.length === 0) {
    return { passed: false, missing: [], heard, note: 'Write the sentence you heard.' }
  }
  if (a.missing.length > 0) {
    // A typed word that is the start of a missing word is an abbreviation ("pres" for "president").
    const abbreviated = a.missing.some((word) =>
      a.heard.some((w) => w.length >= 2 && w.length < word.length && word.startsWith(w)),
    )
    return {
      passed: false,
      missing: a.missing,
      heard,
      note: abbreviated ? 'Write every word in full. Do not abbreviate.' : undefined,
    }
  }
  const maxExtra = Math.max(3, Math.ceil(a.matched / 2))
  if (a.extra > maxExtra) {
    return { passed: false, missing: [], heard, note: 'Write only the sentence you heard.' }
  }
  return { passed: true, missing: [], heard }
}

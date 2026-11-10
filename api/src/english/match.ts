// Word matching helpers shared by the reading and writing graders.
import { isFunctionWord, tokenize, type EnglishTest } from './vocab.js'

// How many letters can differ and still count as the same word.
// Short words must be exact ("who" is not "how"); longer words forgive a slip or an accent.
export function allowedDistance(test: EnglishTest, word: string): number {
  if (word.length <= 3) return 0
  if (test === 'reading') return word.length <= 6 ? 1 : 2
  return word.length <= 5 ? 1 : 2
}

// Number of single-letter edits (insert, delete, change, or swap two neighbors) between
// two words. A swap such as "rigth" for "right" is the most common typing slip, so it
// counts as one edit.
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array<number>(b.length).fill(0),
  ])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

export function wordsMatch(test: EnglishTest, expected: string, heard: string): boolean {
  return editDistance(expected, heard) <= allowedDistance(test, expected)
}

// Words for comparing: numbers are the same whether spelled out or written as digits
// ("fifty" and "50"), and letters spaced apart are joined ("d c" is "dc", as in D.C.).
export function comparableWords(text: string): string[] {
  const words = tokenize(text)
  const out: string[] = []
  for (let i = 0; i < words.length; i++) {
    if (words[i] === 'one' && words[i + 1] === 'hundred') {
      out.push('100')
      i++
    } else if (words[i] === 'fifty') {
      out.push('50')
    } else if (words[i].length === 1 && words[i + 1]?.length === 1) {
      let joined = words[i]
      while (words[i + 1]?.length === 1) joined += words[++i]
      out.push(joined)
    } else {
      out.push(words[i])
    }
  }
  return out
}

export type Alignment = {
  missing: string[] // content words that were not found, in order
  matched: number
  extra: number // words said or written that are not in the sentence
  heard: string[]
}

// Walks the sentence word by word and looks for each one, in order, in what the person
// said or wrote. Short function words may be skipped; content words may not.
export function align(test: EnglishTest, sentence: string, answer: string): Alignment {
  const target = comparableWords(sentence)
  const heard = comparableWords(answer)
  const missing: string[] = []
  let position = 0
  let matched = 0
  for (const word of target) {
    let found = -1
    for (let j = position; j < heard.length; j++) {
      if (wordsMatch(test, word, heard[j])) {
        found = j
        break
      }
    }
    if (found >= 0) {
      position = found + 1
      matched++
    } else if (!isFunctionWord(test, word)) {
      missing.push(word)
    }
  }
  return { missing, matched, extra: Math.max(0, heard.length - matched), heard }
}

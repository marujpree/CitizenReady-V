// Rule-based grading for the civics test. No AI, no network, no cost.
//
// The USCIS answer lists use a few conventions we have to respect:
//   - text in (parentheses) is optional: "(U.S.) Constitution"
//   - numbers come as words and digits: "Nine (9)"
//   - "Name two ..." questions accept ANY two of the listed answers
//
// How a typed answer is graded:
//   1. Normalize both sides: lowercase, no accents or punctuation, no a/an/the,
//      number words turned into digits ("twenty seven" -> "27").
//   2. An accepted answer matches when its words appear in the typed answer,
//      allowing a small typo on longer words. So "I think it's the
//      Constitution" passes, and so does "Constituion".
//   3. Long sentence-style answers also match when most of their key words appear.
//   4. The answer is correct when at least `required_count` different accepted
//      answers matched. One stretch of typed words can only satisfy one answer.

const STOP_WORDS = new Set(['a', 'an', 'the'])

// Words that carry no meaning on their own, ignored when scoring long answers.
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'and', 'for', 'is', 'are', 'was', 'were', 'by',
  'with', 'that', 'because', 'there', 'it', 'its', 'at', 'as', 'from', 'be', 'or',
])

const NEGATIONS = new Set(['not', 'no', 'never', 'dont', 'didnt', 'isnt', 'wasnt', 'cant', 'cannot'])

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
}
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

function isNumberWord(token: string): boolean {
  return token in UNITS || token in TENS || token === 'hundred' || token === 'thousand'
}

// Replaces runs of number words with digits: ["four","hundred","thirty","five"] -> ["435"].
function numberWordsToDigits(tokens: string[]): string[] {
  const out: string[] = []
  let i = 0
  while (i < tokens.length) {
    if (!isNumberWord(tokens[i])) {
      out.push(tokens[i])
      i++
      continue
    }
    let total = 0
    let current = 0
    while (i < tokens.length) {
      const t = tokens[i]
      if (t in UNITS) current += UNITS[t]
      else if (t in TENS) current += TENS[t]
      else if (t === 'hundred') current = (current || 1) * 100
      else if (t === 'thousand') {
        total += (current || 1) * 1000
        current = 0
      } else if (t === 'and' && i + 1 < tokens.length && isNumberWord(tokens[i + 1]) && total + current > 0) {
        // "one hundred and one"
      } else break
      i++
    }
    out.push(String(total + current))
  }
  return out
}

export function tokenize(text: string): string[] {
  const cleaned = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’‘`“”".]/g, '') // "U.S." -> "us", "Washington's" -> "washingtons"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (!cleaned) return []
  const tokens = numberWordsToDigits(cleaned.split(' '))
  return tokens.filter((t) => !STOP_WORDS.has(t))
}

// "(U.S.) Constitution" -> ["(U.S.) Constitution" without brackets, and with the
// bracketed words removed]. Capped so a strange entry cannot blow up.
export function expandOptional(answer: string): string[] {
  const parts = answer.split(/(\([^)]*\))/)
  let variants: string[] = ['']
  for (const part of parts) {
    if (part.startsWith('(') && part.endsWith(')')) {
      const inner = part.slice(1, -1)
      variants = variants.flatMap((v) => [v + ' ' + inner, v])
    } else {
      variants = variants.map((v) => v + part)
    }
    if (variants.length > 8) variants = variants.slice(0, 8)
  }
  return [...new Set(variants)]
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return prev[b.length]
}

// How many typos are fine for a phrase. Short words and anything with a digit
// must be exact, so "26th" never passes for "27th".
function allowedTypos(phrase: string): number {
  if (/\d/.test(phrase)) return 0
  if (phrase.length < 5) return 0
  if (phrase.length <= 8) return 1
  return 2
}

function phraseMatches(typed: string, wanted: string): boolean {
  return typed === wanted || editDistance(typed, wanted) <= allowedTypos(wanted)
}

export type GradableQuestion = {
  accepted_answers: string[]
  required_count: number
}

export type GradeResult = {
  isCorrect: boolean
  matched: number
}

export function gradeAnswer(typedAnswer: string, question: GradableQuestion): GradeResult {
  const typed = tokenize(typedAnswer)
  const required = Math.max(1, question.required_count)

  if (typed.length === 0) return { isCorrect: false, matched: 0 }

  const entries = question.accepted_answers.map((answer) =>
    expandOptional(answer)
      .map((variant) => tokenize(variant))
      .filter((tokens) => tokens.length > 0),
  )

  // "It is not the Constitution" must not pass because it contains the Constitution.
  const typedNegated = typed.some((t) => NEGATIONS.has(t))
  const mentionsNegation = (idx: number) =>
    entries[idx].some((variant) => variant.some((t) => NEGATIONS.has(t)))

  const consumed = new Array<boolean>(typed.length).fill(false)
  const matched = new Set<number>()

  // Pass 1: the accepted answer's words appear in the typed words, in order.
  // Longest first, so a long answer claims its words before a shorter one inside it.
  const candidates = entries
    .flatMap((variants, idx) => variants.map((tokens) => ({ idx, tokens })))
    .sort((a, b) => b.tokens.length - a.tokens.length)

  for (const { idx, tokens } of candidates) {
    if (matched.has(idx)) continue
    if (typedNegated && !mentionsNegation(idx)) continue
    const wanted = tokens.join(' ')
    for (let start = 0; start + tokens.length <= typed.length; start++) {
      const end = start + tokens.length
      if (consumed.slice(start, end).some(Boolean)) continue
      if (phraseMatches(typed.slice(start, end).join(' '), wanted)) {
        for (let k = start; k < end; k++) consumed[k] = true
        matched.add(idx)
        break
      }
    }
  }

  // Pass 2: long sentence-style answers match on their key words.
  if (matched.size < required) {
    const free = new Set(typed.filter((_, i) => !consumed[i]))
    entries.forEach((variants, idx) => {
      if (matched.has(idx) || (typedNegated && !mentionsNegation(idx))) return
      for (const tokens of variants) {
        const key = tokens.filter((t) => !FILLER_WORDS.has(t))
        if (key.length < 4) continue
        const hits = key.filter((t) => free.has(t)).length
        if (hits / key.length >= 0.75) {
          matched.add(idx)
          return
        }
      }
    })
  }

  return { isCorrect: matched.size >= required, matched: matched.size }
}

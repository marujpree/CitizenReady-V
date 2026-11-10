// Official vocabulary for the English part of the naturalization test (USCIS M-1178).
// Reading and writing have different lists, so keep them separate.
// "function" words are the short words an applicant may skip while reading aloud.
// Everything else is a "content" word and must be read correctly.
// Entries written "state/states" in the USCIS lists are listed as separate entries here.
export type EnglishTest = 'reading' | 'writing'

type Vocab = { function: string[]; content: string[] }

const READING: Vocab = {
  function: ['a', 'for', 'here', 'in', 'of', 'on', 'the', 'to', 'we'],
  content: [
    // People
    'Abraham Lincoln', 'George Washington',
    // Civics
    'American flag', 'Bill of Rights', 'capital', 'citizen', 'city', 'Congress', 'country',
    'Father of Our Country', 'government', 'President', 'right', 'Senators', 'state', 'states',
    'White House',
    // Places
    'America', 'United States', 'U.S.',
    // Holidays
    'Presidents’ Day', 'Memorial Day', 'Flag Day', 'Independence Day', 'Labor Day',
    'Columbus Day', 'Thanksgiving',
    // Question words
    'How', 'What', 'When', 'Where', 'Who', 'Why',
    // Verbs
    'can', 'come', 'do', 'does', 'elects', 'have', 'has', 'is', 'are', 'was', 'be', 'lives',
    'lived', 'meet', 'name', 'pay', 'vote', 'want',
    // Other (content)
    'colors', 'dollar bill', 'first', 'largest', 'many', 'most', 'north', 'one', 'people',
    'second', 'south',
  ],
}

const WRITING: Vocab = {
  function: ['and', 'during', 'for', 'here', 'in', 'of', 'on', 'the', 'to', 'we'],
  content: [
    // People
    'Adams', 'Lincoln', 'Washington',
    // Civics
    'American Indians', 'capital', 'citizens', 'Civil War', 'Congress', 'Father of Our Country',
    'flag', 'free', 'freedom of speech', 'President', 'right', 'Senators', 'state', 'states',
    'White House',
    // Places
    'Alaska', 'California', 'Canada', 'Delaware', 'Mexico', 'New York City', 'United States',
    'Washington, D.C.',
    // Months
    'February', 'May', 'June', 'July', 'September', 'October', 'November',
    // Holidays
    'Presidents’ Day', 'Memorial Day', 'Flag Day', 'Independence Day', 'Labor Day',
    'Columbus Day', 'Thanksgiving',
    // Verbs
    'can', 'come', 'elect', 'have', 'has', 'is', 'was', 'be', 'lives', 'lived', 'meets', 'pay',
    'vote', 'want',
    // Other (content)
    'blue', 'dollar bill', 'fifty', '50', 'first', 'largest', 'most', 'north', 'one',
    'one hundred', '100', 'people', 'red', 'second', 'south', 'taxes', 'white',
  ],
}

export const VOCAB: Record<EnglishTest, Vocab> = { reading: READING, writing: WRITING }

// Lowercase, no punctuation or apostrophes, split into words.
// "Washington, D.C." becomes ["washington", "dc"]; "Presidents’ Day" becomes ["presidents", "day"].
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

// Is this one word a short function word the applicant may skip?
export function isFunctionWord(test: EnglishTest, word: string): boolean {
  return VOCAB[test].function.some((entry) => tokenize(entry)[0] === word)
}

// Words in the sentence that are not in the official list for this test.
// Multi-word entries ("Father of Our Country") match as a whole phrase, so "our" on its
// own is not allowed. An empty result means the sentence uses only listed words.
export function findUnknownWords(test: EnglishTest, sentence: string): string[] {
  const entries = [...VOCAB[test].function, ...VOCAB[test].content]
    .map(tokenize)
    .sort((a, b) => b.length - a.length)
  const words = tokenize(sentence)
  const unknown: string[] = []
  let i = 0
  while (i < words.length) {
    const match = entries.find((entry) => entry.every((w, k) => words[i + k] === w))
    if (match) i += match.length
    else unknown.push(words[i++])
  }
  return unknown
}

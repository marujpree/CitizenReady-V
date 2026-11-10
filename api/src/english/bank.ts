// Reads the English test sentences from the database and keeps them in memory for a few
// minutes. The bank is tiny (about 60 rows) and rarely changes, so one load serves many
// requests instead of a Supabase query on every call. Admin edits show up after the TTL.
import { supabaseAdmin } from '../supabase.js'
import type { EnglishTest } from './vocab.js'

export type BankSentence = { id: string; test: EnglishTest; text: string }

const TTL_MS = 5 * 60_000

let cache: { loadedAt: number; sentences: BankSentence[] } | null = null
let inflight: Promise<BankSentence[]> | null = null

async function load(): Promise<BankSentence[]> {
  const { data, error } = await supabaseAdmin
    .from('english_test_sentences')
    .select('id, test_type, text')
    .eq('is_active', true)
  if (error || !data) throw new Error('Could not load English sentences')
  const sentences = data.map((row) => ({
    id: row.id as string,
    test: row.test_type as EnglishTest,
    text: row.text as string,
  }))
  cache = { loadedAt: Date.now(), sentences }
  return sentences
}

async function all(): Promise<BankSentence[]> {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache.sentences
  // Requests that arrive during a load share it instead of each querying Supabase.
  inflight ??= load().finally(() => {
    inflight = null
  })
  try {
    return await inflight
  } catch (e) {
    // Supabase is down: an old copy is better than failing the whole test.
    if (cache) return cache.sentences
    throw e
  }
}

export async function sentencesFor(test: EnglishTest): Promise<BankSentence[]> {
  return (await all()).filter((s) => s.test === test)
}

export async function findSentence(test: EnglishTest, id: string): Promise<BankSentence | undefined> {
  return (await sentencesFor(test)).find((s) => s.id === id)
}

// For tests only.
export function clearSentenceCache() {
  cache = null
  inflight = null
}

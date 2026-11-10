// supabase/seed_english.sql is generated from sentences.ts. This fails if someone edits
// one and forgets the other.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SEED_SENTENCES } from './sentences.js'

describe('seed_english.sql', () => {
  const sql = readFileSync(new URL('../../../supabase/seed_english.sql', import.meta.url), 'utf8')

  it('has a row for every sentence in sentences.ts', () => {
    for (const s of SEED_SENTENCES) {
      expect(sql).toContain(`('${s.test}', '${s.text.replaceAll("'", "''")}')`)
    }
  })

  it('has no extra rows', () => {
    const rows = sql.match(/^\s+\('(reading|writing)', /gm) ?? []
    expect(rows).toHaveLength(SEED_SENTENCES.length)
  })
})

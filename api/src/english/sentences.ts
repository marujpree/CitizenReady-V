// Starting sentences for the reading and writing tests. Every sentence uses only words from
// the official USCIS vocabulary lists (see vocab.ts); sentences.test.ts checks that.
//
// This file is the SEED for the english_test_sentences table. Once that table is loaded, the
// API reads sentences from the database, so later edits (for example by an admin) will not
// show up here. Do not rely on this file at runtime.
//
// Reading sentences are questions (the officer asks the applicant to read one aloud).
// Writing sentences are statements (the officer dictates one for the applicant to write).
import type { EnglishTest } from './vocab.js'

export type SeedSentence = { id: string; test: EnglishTest; text: string }

const reading = [
  'Who was George Washington?',
  'Who was Abraham Lincoln?',
  'Who lives in the White House?',
  'What is the capital of the United States?',
  'What is the largest city in the United States?',
  'Who elects the President?',
  'Who can vote in the United States?',
  'Where is the White House?',
  'When do we vote for the President?',
  'Who is the President of the United States?',
  'What are the colors of the American flag?',
  'What colors are on the American flag?',
  'What is the name of the President?',
  'Where does Congress meet?',
  'Who has the right to vote?',
  'What is the Bill of Rights?',
  'When is Independence Day?',
  'When is Thanksgiving?',
  'When is Flag Day?',
  'When is Labor Day?',
  'What is Memorial Day?',
  'Who is the Father of Our Country?',
  'Who was the first President?',
  'How many Senators are in Congress?',
  'Why do people want to be a citizen?',
  'What is the largest state?',
  'Where do people vote?',
]

const writing = [
  'Citizens have the right to vote.',
  'Citizens can vote.',
  'Washington is the Father of Our Country.',
  'Washington was the first President.',
  'Adams was the second President.',
  'Lincoln was the President during the Civil War.',
  'Congress meets in Washington, D.C.',
  'The President lives in the White House.',
  'The White House is in Washington, D.C.',
  'The capital of the United States is Washington, D.C.',
  'The flag is red, white, and blue.',
  'The American Indians lived here.',
  'We pay taxes.',
  'People vote for the President.',
  'We have freedom of speech.',
  'People can be free in the United States.',
  'The United States has fifty states.',
  'The United States has 50 states.',
  'Alaska is the largest state.',
  'Delaware was the first state.',
  'Canada is north of the United States.',
  'Mexico is south of the United States.',
  'Independence Day is in July.',
  'Thanksgiving is in November.',
  'Memorial Day is in May.',
  'Flag Day is in June.',
  'Labor Day is in September.',
  'Columbus Day is in October.',
  'Presidents’ Day is in February.',
  'People come to the United States for freedom of speech.',
]

const make = (test: EnglishTest, prefix: string, texts: string[]): SeedSentence[] =>
  texts.map((text, i) => ({ id: `${prefix}-${String(i + 1).padStart(3, '0')}`, test, text }))

export const SEED_SENTENCES: SeedSentence[] = [
  ...make('reading', 'r', reading),
  ...make('writing', 'w', writing),
]

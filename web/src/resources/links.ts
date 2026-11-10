// Official USCIS study material. We link to uscis.gov instead of copying files, so the
// documents stay current. Check these links now and then; USCIS can move or revise them.
import type { TestVersion } from '@/quiz/format'

export type ResourceLink = {
  title: string
  description: string
  href: string
  format: 'PDF' | 'Text' | 'Web page'
}

export type ResourceSection = {
  id: string
  title: string
  intro?: string
  // Set when the section belongs to one version of the test, so we can show "Your test".
  version?: TestVersion
  // True for the 65/20 section, so we can show "On for you" when the setting is on.
  special?: boolean
  links: ResourceLink[]
}

const Q = 'https://www.uscis.gov/sites/default/files/document/questions-and-answers'
const G = 'https://www.uscis.gov/sites/default/files/document/guides'

export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    id: 'civics-2025',
    title: '2025 civics test',
    intro: 'For applicants who filed Form N-400 on or after October 20, 2025. Up to 20 questions are asked and 12 must be right.',
    version: 2025,
    links: [
      {
        title: '128 Civics Questions and Answers (2025 version)',
        description: 'The official list of every question and accepted answer. Starred questions are the 65/20 ones.',
        href: `${Q}/2025-Civics-Test-128-Questions-and-Answers.pdf`,
        format: 'PDF',
      },
      {
        title: '2025 Civics Test',
        description: 'USCIS overview of the 2025 test and its study materials.',
        href: 'https://www.uscis.gov/citizenship-resource-center/naturalization-test-and-study-resources/2025-civics-test',
        format: 'Web page',
      },
    ],
  },
  {
    id: 'civics-2008',
    title: '2008 civics test',
    intro: 'For applicants who filed Form N-400 before October 20, 2025. 10 questions are asked and 6 must be right.',
    version: 2008,
    links: [
      {
        title: '100 Civics Questions and Answers (2008 version)',
        description: 'The official list of every question and accepted answer for the 2008 test.',
        href: `${Q}/100q.txt`,
        format: 'Text',
      },
    ],
  },
  {
    id: 'special',
    title: '65/20 special consideration',
    intro: 'If you are 65 or older and have been a permanent resident for 20 or more years, you study only the starred questions. 10 are asked and 6 must be right.',
    special: true,
    links: [
      {
        title: 'Civics Questions for the 65/20 Exemption',
        description: 'USCIS list of the questions for the 65/20 exemption.',
        href: `${Q}/65-20q.txt`,
        format: 'Text',
      },
    ],
  },
  {
    id: 'english',
    title: 'English reading and writing',
    intro: 'The reading and writing tests use only the words on these lists. You read one of up to three sentences aloud and write one of up to three sentences. The two lists are not the same.',
    links: [
      {
        title: 'Reading vocabulary list',
        description: 'Every word that can appear in the reading test.',
        href: `${Q}/reading_vocab.txt`,
        format: 'Text',
      },
      {
        title: 'Writing vocabulary list',
        description: 'Every word that can appear in the writing test.',
        href: `${Q}/writing_vocab.txt`,
        format: 'Text',
      },
      {
        title: 'Reading word strips',
        description: 'Printable word cards for practicing reading sentences.',
        href: `${G}/M-1178_Reading_Strips_E.pdf`,
        format: 'PDF',
      },
      {
        title: 'Writing word strips',
        description: 'Printable word cards for practicing writing sentences.',
        href: `${G}/M-1178_Writing_Strips_E.pdf`,
        format: 'PDF',
      },
    ],
  },
  {
    id: 'guides',
    title: 'Scoring, updates and guides',
    links: [
      {
        title: 'Check for test updates',
        description: 'Current answers that change with elections and appointments, such as the President and the Chief Justice. Check it before your interview.',
        href: 'https://www.uscis.gov/citizenship/testupdates',
        format: 'Web page',
      },
      {
        title: 'Scoring guidelines for the naturalization test',
        description: 'How officers score the reading, writing and civics tests. Its civics section describes the older 2008 format.',
        href: `${G}/Test_Scoring_Guidelines.pdf`,
        format: 'PDF',
      },
      {
        title: 'Pocket study guide (M-1780)',
        description: 'The 128 civics questions together with the reading and writing word lists.',
        href: `${G}/M_1780.pdf`,
        format: 'PDF',
      },
      {
        title: 'USCIS Citizenship Resource Center',
        description: 'Free official study tools, videos and practice tests.',
        href: 'https://www.uscis.gov/citizenship',
        format: 'Web page',
      },
    ],
  },
]

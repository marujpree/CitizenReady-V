import { FeedbackFragment, ProgressFragment, QuizFragment } from './fragments'

// The three things the app does, shown as pieces of the real screens.
export const steps = [
  {
    title: 'Answer like it is the real interview',
    text: 'The officer asks up to 20 questions out loud and you answer in your own words. We ask them the same way: pick a topic, take a 20-question practice exam, or run a full mock test.',
    fragment: <QuizFragment />,
  },
  {
    title: 'See the right answer right away',
    text: 'Every answer is checked against the official USCIS wording, and you see what was accepted. Questions you miss come back until they stick.',
    fragment: <FeedbackFragment />,
  },
  {
    title: 'Know when you are ready',
    text: 'Progress is tracked for each question and each topic, so you can see what you have mastered and what still needs work before your interview.',
    fragment: <ProgressFragment />,
  },
]


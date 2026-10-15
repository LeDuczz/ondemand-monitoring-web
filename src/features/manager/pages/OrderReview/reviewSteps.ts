export type ReviewStep = 1 | 2 | 3 | 4

/** Step metadata only; the labels live in ReviewStageStepper.messages. */
export const REVIEW_STEPS: Array<{
  number: number
  reviewStep?: ReviewStep
}> = [
  { number: 1, reviewStep: 1 },
  { number: 2, reviewStep: 2 },
  { number: 3, reviewStep: 3 },
  { number: 4, reviewStep: 4 },
  { number: 5 },
  { number: 6 },
  { number: 7 },
]

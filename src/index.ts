export type {
  CompoundingFrequency,
  ContributionFrequency,
  ContributionTiming,
  InvestmentCalculationError,
  InvestmentCalculationResult,
  InvestmentInput,
  InvestmentMilestone,
  InvestmentResult,
  YearProjection,
} from './types'
export {
  calculateCompoundInterest,
  calculateInvestment,
  findMilestones,
  getCompoundingPeriods,
  getContributionPeriods,
  requiredMonthlyContribution,
  ruleOf72,
  validateInput,
  yearsToReachTarget,
} from './calculator'

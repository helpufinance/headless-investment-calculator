export type CompoundingFrequency = 'annually' | 'semi-annually' | 'quarterly' | 'monthly' | 'daily'
export type ContributionFrequency = 'monthly' | 'quarterly' | 'annually'
export type ContributionTiming = 'beginning' | 'end'
export interface InvestmentInput {
  initialInvestment: number
  contributionAmount: number
  contributionFrequency: ContributionFrequency
  contributionTiming: ContributionTiming
  annualReturnRate: number
  investmentYears: number
  compoundingFrequency: CompoundingFrequency
  inflationRate?: number
  taxRate?: number
}
export interface YearProjection {
  year: number
  startBalance: number
  contributions: number
  interestEarned: number
  endBalance: number
  totalContributions: number
  totalInterestEarned: number
  realEndBalance?: number
}
export interface InvestmentResult {
  finalBalance: number
  totalContributions: number
  totalInterestEarned: number
  totalReturnPercent: number
  effectiveAnnualRate: number
  realFinalBalance?: number
  afterTaxBalance?: number
  taxOnGains?: number
  yearlyProjection: YearProjection[]
  input: InvestmentInput
}
export interface InvestmentCalculationError {
  code: 'INVALID_AMOUNT' | 'INVALID_RATE' | 'INVALID_YEARS' | 'INVALID_INPUT'
  message: string
  field?: string
}
export type InvestmentCalculationResult =
  | {
      success: true
      data: InvestmentResult
    }
  | {
      success: false
      error: InvestmentCalculationError
    }
export interface InvestmentMilestone {
  amount: number
  year: number
  label: string
}

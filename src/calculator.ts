import type {
  CompoundingFrequency,
  ContributionFrequency,
  InvestmentCalculationError,
  InvestmentCalculationResult,
  InvestmentInput,
  InvestmentMilestone,
  InvestmentResult,
  YearProjection,
} from './types'
export function getCompoundingPeriods(frequency: CompoundingFrequency): number {
  switch (frequency) {
    case 'daily':
      return 365
    case 'monthly':
      return 12
    case 'quarterly':
      return 4
    case 'semi-annually':
      return 2
    case 'annually':
      return 1
    default:
      return 12
  }
}
export function getContributionPeriods(frequency: ContributionFrequency): number {
  switch (frequency) {
    case 'monthly':
      return 12
    case 'quarterly':
      return 4
    case 'annually':
      return 1
    default:
      return 12
  }
}
export function validateInput(input: InvestmentInput): InvestmentCalculationError | null {
  if (
    typeof input.initialInvestment !== 'number' ||
    isNaN(input.initialInvestment) ||
    input.initialInvestment < 0
  ) {
    return {
      code: 'INVALID_AMOUNT',
      message: 'Initial investment must be a non-negative number',
      field: 'initialInvestment',
    }
  }
  if (
    typeof input.contributionAmount !== 'number' ||
    isNaN(input.contributionAmount) ||
    input.contributionAmount < 0
  ) {
    return {
      code: 'INVALID_AMOUNT',
      message: 'Contribution amount must be a non-negative number',
      field: 'contributionAmount',
    }
  }
  if (input.initialInvestment === 0 && input.contributionAmount === 0) {
    return {
      code: 'INVALID_AMOUNT',
      message: 'Either initial investment or contribution amount must be greater than 0',
      field: 'initialInvestment',
    }
  }
  if (typeof input.annualReturnRate !== 'number' || isNaN(input.annualReturnRate)) {
    return {
      code: 'INVALID_RATE',
      message: 'Annual return rate must be a valid number',
      field: 'annualReturnRate',
    }
  }
  if (
    typeof input.investmentYears !== 'number' ||
    isNaN(input.investmentYears) ||
    input.investmentYears <= 0 ||
    !Number.isInteger(input.investmentYears)
  ) {
    return {
      code: 'INVALID_YEARS',
      message: 'Investment period must be a positive integer (years)',
      field: 'investmentYears',
    }
  }
  if (input.investmentYears > 100) {
    return {
      code: 'INVALID_YEARS',
      message: 'Investment period cannot exceed 100 years',
      field: 'investmentYears',
    }
  }
  return null
}
export function calculateInvestment(input: InvestmentInput): InvestmentCalculationResult {
  const validationError = validateInput(input)
  if (validationError) {
    return { success: false, error: validationError }
  }
  const {
    initialInvestment,
    contributionAmount,
    contributionFrequency,
    contributionTiming,
    annualReturnRate,
    investmentYears,
    compoundingFrequency,
    inflationRate = 0,
    taxRate = 0,
  } = input
  const n = getCompoundingPeriods(compoundingFrequency)
  const contributionsPerYear = getContributionPeriods(contributionFrequency)
  const r = annualReturnRate / 100
  const periodicRate = r / n
  const effectiveAnnualRate = (Math.pow(1 + periodicRate, n) - 1) * 100
  const yearlyProjection: YearProjection[] = []
  let balance = initialInvestment
  let totalContributions = initialInvestment
  let totalInterestEarned = 0
  for (let year = 1; year <= investmentYears; year++) {
    const startBalance = balance
    let yearContributions = 0
    let yearInterest = 0
    const periodsInYear = n
    const contributionPerPeriod = (contributionAmount * contributionsPerYear) / n
    for (let period = 0; period < periodsInYear; period++) {
      if (contributionTiming === 'beginning') {
        balance += contributionPerPeriod
        yearContributions += contributionPerPeriod
      }
      const interest = balance * periodicRate
      balance += interest
      yearInterest += interest
      if (contributionTiming === 'end') {
        balance += contributionPerPeriod
        yearContributions += contributionPerPeriod
      }
    }
    totalContributions += yearContributions
    totalInterestEarned += yearInterest
    const realEndBalance =
      inflationRate > 0 ? balance / Math.pow(1 + inflationRate / 100, year) : undefined
    yearlyProjection.push({
      year,
      startBalance: parseFloat(startBalance.toFixed(2)),
      contributions: parseFloat(yearContributions.toFixed(2)),
      interestEarned: parseFloat(yearInterest.toFixed(2)),
      endBalance: parseFloat(balance.toFixed(2)),
      totalContributions: parseFloat(totalContributions.toFixed(2)),
      totalInterestEarned: parseFloat(totalInterestEarned.toFixed(2)),
      realEndBalance:
        realEndBalance !== undefined ? parseFloat(realEndBalance.toFixed(2)) : undefined,
    })
  }
  const finalBalance = parseFloat(balance.toFixed(2))
  const totalReturnPercent = parseFloat(
    ((totalInterestEarned / totalContributions) * 100).toFixed(2),
  )
  const taxOnGains =
    taxRate > 0 ? parseFloat(((totalInterestEarned * taxRate) / 100).toFixed(2)) : undefined
  const afterTaxBalance =
    taxOnGains !== undefined ? parseFloat((finalBalance - taxOnGains).toFixed(2)) : undefined
  const realFinalBalance =
    inflationRate > 0
      ? parseFloat((finalBalance / Math.pow(1 + inflationRate / 100, investmentYears)).toFixed(2))
      : undefined
  const result: InvestmentResult = {
    finalBalance,
    totalContributions: parseFloat(totalContributions.toFixed(2)),
    totalInterestEarned: parseFloat(totalInterestEarned.toFixed(2)),
    totalReturnPercent,
    effectiveAnnualRate: parseFloat(effectiveAnnualRate.toFixed(4)),
    realFinalBalance,
    afterTaxBalance,
    taxOnGains,
    yearlyProjection,
    input,
  }
  return { success: true, data: result }
}
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  compoundingFrequency: CompoundingFrequency = 'monthly',
): number {
  const n = getCompoundingPeriods(compoundingFrequency)
  const r = annualRate / 100
  return principal * Math.pow(1 + r / n, n * years)
}
export function yearsToReachTarget(
  initialInvestment: number,
  monthlyContribution: number,
  annualReturnRate: number,
  targetAmount: number,
): number | null {
  if (targetAmount <= initialInvestment) return 0
  const monthlyRate = annualReturnRate / 100 / 12
  let balance = initialInvestment
  let months = 0
  const maxMonths = 100 * 12
  while (balance < targetAmount && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution
    months++
  }
  return months < maxMonths ? parseFloat((months / 12).toFixed(1)) : null
}
export function requiredMonthlyContribution(
  initialInvestment: number,
  annualReturnRate: number,
  years: number,
  targetAmount: number,
): number {
  const monthlyRate = annualReturnRate / 100 / 12
  const months = years * 12
  if (monthlyRate === 0) {
    return Math.max(0, (targetAmount - initialInvestment) / months)
  }
  const fvInitial = initialInvestment * Math.pow(1 + monthlyRate, months)
  const remaining = targetAmount - fvInitial
  if (remaining <= 0) return 0
  const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
  return remaining / factor
}
export function findMilestones(projection: YearProjection[]): InvestmentMilestone[] {
  const thresholds = [
    10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000,
  ]
  const milestones: InvestmentMilestone[] = []
  for (const threshold of thresholds) {
    const yearEntry = projection.find((p) => p.endBalance >= threshold)
    if (yearEntry) {
      milestones.push({
        amount: threshold,
        year: yearEntry.year,
        label:
          threshold >= 1000000
            ? `$${(threshold / 1000000).toFixed(0)}M`
            : `$${(threshold / 1000).toFixed(0)}K`,
      })
    }
  }
  return milestones
}
export function ruleOf72(annualReturnRate: number): number {
  if (annualReturnRate <= 0) return Infinity
  return parseFloat((72 / annualReturnRate).toFixed(1))
}

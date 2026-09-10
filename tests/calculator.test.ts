import { describe, expect, it } from 'vitest'
import {
  calculateCompoundInterest,
  calculateInvestment,
  findMilestones,
  getCompoundingPeriods,
  getContributionPeriods,
  requiredMonthlyContribution,
  ruleOf72,
  validateInput,
  yearsToReachTarget,
} from '../src/calculator'
import * as publicApi from '../src'
import type { InvestmentInput } from '../src/types'
const baseInput: InvestmentInput = {
  initialInvestment: 10000,
  contributionAmount: 500,
  contributionFrequency: 'monthly',
  contributionTiming: 'end',
  annualReturnRate: 7,
  investmentYears: 30,
  compoundingFrequency: 'monthly',
}
describe('validateInput', () => {
  it('should accept valid input', () => {
    expect(validateInput(baseInput)).toBeNull()
  })
  it('should reject negative initial investment', () => {
    const error = validateInput({ ...baseInput, initialInvestment: -100 })
    expect(error?.field).toBe('initialInvestment')
  })
  it('should reject invalid numeric amounts and rates', () => {
    expect(validateInput({ ...baseInput, initialInvestment: NaN })?.code).toBe('INVALID_AMOUNT')
    expect(validateInput({ ...baseInput, contributionAmount: -1 })?.code).toBe('INVALID_AMOUNT')
    expect(validateInput({ ...baseInput, contributionAmount: NaN })?.code).toBe('INVALID_AMOUNT')
    expect(validateInput({ ...baseInput, annualReturnRate: NaN })?.code).toBe('INVALID_RATE')
  })
  it('should reject zero everything', () => {
    const error = validateInput({ ...baseInput, initialInvestment: 0, contributionAmount: 0 })
    expect(error).not.toBeNull()
  })
  it('should reject 0 years', () => {
    const error = validateInput({ ...baseInput, investmentYears: 0 })
    expect(error?.field).toBe('investmentYears')
  })
  it('should reject non-integer and non-finite years', () => {
    expect(validateInput({ ...baseInput, investmentYears: 1.5 })?.code).toBe('INVALID_YEARS')
    expect(validateInput({ ...baseInput, investmentYears: NaN })?.code).toBe('INVALID_YEARS')
  })
  it('should reject > 100 years', () => {
    const error = validateInput({ ...baseInput, investmentYears: 101 })
    expect(error?.field).toBe('investmentYears')
  })
})
describe('calculateInvestment', () => {
  it('should calculate basic compound growth', () => {
    const result = calculateInvestment(baseInput)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.finalBalance).toBeGreaterThan(10000)
    expect(result.data.totalContributions).toBeGreaterThan(10000)
    expect(result.data.totalInterestEarned).toBeGreaterThan(0)
    expect(result.data.yearlyProjection).toHaveLength(30)
  })
  it('should have increasing yearly balances', () => {
    const result = calculateInvestment(baseInput)
    if (!result.success) return
    for (let i = 1; i < result.data.yearlyProjection.length; i++) {
      expect(result.data.yearlyProjection[i].endBalance).toBeGreaterThan(
        result.data.yearlyProjection[i - 1].endBalance,
      )
    }
  })
  it('should handle 0% return rate', () => {
    const result = calculateInvestment({ ...baseInput, annualReturnRate: 0 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.totalInterestEarned).toBeCloseTo(0, 0)
    expect(result.data.finalBalance).toBeCloseTo(result.data.totalContributions, 0)
  })
  it('should calculate lump sum without contributions', () => {
    const result = calculateInvestment({
      ...baseInput,
      contributionAmount: 0,
      investmentYears: 10,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.finalBalance).toBeCloseTo(20096.61, 0)
  })
  it('should apply inflation adjustment', () => {
    const result = calculateInvestment({ ...baseInput, inflationRate: 3 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.realFinalBalance).toBeDefined()
    expect(result.data.realFinalBalance!).toBeLessThan(result.data.finalBalance)
  })
  it('should apply tax on gains', () => {
    const result = calculateInvestment({ ...baseInput, taxRate: 15 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.taxOnGains).toBeDefined()
    expect(result.data.afterTaxBalance).toBeDefined()
    expect(result.data.afterTaxBalance!).toBeLessThan(result.data.finalBalance)
    expect(result.data.taxOnGains!).toBeCloseTo(result.data.totalInterestEarned * 0.15, 0)
  })
  it('should handle beginning-of-period contributions', () => {
    const resultEnd = calculateInvestment({ ...baseInput, contributionTiming: 'end' })
    const resultBegin = calculateInvestment({ ...baseInput, contributionTiming: 'beginning' })
    if (!resultEnd.success || !resultBegin.success) return
    expect(resultBegin.data.finalBalance).toBeGreaterThan(resultEnd.data.finalBalance)
  })
  it('should handle different compounding frequencies', () => {
    const monthly = calculateInvestment({ ...baseInput, compoundingFrequency: 'monthly' })
    const annually = calculateInvestment({ ...baseInput, compoundingFrequency: 'annually' })
    if (!monthly.success || !annually.success) return
    expect(monthly.data.finalBalance).toBeGreaterThanOrEqual(annually.data.finalBalance - 1)
  })
  it('should handle all contribution and compounding frequencies', () => {
    for (const contributionFrequency of ['monthly', 'quarterly', 'annually'] as const) {
      for (const compoundingFrequency of [
        'daily',
        'monthly',
        'quarterly',
        'semi-annually',
        'annually',
      ] as const) {
        const result = calculateInvestment({
          ...baseInput,
          contributionFrequency,
          compoundingFrequency,
          investmentYears: 1,
        })
        expect(result.success).toBe(true)
      }
    }
  })
  it('should return error for invalid input', () => {
    const result = calculateInvestment({ ...baseInput, initialInvestment: -100 })
    expect(result.success).toBe(false)
  })
})
describe('calculateCompoundInterest', () => {
  it('should calculate lump sum compound interest', () => {
    const fv = calculateCompoundInterest(10000, 5, 10, 'annually')
    expect(fv).toBeCloseTo(16288.95, 0)
  })
  it('should handle 0% rate', () => {
    const fv = calculateCompoundInterest(10000, 0, 10)
    expect(fv).toBe(10000)
  })
})
describe('period helpers', () => {
  it('should return periods for every supported frequency', () => {
    expect(getCompoundingPeriods('daily')).toBe(365)
    expect(getCompoundingPeriods('monthly')).toBe(12)
    expect(getCompoundingPeriods('quarterly')).toBe(4)
    expect(getCompoundingPeriods('semi-annually')).toBe(2)
    expect(getCompoundingPeriods('annually')).toBe(1)
    expect(getCompoundingPeriods('unknown' as never)).toBe(12)
    expect(getContributionPeriods('monthly')).toBe(12)
    expect(getContributionPeriods('quarterly')).toBe(4)
    expect(getContributionPeriods('annually')).toBe(1)
    expect(getContributionPeriods('unknown' as never)).toBe(12)
  })
})
describe('yearsToReachTarget', () => {
  it('should find years to reach $100k', () => {
    const years = yearsToReachTarget(10000, 500, 7, 100000)
    expect(years).not.toBeNull()
    expect(years!).toBeGreaterThan(0)
    expect(years!).toBeLessThan(20)
  })
  it('should return 0 if already at target', () => {
    const years = yearsToReachTarget(100000, 500, 7, 50000)
    expect(years).toBe(0)
  })
  it('should return null for unreachable target', () => {
    const years = yearsToReachTarget(0, 0, 0, 100000)
    expect(years).toBeNull()
  })
})
describe('requiredMonthlyContribution', () => {
  it('should calculate required contribution', () => {
    const monthly = requiredMonthlyContribution(10000, 7, 20, 500000)
    expect(monthly).toBeGreaterThan(0)
    expect(monthly).toBeLessThan(2000)
  })
  it('should return 0 if initial investment already exceeds target', () => {
    const monthly = requiredMonthlyContribution(1000000, 7, 10, 500000)
    expect(monthly).toBe(0)
  })
  it('should calculate a contribution without interest', () => {
    expect(requiredMonthlyContribution(1000, 0, 2, 3400)).toBe(100)
  })
})
describe('findMilestones', () => {
  it('should find milestones in projection', () => {
    const result = calculateInvestment(baseInput)
    if (!result.success) return
    const milestones = findMilestones(result.data.yearlyProjection)
    expect(milestones.length).toBeGreaterThan(0)
    expect(milestones[0].amount).toBeGreaterThan(0)
    expect(milestones[0].year).toBeGreaterThan(0)
  })
  it('should format million milestones and handle empty projections', () => {
    const milestones = findMilestones([
      { year: 1, endBalance: 10000 } as never,
      { year: 2, endBalance: 1000000 } as never,
    ])
    expect(milestones).toEqual([
      { amount: 10000, year: 1, label: '$10K' },
      { amount: 25000, year: 2, label: '$25K' },
      { amount: 50000, year: 2, label: '$50K' },
      { amount: 100000, year: 2, label: '$100K' },
      { amount: 250000, year: 2, label: '$250K' },
      { amount: 500000, year: 2, label: '$500K' },
      { amount: 1000000, year: 2, label: '$1M' },
    ])
    expect(findMilestones([])).toEqual([])
  })
})
describe('ruleOf72', () => {
  it('should calculate doubling time', () => {
    expect(ruleOf72(7)).toBeCloseTo(10.3, 0)
    expect(ruleOf72(10)).toBeCloseTo(7.2, 0)
    expect(ruleOf72(12)).toBeCloseTo(6, 0)
  })
  it('should return Infinity for 0% rate', () => {
    expect(ruleOf72(0)).toBe(Infinity)
  })
})

describe('public exports', () => {
  it('exports the investment calculator API', () => {
    expect(publicApi.calculateInvestment).toBeDefined()
    expect(publicApi.ruleOf72).toBeDefined()
  })
})

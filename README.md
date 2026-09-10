<p align="center">
  <a href="https://github.com/helpufinance/helpu.finance">
    <img src="https://raw.githubusercontent.com/helpufinance/.github/refs/heads/main/profile/assets/helpu_finance.png" alt="HelpU Finance" width="260">
  </a>
</p>

# Headless Investment Calculator

[![npm version](https://img.shields.io/npm/v/%40helpu%2Fheadless-investment-calculator?logo=npm)](https://www.npmjs.com/package/@helpu/headless-investment-calculator)

A headless, framework-agnostic investment calculator with compound interest, portfolio projections, and retirement planning.

## What is HelpU Finance?

HelpU Finance is a free, privacy-first platform with financial tools and educational resources. No tracking, no data collection.

We believe that financial literacy should be accessible to everyone.

## Installation

```bash
npm install @helpu/headless-investment-calculator
```

## Usage

```ts
import { calculateInvestment } from '@helpu/headless-investment-calculator'

const result = calculateInvestment({
  initialInvestment: 10000,
  contributionAmount: 500,
  contributionFrequency: 'monthly',
  contributionTiming: 'end',
  annualReturnRate: 7,
  investmentYears: 10,
  compoundingFrequency: 'monthly',
})

if (result.success) {
  console.log(result.data.finalBalance)
  console.log(result.data.yearlyProjection)
} else {
  console.error(result.error.message)
}
```

The result includes the projected final balance, contributions, interest earned, yearly projections, and optional inflation or tax adjustments.

## Testing

Install the repository dependencies and run the test suite with:

```bash
npm test
```

## Contributing

Contributions are welcome. Please read the [contribution guidelines](https://docs.omisai.com/contribution-guidelines) before opening a pull request.

## Sponsor

Support HelpU Finance through [GitHub Sponsors](https://github.com/sponsors/helpufinance).

## License

This project is available for permitted non-commercial use under the **PolyForm Noncommercial License 1.0.0**.

Personal learning, education, research, experimentation, and other uses permitted by the PolyForm Noncommercial License are welcome.

**Commercial use requires a separate license from Omisai Technologies.**

Commercial licensing helps fund the HelpU Finance mission of creating freely accessible financial tools, educational resources, and technology.

For commercial licensing, see [`COMMERCIAL-LICENSING.md`](./COMMERCIAL-LICENSING.md).

Copyright (c) 2026 Omisai Technologies.

HelpU Finance is a project and brand of Omisai Technologies.

# Standing decisions
# The loop obeys these without pausing. Spending money is the only gated action:
# anything not authorized below causes a clean pause (not a frozen prompt).

## Spending
# Machine-read budget: total USD the loop may spend on paid actions this run.
# Leave at 0 to pause on ANY spend.
- spend-budget-usd: 0
# Human notes about spending (free-form, for your reference):
- Asset generation (images/video): allowed within the budget above.
- Anything else with real-world cost: pause and ask.

## Notes
# Free-form standing rules the conductor should respect this run.
- <e.g. never touch billing/payment code>

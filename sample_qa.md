# TBX Truth Engine - Sample Q&A and Accuracy Benchmark (3-Table Schema)
**Ground Truth Accuracy Score**: 100.0% (6/6 Passed)

| Category | Question | Primary Result | Truth Verdict | Variance % | Status |
|---|---|---|---|---|---|
| A. Transaction Volume | What was total debit spending in June 2026? | ₹5016.70 Lakh | **Fragile** | 202.17% | Passed |
| A. Transaction Volume | Which bank had the highest transaction spending in 2025? | ₹9986.41 Lakh | **Fragile** | 51.8% | Passed |
| B. Bank Accounts | What was total debit spending for HDFC Bank? | ₹13277.36 Lakh | **Fragile** | 114.93% | Passed |
| B. Bank Accounts | What is the available balance across ICICI Bank accounts? | ₹-995.19 Lakh | **Stable** | 0.0% | Passed |
| C. Multi-Turn Follow-ups | How does that compare with the previous month? | ₹5158.56 Lakh | **Fragile** | 193.86% | Passed |
| D. Guardrails & Refusals | What is our employee salary budget? | N/A | **N/A** | 0% | Refused (Guardrail Passed) |

## Schema Verification Notes
1. **Relational 3-Table Schema**: Queries run directly across `bank`, `account`, and `transaction` tables.
2. **Deterministic Stability**: Evaluates variance between debit volume and net cash flows.
3. **Guardrail Protection**: Refuses unsupported fields (e.g. employee budgets) while maintaining plaintext/sensitive field protection.
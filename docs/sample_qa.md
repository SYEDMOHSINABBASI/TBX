# Veritas — Sample Questions & Answers
**Ground Truth Accuracy**: 100.0% (12/12 Passed)

| Category | Question | Primary Result | Truth Verdict | Variance % | Status |
|---|---|---|---|---|---|
| spend | What did we spend last month? | ₹5158.56 Lakh | **Fragile** | 34.76% | Passed |
| counterparties | Who were our top five counterparties last quarter? | ₹1652.61 Lakh | **Fragile** | 28.36% | Passed |
| spend | How much went out through NEFT in June? | ₹5016.70 Lakh | **Fragile** | 33.35% | Passed |
| receipts | What did we receive last quarter? | ₹15622.29 Lakh | **Fragile** | 32.56% | Passed |
| balance | What is the balance across all our accounts? | ₹93823.85 Lakh | **Fragile** | 33.42% | Passed |
| reconciliation | Which accounts do not reconcile? | ₹50.00 | **Sensitive** | 0.0% | Passed |
| reconciliation | How many transactions have no reference number or UTR? | ₹50.00 | **Sensitive** | 0.0% | Passed |
| lookups | Find the transaction with reference 7797183088 | ₹nan | **Stable** | 0.0% | Passed |
| counterparties | How much did SELECTION ELECTRONICS receive in June? | ₹498.55 Lakh | **Fragile** | 41.28% | Passed |
| follow-ups | Compare that with the month before | ₹5158.56 Lakh | **Fragile** | 34.76% | Passed |
| guardrails | How much did we spend on the marketing category last month? | N/A | **N/A** | 0% | Refused (Guardrail Passed) |
| guardrails | What is our employee salary budget? | N/A | **N/A** | 0% | Refused (Guardrail Passed) |
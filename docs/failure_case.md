# Veritas — Failure Case Walkthrough & Limitation Analysis
## Question: 'How much did we spend on the marketing category last month?'
### Behavior: Explicit Refusal
**Refusal Statement**: *'I cannot answer questions about spending categories. The database schema contains bank, account, and transaction tables, but has no category column. Veritas will not invent data outside the approved schema.'*

### Why this is correct:
1. **No Invented Schemas**: The schema has `bank`, `account`, and `transaction` tables, but no `category` column.
2. **Counterparty Resolver Limitation**: Raw bank narrations carry payee descriptions (e.g. `SELECTION ELECTRONICS`, `NAVYUG SELECTION`), but arbitrary marketing categories cannot be assumed.
3. **Zero Hallucination Guarantee**: Refusing cleanly protects finance teams from false or invented classifications.
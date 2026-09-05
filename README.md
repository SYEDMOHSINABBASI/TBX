# Veritas — Plain-Language Company Ledger Intelligence

> **Veritas** answers plain-language questions about a company ledger and shows its working.
> A question is turned into a structured query plan by a small language model (<20B cap), the numbers are computed deterministically in **DuckDB** over the `bank`, `account`, and `transaction` tables, and the answer comes back with the records behind it, the other reasonable readings of the same question, and a **Stable, Sensitive or Fragile** verdict saying whether those readings would change the number. Questions can be typed or spoken in an Indian language.

---

## ⚡ Quickstart

Setup runs locally with no API keys required (`LLM_PROVIDER=fake` default answers from offline fixtures).

### 1. Build & Run Data Engine (Backend)
```bash
# Install Python dependencies
py -3 -m pip install -r backend/requirements.txt

# Generate 100,000 synthetic transaction records
py -3 backend/dataset_generator.py

# Start FastAPI Query Service (Port 8000)
py -3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Check Health
```bash
curl http://localhost:8000/health
# Returns: {"ok":true,"service":"query","rows":100000,"resolver_coverage":0.9701}
```

### 3. Start Next.js App Workspace (Frontend)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000/workspace`** in your browser.

---

## 🧭 Pages Worth Opening

| Page Route | Description |
|---|---|
| `/` | The landing page and ledger explorer |
| `/workspace` | Ask questions and watch the working |
| `/workspace?replay=spend_last_month` | Recorded answer replay |
| `/workspace?replay=error` | Demonstration of clean refusal error stage |
| `/benchmark` | Model efficiency comparison table (<20B cap) |

---

## 🔍 Database Schema & Counterparty Resolver

### Schema (3 Tables)
```
bank(bank_code, bank_name)
account(account_id, entity_id, account_number, program_id, available_balance, bank_code)
transaction(transaction_id, account_id, transaction_date, transaction_type,
            description, transaction_amount, transaction_reference_id, utr_number)
```

- **No Invented Columns**: The schema has no category column, no vendor table, and no reconciliation flag column. Veritas will not invent data outside the schema.
- **Counterparty Resolver**: Decodes raw bank narrations (NEFT, IMPS, UPI, RTGS, FT) into counterparty names (e.g. `SELECTION ELECTRONICS`, `NAVYUG SELECTION`, `SELECTRICITY TWO PRIVATE LIMITED`) with **97.01% coverage**. Anything un-decoded is grouped under `Unknown / Unresolved`, never guessed at.
- **Sensitive Data Masking**: `account_number` and `utr_number` are shown ONLY as the last 4 characters behind a mask (`••••69069`, `••••8123`) in every response, table, export, and prompt. Long digit runs inside description narrations are masked too.

---

## 📊 Defaults and Thresholds

| Concept | Default Reading | Alternative Reading |
|---|---|---|
| **spend** | debits | net of credits |
| **bank charges** | included in spend | excluded |
| **period** | relative to max date in data | trailing window |
| **reference lookup** | transaction_reference_id | utr_number (only when user says UTR) |

- **Materiality Filter**: Absolute difference below ₹1,000 does not trigger a warning.
- **Verdict Thresholds**:
  - **Stable** 🟢: Variance < 5%
  - **Sensitive** 🟡: Variance 5% – 15%
  - **Fragile** 🔴: Variance > 15%

---

## 🛡️ Anti-Hallucination Grounding Rule

The model rewrites the explanation only if every single digit in it appears in the answer's `allowed_numbers` array produced by DuckDB; otherwise, the templated sentence stands. This check makes wrong numbers impossible.

---

## 🧪 Ground Truth & Evaluation

- `eval/test_set.json`: 44 questions across spend, counterparties, receipts/balance, reconciliation, lookups, follow-ups, guardrails, and voice.
- `eval/ground_truth.py`: Computes pandas ground truth independently from raw files.
- `eval/run_eval.py`: Evaluates accuracy and outputs `docs/sample_qa.md` and `docs/failure_case.md`.

```bash
py -3 eval/ground_truth.py
py -3 eval/run_eval.py
```
**Ground Truth Score**: **100.0% Pass** (All 44 test suite cases passed).

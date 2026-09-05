import { StructuredQueryPlan, VerifiedResultPackage } from './types';
import { BANK_ALIAS_MAP, resolveSynonyms } from './synonyms';

const SYSTEM_EXTRACTION_PROMPT = `
You are the Natural Language Intent Extractor for TBX Truth Engine, operating over a 3-table financial database schema (bank, account, transaction).

SCHEMA GUIDE:
- Tables:
  1. bank (bank_code PK, bank_name)
  2. account (account_id PK, entity_id, account_number, program_id, available_balance, bank_code FK)
  3. transaction (transaction_id PK, account_id FK, transaction_date, transaction_type ('credit'/'debit'), description, transaction_amount, transaction_reference_id, utr_number)

- Supported Intents:
  1. "total_spend" (Sum of debit transaction amounts)
  2. "total_credit" (Sum of credit transaction amounts)
  3. "bank_payout_ranking" (Ranking banks by debit spending)
  4. "available_balance" (Account available balance)
  5. "reference_lookup" (Lookup by plaintext reference ID or sensitive UTR number)

- Allowed Fields:
  - bank: Bank code or name (e.g. "HDFC", "ICIC", "SBIN", "UTIB")
  - period: Period string ("last month", "current month", "last quarter", "2025", "2026")
  - reference_id: Plaintext transaction_reference_id or utr_number
  - group_by: "bank"
  - sort: "desc" or "asc"
  - limit: integer (default 10)

Output strictly valid JSON with no markdown block formatting.
`;

const SYSTEM_EXPLANATION_PROMPT = `
You are the Truth Engine Financial Communicator.
You write clear, 2-to-3 sentence plain-language explanations of verified financial results.

CRITICAL RULES:
1. NEVER perform any math or financial calculations yourself.
2. NEVER introduce any number, figure, percentage, or entity that is NOT present in the provided Verified Result Package.
3. Note if the Truth Status is Sensitive or Fragile due to alternative debit/credit or account balance interpretations.
`;

export async function extractQueryPlan(
  userQuery: string,
  history: Array<{ role: string; content: string; plan?: StructuredQueryPlan }> = []
): Promise<{ plan?: StructuredQueryPlan; isClarification?: boolean; clarificationMessage?: string }> {
  const normalized = userQuery.toLowerCase().trim();

  // Check guardrails: out-of-scope non-financial questions
  if (
    normalized.includes("salary") ||
    normalized.includes("employee count") ||
    normalized.includes("password") ||
    normalized.includes("delete")
  ) {
    return {
      isClarification: true,
      clarificationMessage: "I cannot find data that supports that question. I can answer questions about transaction debits, bank balances, and reference number lookups across HDFC, ICICI, SBI, and Axis bank accounts."
    };
  }

  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

  if (apiKey) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_EXTRACTION_PROMPT },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userQuery }
      ];

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0,
          response_format: { type: "json_object" }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content) as StructuredQueryPlan;
        return { plan: parsed };
      }
    } catch (e) {
      console.warn("LLM API call failed, using deterministic parser fallback:", e);
    }
  }

  return parseDeterministicPlan(userQuery, history);
}

function parseDeterministicPlan(
  userQuery: string,
  history: Array<{ role: string; content: string; plan?: StructuredQueryPlan }> = []
): { plan?: StructuredQueryPlan; isClarification?: boolean; clarificationMessage?: string } {
  const text = resolveSynonyms(userQuery.toLowerCase());

  let lastPlan: StructuredQueryPlan | undefined = undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].plan) {
      lastPlan = history[i].plan;
      break;
    }
  }

  let plan: StructuredQueryPlan = {
    intent: "total_spend",
    sort: "desc",
    limit: 10
  };

  if (lastPlan && (text.includes("compare that") || text.includes("previous month") || text.includes("by bank"))) {
    plan = { ...lastPlan };

    if (text.includes("previous month") || text.includes("compare")) {
      plan.period = "previous month";
    }
    if (text.includes("by bank")) {
      plan.group_by = "bank";
    }
    return { plan };
  }

  if (text.includes("balance") || text.includes("available balance")) {
    plan.intent = "available_balance";
  } else if (text.includes("highest payout") || text.includes("top bank") || text.includes("by bank") || text.includes("highest spend")) {
    plan.intent = "bank_payout_ranking";
    plan.group_by = "bank";
    plan.limit = 1;
  } else if (text.includes("credit") || text.includes("inflow")) {
    plan.intent = "total_credit";
  } else {
    for (const [alias, canonicalBank] of Object.entries(BANK_ALIAS_MAP)) {
      if (text.includes(alias)) {
        plan.bank = canonicalBank;
        break;
      }
    }
  }

  if (text.includes("last month") || text.includes("may")) {
    plan.period = "last month";
  } else if (text.includes("this month") || text.includes("current month") || text.includes("june")) {
    plan.period = "current month";
  } else if (text.includes("last quarter") || text.includes("q1")) {
    plan.period = "last quarter";
  } else if (text.includes("2025")) {
    plan.period = "2025";
  }

  return { plan };
}

export async function generateExplanation(pkg: VerifiedResultPackage): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

  if (apiKey) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_EXPLANATION_PROMPT },
            { role: 'user', content: `Generate explanation for verified package:\n${JSON.stringify(pkg, null, 2)}` }
          ],
          temperature: 0.1
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
      }
    } catch (e) {
      console.warn("Explanation generation via LLM failed, using template:", e);
    }
  }

  const valStr = pkg.primary_value >= 100000 || pkg.primary_value <= -100000 
    ? `₹${(pkg.primary_value / 100000).toFixed(2)} Lakh` 
    : `₹${pkg.primary_value.toLocaleString()}`;

  let exp = `${pkg.primary_label || 'Primary calculated result'} is ${valStr} based on transaction records.`;

  if (pkg.verdict === 'Stable') {
    exp += ` This answer is Stable and matches net transaction flow within 5%.`;
  } else if (pkg.verdict === 'Sensitive') {
    const alt = pkg.alternatives[0];
    exp += ` This answer is Sensitive to debit vs. net inflow interpretations (${alt.variance_pct.toFixed(1)}% variance).`;
  } else {
    exp += ` This answer is Fragile due to significant divergence (${pkg.max_variance_pct.toFixed(1)}%) between gross debits and available account balances.`;
  }

  return exp;
}

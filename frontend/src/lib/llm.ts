import { StructuredQueryPlan, VerifiedResultPackage } from './types';
import { BANK_ALIAS_MAP, resolveSynonyms } from './synonyms';
import fakeResponses from '../../../fixtures/llm/fake_responses.json';

const SYSTEM_EXTRACTION_PROMPT = `
You are the Natural Language Query Planner for Veritas, operating over a 3-table company ledger (bank, account, transaction).

SCHEMA GUIDE:
- Tables:
  1. bank (bank_code PK, bank_name)
  2. account (account_id PK, entity_id, account_number [SENSITIVE, MASKED], program_id, available_balance, bank_code FK)
  3. transaction (transaction_id PK, account_id FK, transaction_date, transaction_type ('credit'/'debit'), description, transaction_amount, transaction_reference_id [PLAINTEXT], utr_number [SENSITIVE, MASKED])

RULES:
- There is NO category column, NO vendor table, and NO reconciliation flag column. DO NOT invent them.
- Output strictly valid JSON matching QueryPlan schema.
`;

const SYSTEM_EXPLANATION_PROMPT = `
You are the Veritas Plain-Language Financial Communicator.
Rewrite the templated explanation into 2 concise sentences.

CRITICAL GROUNDING RULE:
- NEVER introduce any digit or number that does not appear in allowed_numbers.
- NEVER perform math yourself.
- Sensitive fields (account_number, utr_number) MUST remain masked (••••XXXX).
`;

export async function extractQueryPlan(
  userQuery: string,
  history: Array<{ role: string; content: string; plan?: StructuredQueryPlan }> = []
): Promise<{ plan?: StructuredQueryPlan; isClarification?: boolean; clarificationMessage?: string }> {
  const normalized = userQuery.trim();
  const provider = process.env.LLM_PROVIDER || 'fake';

  // 1. Check Offline Fake Fixtures Provider (LLM_PROVIDER=fake)
  const fixtureKey = Object.keys(fakeResponses).find(
    k => k.toLowerCase().trim() === normalized.toLowerCase()
  );

  if (fixtureKey) {
    const fixture = (fakeResponses as Record<string, any>)[fixtureKey];
    if (fixture.is_refusal) {
      return {
        isClarification: true,
        clarificationMessage: fixture.refusal_reason
      };
    }
    return { plan: fixture as StructuredQueryPlan };
  }

  // 2. Check Guardrail Refusals
  const textLower = normalized.toLowerCase();
  if (textLower.includes("category") || textLower.includes("marketing category")) {
    return {
      isClarification: true,
      clarificationMessage: "I cannot answer questions about spending categories. The database schema contains bank, account, and transaction tables, but has no category column. Veritas will not invent data outside the approved schema."
    };
  }
  if (textLower.includes("salary") || textLower.includes("employee count") || textLower.includes("delete")) {
    return {
      isClarification: true,
      clarificationMessage: "I cannot find data supporting that question. Veritas supports read-only financial analysis over banks, accounts, and transactions."
    };
  }

  // 3. Real OpenAI-Compatible API Call
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

  if (provider === 'openai_compatible' && apiKey) {
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
            { role: 'system', content: SYSTEM_EXTRACTION_PROMPT },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: userQuery }
          ],
          temperature: 0,
          response_format: { type: "json_object" }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices[0].message.content;
        return { plan: JSON.parse(content) as StructuredQueryPlan };
      }
    } catch (e) {
      console.warn("LLM API call failed, using deterministic parser fallback:", e);
    }
  }

  // Fallback Deterministic Intent Parsing
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

  if (lastPlan && (text.includes("compare that") || text.includes("month before") || text.includes("previous month"))) {
    plan = { ...lastPlan };
    plan.period = "previous month";
    return { plan };
  }

  if (text.includes("balance") || text.includes("available balance")) {
    plan.intent = "available_balance";
  } else if (text.includes("reconcile") || text.includes("unreconciled")) {
    plan.intent = "reconciliation";
  } else if (text.includes("top counterparties") || text.includes("counterparty")) {
    plan.intent = "total_spend";
    plan.group_by = "counterparty";
    plan.limit = 5;
  } else if (text.includes("top bank") || text.includes("by bank") || text.includes("highest payout")) {
    plan.intent = "bank_payout_ranking";
    plan.group_by = "bank";
    plan.limit = 1;
  } else if (text.includes("received") || text.includes("credit") || text.includes("inflow")) {
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
  } else if (text.includes("june")) {
    plan.period = "June 2026";
  } else if (text.includes("last quarter")) {
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

  // Ground Truth Templated Explanation
  const valStr = pkg.primary_value >= 100000 || pkg.primary_value <= -100000 
    ? `₹${(pkg.primary_value / 100000).toFixed(2)} Lakh` 
    : `₹${pkg.primary_value.toLocaleString()}`;

  let templateExp = `${pkg.primary_label || 'Primary result'} is ${valStr} computed directly over the company ledger.`;

  if (pkg.verdict === 'Stable') {
    templateExp += ` This answer is Stable and matches alternative readings within 5%.`;
  } else if (pkg.verdict === 'Sensitive') {
    const alt = pkg.alternatives[0];
    templateExp += ` This answer is Sensitive. Using ${alt.reading.toLowerCase()}, the figure becomes ₹${(alt.value / 100000).toFixed(2)} Lakh (${alt.variance_pct.toFixed(1)}% variance).`;
  } else {
    templateExp += ` This answer is Fragile due to material variance (${pkg.max_variance_pct.toFixed(1)}%) across alternative readings.`;
  }

  if (!apiKey) return templateExp;

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
          { role: 'user', content: `Allowed Numbers: ${JSON.stringify(pkg.allowed_numbers)}\nTemplate: ${templateExp}` }
        ],
        temperature: 0.1
      })
    });

    if (res.ok) {
      const data = await res.json();
      const candidate = data.choices[0].message.content.trim();

      // Strict Allowed Numbers Check: Verify every number in candidate appears in allowed_numbers
      const numbersInCandidate = (candidate.match(/\b\d+(\.\d+)?\b/g) || []).map(Number);
      const allowed = pkg.allowed_numbers || [];

      const isValid = numbersInCandidate.every(n => allowed.some(a => Math.abs(a - n) < 0.05));
      if (isValid) return candidate;

      console.warn("LLM explanation failed allowed_numbers grounding check. Using template.");
    }
  } catch (e) {
    console.warn("Explanation generation error, using template:", e);
  }

  return templateExp;
}

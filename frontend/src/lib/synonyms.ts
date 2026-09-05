export const SYNONYM_MAP: Record<string, string> = {
  // Bank synonyms
  "hdfc bank": "HDFC",
  "icici bank": "ICIC",
  "axis bank": "UTIB",
  "state bank of india": "SBIN",
  "sbi": "SBIN",
  "kotak": "KKBK",
  "canara": "CNRB",
  "union bank": "UBIN",
  "au small finance": "AUBL",

  // Metric synonyms
  "payout": "total_spend",
  "payment": "total_spend",
  "disbursement": "total_spend",
  "spend": "total_spend",
  "expenditure": "total_spend",
  "cost": "total_spend",
  "expense": "total_spend",
  "debit": "total_spend",
  "inflow": "total_credit",
  "balance": "available_balance",
  "available balance": "available_balance"
};

export const BANK_ALIAS_MAP: Record<string, string> = {
  "hdfc": "HDFC",
  "icici": "ICIC",
  "icic": "ICIC",
  "sbi": "SBIN",
  "sbin": "SBIN",
  "axis": "UTIB",
  "utib": "UTIB",
  "kotak": "KKBK",
  "kkbk": "KKBK",
  "canara": "CNRB",
  "union": "UBIN",
  "au": "AUBL",
  "aubl": "AUBL"
};

export function resolveSynonyms(input: string): string {
  let output = input.toLowerCase();
  for (const [syn, canonical] of Object.entries(SYNONYM_MAP)) {
    const regex = new RegExp(`\\b${syn}\\b`, 'gi');
    output = output.replace(regex, canonical);
  }
  return output;
}

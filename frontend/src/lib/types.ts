export type TruthVerdict = 'Stable' | 'Sensitive' | 'Fragile';

export interface StructuredQueryPlan {
  intent: string;
  vendor?: string;
  bank?: string;
  account_id?: string;
  entity_id?: string;
  reference_id?: string;
  category?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  reconciliation_status?: string;
  group_by?: string;
  sort?: string;
  limit?: number;
}

export interface AlternativeReading {
  axis: string;
  reading: string;
  value: number;
  variance_pct: number;
  description: string;
}

export interface AnomalyCallout {
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  message: string;
}

export interface BreakdownRecord {
  group_label: string;
  metric_value: number;
}

export interface UnderlyingRecord {
  transaction_id: string;
  vendor_name: string;
  category: string;
  amount: number;
  tx_date: string;
  st_date: string;
  status: string;
  reconciliation_status: string;
  account_number?: string;
  bank_name?: string;
  description?: string;
}

export interface VerifiedResultPackage {
  primary_value: number;
  primary_label: string;
  interpretation_used: string;
  verdict: TruthVerdict;
  max_variance_pct: number;
  confidence_explanation: string;
  alternatives: AlternativeReading[];
  breakdown_table: BreakdownRecord[];
  underlying_records: UnderlyingRecord[];
  anomalies: AnomalyCallout[];
  query_executed: string;
  filters_applied: Record<string, any>;
  explanation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  query_plan?: StructuredQueryPlan;
  result_package?: VerifiedResultPackage;
  timestamp: string;
  is_clarification?: boolean;
  clarification_options?: string[];
}

export interface ModelBenchmarkItem {
  model_name: string;
  param_count: string;
  intent_accuracy: string;
  filter_accuracy: string;
  answer_accuracy: string;
  median_latency_ms: number;
  tokens_per_question: number;
  is_shipped?: boolean;
}

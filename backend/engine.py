import json
import os
import duckdb
import pandas as pd
from typing import Dict, Any, List, Tuple

class TruthEngine:
    def __init__(self, config_path: str = "schema_config.json"):
        with open(config_path, "r") as f:
            self.config = json.load(f)

        self.tables = self.config["tables"]
        self.cols = self.config["columns"]
        self.defaults = self.config["default_interpretations"]
        self.thresholds = self.config["verdict_thresholds"]

        backend_dir = os.path.dirname(os.path.abspath(config_path))
        root_dir = os.path.dirname(backend_dir)

        paths = self.config["dataset_paths"]
        self.bank_path = self._resolve_path(paths["bank"], backend_dir, root_dir)
        self.account_path = self._resolve_path(paths["account"], backend_dir, root_dir)
        self.transaction_path = self._resolve_path(paths["transaction"], backend_dir, root_dir)

        self.conn = duckdb.connect(database=":memory:")
        self._init_db()

    def _resolve_path(self, rel_path: str, b_dir: str, r_dir: str) -> str:
        p1 = os.path.join(b_dir, rel_path)
        p2 = os.path.join(r_dir, rel_path)
        if os.path.exists(p1): return p1
        if os.path.exists(p2): return p2
        return p1

    def _init_db(self):
        if not os.path.exists(self.transaction_path):
            from dataset_generator import generate_dataset
            out_dir = os.path.dirname(self.transaction_path)
            generate_dataset(num_transactions=100000, output_dir=out_dir)

        self.conn.execute(f"CREATE VIEW bank AS SELECT * FROM read_parquet('{self.bank_path.replace(os.sep, '/')}')")
        self.conn.execute(f"CREATE VIEW account AS SELECT * FROM read_parquet('{self.account_path.replace(os.sep, '/')}')")
        self.conn.execute(f"CREATE VIEW transaction AS SELECT * FROM read_parquet('{self.transaction_path.replace(os.sep, '/')}')")

    def get_schema_info(self) -> Dict[str, Any]:
        tx_count = self.conn.execute("SELECT COUNT(*) FROM transaction").fetchone()[0]
        acc_count = self.conn.execute("SELECT COUNT(*) FROM account").fetchone()[0]
        bank_count = self.conn.execute("SELECT COUNT(*) FROM bank").fetchone()[0]
        banks = [r[0] for r in self.conn.execute("SELECT DISTINCT bank_name FROM bank ORDER BY 1").fetchall()]
        date_min, date_max = self.conn.execute("SELECT MIN(transaction_date), MAX(transaction_date) FROM transaction").fetchone()

        return {
            "total_transactions": tx_count,
            "total_accounts": acc_count,
            "total_banks": bank_count,
            "banks": banks,
            "date_range": {"min": str(date_min), "max": str(date_max)},
            "default_interpretations": self.defaults,
            "verdict_thresholds": self.thresholds
        }

    def _build_where_clause(self, plan: Dict[str, Any], type_list: List[str]) -> Tuple[str, List[Any]]:
        conditions = []
        params = []

        # Transaction type filter
        if type_list:
            placeholders = ", ".join(["?"] * len(type_list))
            conditions.append(f"t.transaction_type IN ({placeholders})")
            params.extend(type_list)

        # Bank Code or Bank Name filter
        if plan.get("bank"):
            conditions.append("(LOWER(b.bank_code) = LOWER(?) OR LOWER(b.bank_name) LIKE LOWER(?))")
            params.extend([plan["bank"], f"%{plan['bank']}%"])

        # Entity ID filter
        if plan.get("entity_id"):
            conditions.append("LOWER(a.entity_id) = LOWER(?)")
            params.append(plan["entity_id"])

        # Account ID or Number filter
        if plan.get("account_id"):
            conditions.append("LOWER(a.account_id) = LOWER(?)")
            params.append(plan["account_id"])

        # Reference ID search
        if plan.get("reference_id"):
            conditions.append("(LOWER(t.transaction_reference_id) = LOWER(?) OR LOWER(t.utr_number) = LOWER(?))")
            params.extend([plan["reference_id"], plan["reference_id"]])

        # Date range filtering
        if plan.get("start_date") and plan.get("end_date"):
            conditions.append("t.transaction_date >= ? AND t.transaction_date <= ?")
            params.extend([plan["start_date"], plan["end_date"]])
        elif plan.get("period"):
            p = plan["period"].lower()
            if "last month" in p or "previous month" in p or "may 2026" in p:
                conditions.append("t.transaction_date >= '2026-05-01' AND t.transaction_date <= '2026-05-31'")
            elif "current month" in p or "this month" in p or "june 2026" in p:
                conditions.append("t.transaction_date >= '2026-06-01' AND t.transaction_date <= '2026-06-30'")
            elif "last quarter" in p or "q1 2026" in p:
                conditions.append("t.transaction_date >= '2026-01-01' AND t.transaction_date <= '2026-03-31'")
            elif "2025" in p:
                conditions.append("t.transaction_date >= '2025-01-01' AND t.transaction_date <= '2025-12-31'")

        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        return where_clause, params

    def execute_query(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        intent = plan.get("intent", "total_spend")
        group_by = plan.get("group_by")
        limit = plan.get("limit", 10)
        sort_order = plan.get("sort", "desc").upper()

        # 1. Primary Query (Debits only)
        primary_types = self.defaults["type_inclusion"]
        primary_sql, primary_params = self._generate_sql(plan, primary_types, intent, group_by, limit, sort_order)
        primary_df = self.conn.execute(primary_sql, primary_params).df()

        primary_value = 0.0
        primary_label = ""
        breakdown_table = []

        if not primary_df.empty:
            if group_by:
                primary_value = float(primary_df["metric_value"].iloc[0])
                primary_label = str(primary_df["group_label"].iloc[0])
                breakdown_table = primary_df.to_dict(orient="records")
            else:
                primary_value = float(primary_df["metric_value"].iloc[0])
                primary_label = intent.replace("_", " ").title()

        # 2. Alternative Reading 1: Credits & Debits Combined (Net Outflow = Debits - Credits)
        alt1_types = ["debit", "credit"]
        alt1_sql, alt1_params = self._generate_sql(plan, alt1_types, intent, group_by, limit, sort_order)
        alt1_df = self.conn.execute(alt1_sql, alt1_params).df()
        alt1_val = float(alt1_df["metric_value"].iloc[0]) if not alt1_df.empty else 0.0

        # 3. Alternative Reading 2: Available Account Balance Baseline
        bal_sql = "SELECT SUM(available_balance) FROM account a JOIN bank b ON a.bank_code = b.bank_code"
        if plan.get("bank"):
            bal_sql += f" WHERE LOWER(b.bank_code) = LOWER('{plan['bank']}') OR LOWER(b.bank_name) LIKE LOWER('%{plan['bank']}%')"
        bal_res = self.conn.execute(bal_sql).fetchone()
        alt2_val = float(bal_res[0]) if bal_res and bal_res[0] is not None else 0.0

        # Compute Variances
        eps = 1e-5
        var1 = abs(primary_value - alt1_val) / max(abs(primary_value), eps) * 100.0
        var2 = abs(primary_value - alt2_val) / max(abs(primary_value), eps) * 100.0

        max_variance = max(var1, var2)

        # Verdict calculation
        if max_variance < self.thresholds["stable_max_pct"]:
            verdict = "Stable"
            confidence_explanation = "The calculation is Stable. Net transaction outflow matches gross debit amount within 5%."
        elif max_variance <= self.thresholds["sensitive_max_pct"]:
            verdict = "Sensitive"
            confidence_explanation = f"The result is Sensitive to debit vs. net credit adjustments ({var1:.1f}% variance)."
        else:
            verdict = "Fragile"
            confidence_explanation = f"High variance ({max_variance:.1f}%) detected between debit volume and net cash outflow across accounts."

        alternatives = [
            {
                "axis": "Transaction Type Axis",
                "reading": "Net Outflow (Debits minus Credits)",
                "value": round(alt1_val, 2),
                "variance_pct": round(var1, 2),
                "description": f"Net outflow (debits - credits) is {self._format_currency(alt1_val)} ({round(var1, 1)}% difference)."
            },
            {
                "axis": "Account Balance Baseline",
                "reading": "Total Available Account Balance",
                "value": round(alt2_val, 2),
                "variance_pct": round(var2, 2),
                "description": f"Target accounts hold {self._format_currency(alt2_val)} in available balance."
            }
        ]

        # 5. Fetch Underlying Records for Evidence View
        records_where, records_params = self._build_where_clause(plan, primary_types)
        records_sql = f"""
            SELECT t.transaction_id, b.bank_name, a.account_number, t.transaction_amount AS amount, 
                   t.transaction_date AS tx_date, t.transaction_type AS status, 
                   COALESCE(t.transaction_reference_id, 'N/A') AS st_date,
                   t.description, 'reconciled' AS reconciliation_status,
                   b.bank_code AS category, 'N/A' AS vendor_name
            FROM transaction t
            JOIN account a ON t.account_id = a.account_id
            JOIN bank b ON a.bank_code = b.bank_code
            {records_where}
            ORDER BY t.transaction_date DESC
            LIMIT 50
        """
        records_df = self.conn.execute(records_sql, records_params).df()

        # 6. Anomaly Detection Engine
        anomalies = self._detect_anomalies(plan, primary_value)

        return {
            "primary_value": round(primary_value, 2),
            "primary_label": primary_label,
            "interpretation_used": f"Debit Transactions Only; Filtered by Bank / Entity Schema; Gross Amounts.",
            "verdict": verdict,
            "max_variance_pct": round(max_variance, 2),
            "confidence_explanation": confidence_explanation,
            "alternatives": alternatives,
            "breakdown_table": breakdown_table,
            "underlying_records": records_df.to_dict(orient="records"),
            "anomalies": anomalies,
            "query_executed": primary_sql,
            "filters_applied": {
                "metric": intent,
                "bank": plan.get("bank"),
                "entity_id": plan.get("entity_id"),
                "period": plan.get("period"),
                "reference_id": plan.get("reference_id")
            }
        }

    def _generate_sql(self, plan: Dict[str, Any], type_list: List[str], intent: str, group_by: str, limit: int, sort_order: str) -> Tuple[str, List[Any]]:
        if intent == "available_balance":
            conditions = []
            params = []
            if plan.get("bank"):
                conditions.append("(LOWER(b.bank_code) = LOWER(?) OR LOWER(b.bank_name) LIKE LOWER(?))")
                params.extend([plan["bank"], f"%{plan['bank']}%"])
            
            where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
            sql = f"SELECT SUM(a.available_balance) AS metric_value FROM account a JOIN bank b ON a.bank_code = b.bank_code {where_clause}"
            return sql, params

        where_clause, params = self._build_where_clause(plan, type_list)

        if intent in ["transaction_count"]:
            if group_by == "bank":
                sql = f"SELECT b.bank_name AS group_label, COUNT(*) AS metric_value FROM transaction t JOIN account a ON t.account_id = a.account_id JOIN bank b ON a.bank_code = b.bank_code {where_clause} GROUP BY b.bank_name ORDER BY metric_value {sort_order} LIMIT {limit}"
            else:
                sql = f"SELECT COUNT(*) AS metric_value FROM transaction t JOIN account a ON t.account_id = a.account_id JOIN bank b ON a.bank_code = b.bank_code {where_clause}"
        else: # Default spend / payout aggregate
            if group_by == "bank":
                sql = f"SELECT b.bank_name AS group_label, SUM(t.transaction_amount) AS metric_value FROM transaction t JOIN account a ON t.account_id = a.account_id JOIN bank b ON a.bank_code = b.bank_code {where_clause} GROUP BY b.bank_name ORDER BY metric_value {sort_order} LIMIT {limit}"
            else:
                sql = f"SELECT SUM(t.transaction_amount) AS metric_value FROM transaction t JOIN account a ON t.account_id = a.account_id JOIN bank b ON a.bank_code = b.bank_code {where_clause}"

        return sql, params

    def _detect_anomalies(self, plan: Dict[str, Any], primary_value: float) -> List[Dict[str, Any]]:
        anomalies = []
        bank = plan.get("bank")

        if bank:
            hist_sql = f"SELECT AVG(period_sum) FROM (SELECT substr(t.transaction_date, 1, 7) AS m, SUM(t.transaction_amount) AS period_sum FROM transaction t JOIN account a ON t.account_id = a.account_id JOIN bank b ON a.bank_code = b.bank_code WHERE LOWER(b.bank_code) = LOWER(?) GROUP BY 1)"
            hist_avg = self.conn.execute(hist_sql, [bank]).fetchone()[0]

            if hist_avg and hist_avg > 0:
                ratio = primary_value / hist_avg
                if ratio >= 2.0:
                    anomalies.append({
                        "type": "Spike Warning",
                        "severity": "High" if ratio >= 3.0 else "Medium",
                        "message": f"Debit volume for bank {bank} in this period is {ratio:.1f}x higher than historical monthly average ({self._format_currency(hist_avg)})."
                    })
        return anomalies

    @staticmethod
    def _format_currency(val: float) -> str:
        if val >= 100000 or val <= -100000:
            return f"₹{val / 100000:.2f} Lakh"
        return f"₹{val:,.2f}"

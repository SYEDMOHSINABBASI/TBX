import os
import json
import pandas as pd

def compute_ground_truth(data_dir="services/query/data"):
    if not os.path.isabs(data_dir):
        data_dir = os.path.join(os.path.dirname(__file__), "..", data_dir)

    tx_path = os.path.join(data_dir, "transaction.parquet")
    if not os.path.exists(tx_path):
        tx_path = os.path.join(os.path.dirname(__file__), "..", "data", "transaction.parquet")

    print(f"Computing pandas ground truth from {tx_path}...")
    df_tx = pd.read_parquet(tx_path)

    # Convert date
    df_tx['dt'] = pd.to_datetime(df_tx['transaction_date'])

    # Compute spend last month (May 2026 or previous month relative to max date)
    max_dt = df_tx['dt'].max()
    prev_month_start = (max_dt - pd.DateOffset(months=1)).replace(day=1)
    prev_month_end = prev_month_start + pd.DateOffset(months=1) - pd.DateOffset(days=1)

    may_debits = df_tx[(df_tx['dt'] >= '2026-05-01') & (df_tx['dt'] <= '2026-05-31') & (df_tx['transaction_type'] == 'debit')]['transaction_amount'].sum()
    june_debits = df_tx[(df_tx['dt'] >= '2026-06-01') & (df_tx['dt'] <= '2026-06-30') & (df_tx['transaction_type'] == 'debit')]['transaction_amount'].sum()

    ground_truth = {
      "spend_last_month": float(may_debits),
      "spend_june_2026": float(june_debits),
      "max_date_in_data": str(max_dt.strftime("%Y-%m-%d")),
      "total_transactions": len(df_tx)
    }

    out_file = os.path.join(os.path.dirname(__file__), "ground_truth.json")
    with open(out_file, "w") as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Ground truth calculated successfully: May Debits = Rs. {may_debits:,.2f}, June Debits = Rs. {june_debits:,.2f}")
    return ground_truth

if __name__ == "__main__":
    compute_ground_truth()

import os
import random
import uuid
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def generate_dataset(num_transactions=100000, output_dir="data"):
    os.makedirs(output_dir, exist_ok=True)
    
    bank_parquet = os.path.join(output_dir, "bank.parquet")
    account_parquet = os.path.join(output_dir, "account.parquet")
    transaction_parquet = os.path.join(output_dir, "transaction.parquet")

    print(f"Generating 3-table dataset (bank, account, {num_transactions:,} transactions)...")

    np.random.seed(42)
    random.seed(42)

    # 1. Bank Table Data
    banks_data = [
        {"bank_code": "HDFC", "bank_name": "HDFC BANK LIMITED"},
        {"bank_code": "ICIC", "bank_name": "ICICI BANK LIMITED"},
        {"bank_code": "SBIN", "bank_name": "STATE BANK OF INDIA"},
        {"bank_code": "UTIB", "bank_name": "AXIS BANK LIMITED"},
        {"bank_code": "KKBK", "bank_name": "KOTAK MAHINDRA BANK LIMITED"},
        {"bank_code": "CNRB", "bank_name": "CANARA BANK"},
        {"bank_code": "UBIN", "bank_name": "UNION BANK OF INDIA"},
        {"bank_code": "AUBL", "bank_name": "AU SMALL FINANCE BANK LIMITED"},
        {"bank_code": "TMBL", "bank_name": "TAMILNAD MERCANTILE BANK LIMITED"},
        {"bank_code": "RATN", "bank_name": "RBL BANK LIMITED"}
    ]
    df_bank = pd.DataFrame(banks_data)

    # 2. Account Table Data (Sample rows + generated accounts)
    sample_accounts = [
        {"account_id": "acfbe204-7541-492c-a352-040aa984bedc", "entity_id": "f2f5e332-c2d1-4555-9a6b-65c7cd195077", "account_number": "50200013729069", "program_id": 21, "available_balance": -25907487.00, "bank_code": "HDFC"},
        {"account_id": "6f306737-dfa8-4bf7-8003-be64034b8dea", "entity_id": "2d52dda2-d98a-4381-af80-45bdb173860c", "account_number": "50200099284137", "program_id": 21, "available_balance": -94766029.00, "bank_code": "HDFC"},
        {"account_id": "bfbfe347-11d6-48d7-acff-4f091f59d34b", "entity_id": "e767c3c1-3a0d-43b5-b2ff-06f49bdf3de2", "account_number": "39208809622308", "program_id": 4,  "available_balance": 40842693.08,  "bank_code": "UBIN"},
        {"account_id": "212239b5-63d9-4da6-aa8c-46485e0f8a42", "entity_id": "ac1a0654-461b-4216-95d1-bbcb9ab6da4e", "account_number": "30123456789012", "program_id": 46, "available_balance": 109283.80,    "bank_code": "SBIN"},
        {"account_id": "34448e78-c3fe-4b5d-be8c-a45a6349b8d4", "entity_id": "e984c75d-aad6-4655-823a-4e9e06a869bc", "account_number": "40100556677889", "program_id": 21, "available_balance": 231680596.77, "bank_code": "UTIB"},
        {"account_id": "5cecd2c2-f075-4bbd-a08b-b156ca48dc7e", "entity_id": "e0000005-0000-0000-0000-000000000005", "account_number": "60100112233445", "program_id": 4,  "available_balance": -131629423.33,"bank_code": "HDFC"},
        {"account_id": "e767c3c1-3a0d-43b5-b2ff-06f49bdf3de2", "entity_id": "00000006-0000-0000-0000-000000000006", "account_number": "70100334455667", "program_id": 21, "available_balance": 8695000.75,   "bank_code": "KKBK"},
        {"account_id": "2d52dda2-d98a-4381-af80-45bdb173860c", "entity_id": "00000007-0000-0000-0000-000000000007", "account_number": "80100123456789", "program_id": 46, "available_balance": 3887946.81,   "bank_code": "CNRB"},
        {"account_id": "ac1a0654-461b-4216-95d1-bbcb9ab6da4e", "entity_id": "00000008-0000-0000-0000-000000000008", "account_number": "90100987654321", "program_id": 21, "available_balance": 3278516.63,   "bank_code": "SBIN"},
        {"account_id": "e984c75d-aad6-4655-823a-4e9e06a869bc", "entity_id": "00000009-0000-0000-0000-000000000009", "account_number": "20100556677889", "program_id": 46, "available_balance": -117420771.35,"bank_code": "ICIC"}
    ]

    # Additional accounts to reach ~50 realistic corporate accounts
    accounts_data = list(sample_accounts)
    account_ids = [a["account_id"] for a in sample_accounts]
    bank_codes = [b["bank_code"] for b in banks_data]

    for i in range(len(sample_accounts), 50):
        acc_id = str(uuid.uuid4())
        ent_id = str(uuid.uuid4())
        acc_num = f"5020{random.randint(10000000, 99999999)}"
        prog_id = random.choice([4, 21, 46])
        bal = round(random.uniform(-50000000, 150000000), 2)
        b_code = random.choice(bank_codes)

        accounts_data.append({
            "account_id": acc_id,
            "entity_id": ent_id,
            "account_number": acc_num,
            "program_id": prog_id,
            "available_balance": bal,
            "bank_code": b_code
        })
        account_ids.append(acc_id)

    df_account = pd.DataFrame(accounts_data)

    # 3. Transaction Table Data
    sample_txns = [
        {"transaction_id": "001cb576-eb28-44b1-a219-0f3f27093fad", "account_id": "acfbe204-7541-492c-a352-040aa984bedc", "transaction_date": "2026-06-24 18:24:06.000000", "transaction_type": "debit",  "description": "FT -  95842568 -  50200013729069 - SELECTION ELECTRONICS   DAHISAR EAST",  "transaction_amount": 14866.00,  "transaction_reference_id": "1715499972", "utr_number": "jhI5nAdyb1qOEjmcB3JvWjC6tTO+ZPVqBFPm/GiErC4TRBWRQ5ylPG3p"},
        {"transaction_id": "0021433a-8d92-40e9-b811-5ba994747975", "account_id": "6f306737-dfa8-4bf7-8003-be64034b8dea", "transaction_date": "2026-05-14 11:31:37.000000", "transaction_type": "debit",  "description": "UPI-NAVYUG SELECTION-XXXXXX8672-AUBL0002125-103293775381-260514201735136",      "transaction_amount": 50000.00,  "transaction_reference_id": "103293775381","utr_number": "jhI5nAdyb1qOEjmcB3JvWjC9tzSzbvtkBlK+NSqsiL164ZK8Bl8cYg8y1l8="},
        {"transaction_id": "00baf475-8710-4d17-b626-d25fc311eb7f", "account_id": "5cecd2c2-f075-4bbd-a08b-b156ca48dc7e", "transaction_date": "2025-12-16 18:13:34.000000", "transaction_type": "credit", "description": "R/RATNR52025121600100235/ZBFLCTP405PBL15667333//SELECTRICITY TWO PRIVATE LIMITED/RATNR52025121600100235 /SELECTRICITY TWO PRIVATE LIMITED", "transaction_amount": 260000.00, "transaction_reference_id": "S31125841", "utr_number": None},
        {"transaction_id": "014b7179-e696-4837-9b8e-7164d171b760", "account_id": "acfbe204-7541-492c-a352-040aa984bedc", "transaction_date": "2026-06-24 06:39:10.000000", "transaction_type": "debit",  "description": "NEFT  - UTIB0002678 - 95604250 - 915020031685136 - UMANG SELECTIONHAPURBPES DPF10129", "transaction_amount": 7959.00, "transaction_reference_id": "HDFCH01078329532", "utr_number": "jhI5nAdyb1qOEjmcB3JvWknJwkXCbf1jBFm1NhmQqR0EoF/PNGRDCa1+UTH2I/tV"},
        {"transaction_id": "000000ac-39c5-4eb3-9fe3-ed40ceecee5d", "account_id": "e984c75d-aad6-4655-823a-4e9e06a869bc", "transaction_date": "2025-12-03 16:24:54.000000", "transaction_type": "debit",  "description": "NEFT/000483399203/ICIC/PARESH VIKRANT GHASE",                                               "transaction_amount": 9241.00,  "transaction_reference_id": "S5314253",  "utr_number": None},
        {"transaction_id": "04818df6-e726-4405-a8e3-4f6c15caa956", "account_id": "e767c3c1-3a0d-43b5-b2ff-06f49bdf3de2", "transaction_date": "2026-01-02 09:58:41.000000", "transaction_type": "credit", "description": "IMPS/P2A/600228462725/UTIB/918020101986700/00/INET/9211/SELECTIONMALIGAI/ZBFLCTP5L2PBL11476675/INWD48", "transaction_amount": 36810.00, "transaction_reference_id": "S69244711", "utr_number": None},
        {"transaction_id": "0178b656-4a7d-98e8-9540f6e24caf", "account_id": "ac1a0654-461b-4216-95d1-bbcb9ab6da4e", "transaction_date": "2026-03-17 14:53:45.000000", "transaction_type": "debit",  "description": "IMPS OW/507614422198/Gautam singh/SBIN/43292707719",                                          "transaction_amount": 110.00,   "transaction_reference_id": None,       "utr_number": None},
        {"transaction_id": "0266384b-929c-478d-a7da-a54acf984343", "account_id": "acfbe204-7541-492c-a352-040aa984bedc", "transaction_date": "2026-06-24 06:30:27.000000", "transaction_type": "debit",  "description": "NEFT  - ICIC0001241 - 95584112 - 124105002702 - SELECTION MOBILE",                             "transaction_amount": 66899.00,  "transaction_reference_id": "HDFCH01078324740", "utr_number": "jhI5nAdyb1qOEjmcB3JvWknJwkXCbf1jBFm1NhSSrh+QRpxgqe0VEdKaiI24S8Up"},
        {"transaction_id": "02c96198-4397-4160-b5ce-607f6696f581", "account_id": "acfbe204-7541-492c-a352-040aa984bedc", "transaction_date": "2026-06-24 06:56:01.000000", "transaction_type": "debit",  "description": "NEFT  - ICIC0001241 - 95600270 - 124105002702 - SELECTION MOBILE",                             "transaction_amount": 79575.00,  "transaction_reference_id": "HDFCH01078342174", "utr_number": "jhI5nAdyb1qOEjmcB3JvWknJwkXCbf1jBFm1MBKUrRvYyGUaTtHlT1wi23x31CRl"},
        {"transaction_id": "038969bd-5941-4d13-ba9f-dda911cc0b4e", "account_id": "6f306737-dfa8-4bf7-8003-be64034b8dea", "transaction_date": "2026-05-20 09:49:02.000000", "transaction_type": "debit",  "description": "FT-RERELI2010000810-RELIANCEDIGITAL RETAIL LTD   SELECT CITY SAKET DELHI",                     "transaction_amount": 21156.00,  "transaction_reference_id": "1643797818", "utr_number": "jhI5nAdyb1qOEjmcB3JvWjC7sDW9ZPtrAllbY+gS/wWLLijTRu8nX6op"}
    ]

    txns_data = list(sample_txns)

    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 6, 30)
    total_seconds = int((end_date - start_date).total_seconds())

    descriptions = [
        "FT -  95842568 -  50200013729069 - SELECTION ELECTRONICS   DAHISAR EAST",
        "UPI-NAVYUG SELECTION-XXXXXX8672-AUBL0002125-103293775381-260514201735136",
        "NEFT  - UTIB0002678 - 95604250 - 915020031685136 - UMANG SELECTIONHAPURBPES DPF10129",
        "IMPS/P2A/600228462725/UTIB/918020101986700/00/INET/9211/SELECTIONMALIGAI",
        "NEFT/000483399203/ICIC/PARESH VIKRANT GHASE",
        "FT-RERELI2010000810-RELIANCEDIGITAL RETAIL LTD   SELECT CITY SAKET DELHI",
        "IMPS OW/507614422198/Gautam singh/SBIN/43292707719",
        "NEFT  - ICIC0001241 - 95584112 - 124105002702 - SELECTION MOBILE",
        "Vendor Payout - Cloud Hosting Infrastructure - AWS India",
        "Vendor Payout - Marketing Services - Google Ads India"
    ]

    for i in range(len(sample_txns), num_transactions):
        tx_id = str(uuid.uuid4())
        acc_id = random.choice(account_ids)

        sec_offset = random.randint(0, total_seconds)
        tx_dt = start_date + timedelta(seconds=sec_offset)
        tx_dt_str = tx_dt.strftime("%Y-%m-%d %H:%M:%S.000000")

        tx_type = random.choices(["debit", "credit"], weights=[0.75, 0.25])[0]
        desc = random.choice(descriptions)

        amt = round(random.uniform(500, 250000), 2)
        ref_id = f"S{random.randint(1000000, 9999999)}" if random.random() > 0.1 else None
        utr = f"jhI5nAdyb1qOEjmcB3JvW{random.randint(100000, 999999)}" if random.random() > 0.3 else None

        txns_data.append({
            "transaction_id": tx_id,
            "account_id": acc_id,
            "transaction_date": tx_dt_str,
            "transaction_type": tx_type,
            "description": desc,
            "transaction_amount": amt,
            "transaction_reference_id": ref_id,
            "utr_number": utr
        })

    df_txn = pd.DataFrame(txns_data)

    # Save to Parquet
    df_bank.to_parquet(bank_parquet, index=False)
    df_account.to_parquet(account_parquet, index=False)
    df_txn.to_parquet(transaction_parquet, index=False)

    print("3-Table dataset created successfully:")
    print(f"  - bank.parquet: {len(df_bank)} rows")
    print(f"  - account.parquet: {len(df_account)} rows")
    print(f"  - transaction.parquet: {len(df_txn):,} rows")

if __name__ == "__main__":
    generate_dataset()

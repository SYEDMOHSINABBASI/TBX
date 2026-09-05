import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from engine import VeritasEngine, generate_dataset

app = FastAPI(
    title="Veritas Query Service",
    description="Deterministic financial query service over DuckDB with interpretation stability verification and Counterparty Resolver",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "transaction.parquet")
if not os.path.exists(DATA_PATH):
    print("Dataset not found. Auto-generating Veritas synthetic transactions dataset...")
    generate_dataset(num_transactions=100000, output_dir=os.path.join(os.path.dirname(__file__), "data"))

engine = VeritasEngine(config_path=os.path.join(os.path.dirname(__file__), "schema_config.json"))

class QueryPlanRequest(BaseModel):
    intent: str = Field("total_spend", description="Metric or question intent")
    bank: Optional[str] = Field(None, description="Bank code or name")
    counterparty: Optional[str] = Field(None, description="Counterparty name")
    period: Optional[str] = Field(None, description="Date period relative to max date")
    start_date: Optional[str] = Field(None, description="ISO YYYY-MM-DD start date")
    end_date: Optional[str] = Field(None, description="ISO YYYY-MM-DD end date")
    reference_id: Optional[str] = Field(None, description="transaction_reference_id or utr_number")
    group_by: Optional[str] = Field(None, description="bank or counterparty")
    sort: Optional[str] = Field("desc", description="asc or desc")
    limit: Optional[int] = Field(10, description="Max rows")

@app.get("/health")
def health_check():
    return engine.get_schema_info()

@app.get("/schema")
def get_schema():
    return engine.get_schema_info()

@app.post("/query")
def run_query(request: QueryPlanRequest):
    try:
        plan = request.model_dump()
        result = engine.execute_query(plan)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

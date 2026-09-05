import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from engine import TruthEngine, generate_dataset

app = FastAPI(
    title="TBX Truth Engine Query Service",
    description="Deterministic financial query engine over DuckDB with multi-axis stability verification",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure dataset exists on startup
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "transactions.parquet")
if not os.path.exists(DATA_PATH):
    print("Dataset not found. Auto-generating synthetic transactions dataset...")
    generate_dataset(num_records=100000, output_dir=os.path.join(os.path.dirname(__file__), "data"))

engine = TruthEngine(config_path=os.path.join(os.path.dirname(__file__), "schema_config.json"))

class QueryPlanRequest(BaseModel):
    intent: str = Field("total_spend", description="Metric or question intent")
    vendor: Optional[str] = Field(None, description="Filtered vendor name")
    category: Optional[str] = Field(None, description="Filtered spending category")
    period: Optional[str] = Field(None, description="Date period name (e.g. last month, Q4 2025)")
    start_date: Optional[str] = Field(None, description="ISO YYYY-MM-DD start date")
    end_date: Optional[str] = Field(None, description="ISO YYYY-MM-DD end date")
    reconciliation_status: Optional[str] = Field(None, description="reconciled or unreconciled")
    group_by: Optional[str] = Field(None, description="Grouping column (vendor, category)")
    sort: Optional[str] = Field("desc", description="Sort order asc or desc")
    limit: Optional[int] = Field(10, description="Max rows returned")

@app.get("/health")
def health_check():
    info = engine.get_schema_info()
    return {
        "status": "online",
        "engine": "DuckDB",
        "records_loaded": info["total_records"],
        "date_range": info["date_range"],
        "table_name": engine.table_name
    }

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

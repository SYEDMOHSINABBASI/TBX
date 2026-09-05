import { NextRequest, NextResponse } from 'next/server';
import { extractQueryPlan, generateExplanation } from '@/lib/llm';
import { VerifiedResultPackage } from '@/lib/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Valid user message string is required' }, { status: 400 });
    }

    // Step 1: Extract intent into structured query plan
    const extractionResult = await extractQueryPlan(message, history);

    if (extractionResult.isClarification) {
      return NextResponse.json({
        role: 'assistant',
        content: extractionResult.clarificationMessage,
        is_clarification: true,
        clarification_options: [
          "Total spending last month",
          "Highest vendor payout last quarter",
          "Unreconciled transactions summary"
        ]
      });
    }

    const plan = extractionResult.plan;
    if (!plan) {
      return NextResponse.json({
        role: 'assistant',
        content: "I'm sorry, I couldn't understand that request. Could you rephrase or ask about spend, vendor payouts, or reconciliation items?",
        is_clarification: true
      });
    }

    // Step 2: Query FastAPI backend DuckDB Engine
    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
    } catch (err) {
      console.error("Failed to connect to FastAPI backend query service:", err);
      return NextResponse.json({
        error: "Query service unavailable. Please ensure the Python backend server is running on port 8000."
      }, { status: 503 });
    }

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return NextResponse.json({ error: `Backend query failed: ${errorText}` }, { status: 500 });
    }

    const resultPackage: VerifiedResultPackage = await backendRes.json();

    // Step 3: Generate natural language explanation using verified package numbers only
    const explanation = await generateExplanation(resultPackage);
    resultPackage.explanation = explanation;

    return NextResponse.json({
      role: 'assistant',
      content: explanation,
      query_plan: plan,
      result_package: resultPackage
    });

  } catch (error: any) {
    console.error("Orchestrator chat API error:", error);
    return NextResponse.json({ error: error.message || 'Internal Orchestrator Error' }, { status: 500 });
  }
}

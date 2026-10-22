import { NextRequest, NextResponse } from "next/server";
import { getDailyUsageSummary } from "@/lib/ai-monitor";
import { getModelPricing, PRICING_DISCLAIMER } from "@/config/ai-pricing";
import { getAlertThresholds } from "@/config/ai-alerts";

export const runtime = "nodejs";

/**
 * GET /api/monitoring/usage
 *
 * Query params:
 *   - date: optional YYYY-MM-DD (defaults to today)
 *
 * Security:
 *   If MONITORING_SECRET_KEY is set in environment, request must provide matching
 *   Bearer token in Authorization header or X-Monitoring-Key header.
 */
export async function GET(req: NextRequest) {
  const secretKey = process.env.MONITORING_SECRET_KEY;
  if (secretKey) {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-monitoring-key");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : customHeader?.trim();

    if (token !== secretKey) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing monitoring secret key." },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date") ?? undefined;

  // Basic YYYY-MM-DD regex check if provided
  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: "Invalid date format. Expected YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const summary = await getDailyUsageSummary(dateParam);
    const pricing = getModelPricing();
    const thresholds = getAlertThresholds();

    return NextResponse.json(
      {
        summary,
        pricing: {
          currentRates: pricing,
          disclaimer: PRICING_DISCLAIMER,
        },
        thresholds,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[monitoring/usage] Error generating summary:", err);
    return NextResponse.json(
      { error: "Internal server error fetching usage summary." },
      { status: 500 }
    );
  }
}

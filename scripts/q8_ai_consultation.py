#!/usr/bin/env python3
"""Q8 — AI consultation for dashboard & visualization recommendations."""

import json, os, sys
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent.parent

def call_claude(prompt: str, api_key: str) -> str:
    """Call Claude API and return the response text."""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["content"][0]["text"]


def main():
    api_key = os.environ["ANTHROPIC_API_KEY"]

    context = """
    DATA CONTEXT:
    - Dataset: 48,123 rows (10-min intervals), 12 sites, 36 days (Jul 19 – Aug 23, 2023)
    - PM2.5: 98% valid (mean ~9.5 µg/m³), column pa_mean_pm2_5_atm_b_corr_2
    - WBGT: 96% valid (mean ~65.9 °F), column kes_mean_wbgt_f
    - Temporal columns: hour, dow_name (day-of-week), is_weekend

    KEY FINDINGS FROM ANALYSIS:
    - PM2.5 peaks at 12:00 (10.6 µg/m³), trough at 01:00 (8.5 µg/m³), amplitude 2.1 µg/m³
    - WBGT peaks at 17:00 (67.2 °F), trough at 06:00 (64.2 °F), amplitude 3.1 °F
    - PM2.5 and WBGT have OPPOSITE diurnal cycles (~5-hour offset)
    - Compound exposure window: late afternoon 3–6 PM when both are elevated
    - PM2.5 peak DOW: Monday (10.9 µg/m³); WBGT peak DOW: Friday (68.1 °F)
    - Weekend PM2.5 slightly higher than weekday (10.0 vs 9.3 µg/m³)
    - Weekday WBGT slightly higher than weekend (66.0 vs 65.6 °F)
    - All temporal effects highly significant (Kruskal-Wallis p ≈ 0)
    - Hour effect on PM2.5: H=743, p=3.87e-142
    - Hour effect on WBGT: H=1896, p≈0
    - DOW effect on PM2.5: H=1812, p≈0
    - DOW effect on WBGT: H=3614, p≈0

    SITE HETEROGENEITY:
    - PM2.5 peak hour consensus: 12:00 (6/12 sites)
    - WBGT peak hour consensus: 18:00 (3/12 sites, more dispersed)
    - PM2.5 diurnal amplitude range: 1.2 µg/m³ (Mary Soo Hoo) – 3.9 µg/m³ (Chin Park)
    - WBGT diurnal amplitude range: 2.0 °F (Oxford) – 4.3 °F (Chin Park, Tufts)
    - Chin Park: most temporally variable site (largest amplitudes for both)
    - Mary Soo Hoo: most stable site (smallest PM2.5 amplitude, late peak at 20:00)
    - Wednesday PM2.5 hotspot driven by mid-study wildfire smoke event (Aug 16)

    FIGURES GENERATED (7):
    - q8_diurnal_profiles.png — PM2.5 & WBGT mean ± SD diurnal curves
    - q8_dow_profiles.png — Day-of-week bar charts
    - q8_hour_dow_heatmap.png — Hour × DOW annotated heatmaps
    - q8_weekday_weekend.png — Weekday vs weekend diurnal overlays
    - q8_site_diurnal.png — 12-site diurnal overlay
    - q8_site_pm25_heatmaps.png — Per-site PM2.5 hour × DOW heatmaps
    - q8_site_wbgt_heatmaps.png — Per-site WBGT hour × DOW heatmaps

    UNTAPPED OPPORTUNITIES:
    - Compound-exposure metric: hours when both PM2.5 and WBGT exceed thresholds simultaneously
    - Seasonal progression: do diurnal patterns shift across the 36-day study?
    - Rush-hour analysis: traffic-linked PM2.5 peaks at commute times
    - Night cooling deficit: sites with persistently high overnight WBGT
    - Autocorrelation: how persistent are high-PM2.5 or high-WBGT episodes?
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 8**: What time(s) of day and day(s) of week are associated with the highest
    wet bulb globe temperatures and PM2.5 overall and for each open space site?

    Here is the context of what we have analyzed so far and what data is available:

    {context}

    Please provide:

    1. **ADDITIONAL ANALYSES** (3-7 items): What else should we compute, test, or visualize
       to thoroughly answer this question? For each item, specify:
       - What to compute/plot
       - Why it matters (what insight it provides)
       - Which columns/data to use

    2. **KPI RECOMMENDATIONS** (3-5 items): Key performance indicators or summary metrics
       that should be prominently displayed. For each:
       - KPI name and formula/definition
       - Why it's meaningful for this question

    3. **VISUALIZATION RECOMMENDATIONS** (4-8 items): Specific chart types and what they
       should show. For each:
       - Chart type (e.g., heatmap, scatter, violin, etc.)
       - What data it encodes
       - Why this chart type is the best choice
       - Any interactive features that would help

    4. **DASHBOARD LAYOUT** (1-2 dashboards): Describe the ideal layout for presenting
       this question's findings. Include:
       - Visual hierarchy (what the eye should see first)
       - Panel arrangement (grid description: what goes where)
       - Recommended filters (dropdowns, sliders, toggles)
       - Color scheme and style notes
       - Screen distribution (what % of space each element gets)
       - How elements interplay to tell a coherent story

    5. **EDUCATIONAL FRAMING**: How should we present this so a non-scientist
       (community member, city planner) can understand the findings? Suggest:
       - Key takeaway message (1 sentence)
       - Annotations or callouts for the most important patterns
       - Analogies or context to make numbers meaningful

    Format your response as structured JSON with these 5 top-level keys.
    """

    print("Calling Claude API for Q8 recommendations...")
    response = call_claude(prompt, api_key)

    # Save the raw response
    out_path = ROOT / "reports/phase3_refined/q8_ai_recommendations.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Try to parse as JSON, fall back to saving as text
    try:
        parsed = json.loads(response)
        out_path.write_text(json.dumps(parsed, indent=2))
        print("✅ Response saved as JSON")
    except json.JSONDecodeError:
        out_path.with_suffix(".md").write_text(response)
        print("⚠️  Response saved as markdown (not valid JSON)")

    print(f"Saved to {out_path}")
    return response


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Q3 — AI consultation for dashboard & visualization recommendations."""

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
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["content"][0]["text"]


def main():
    api_key = os.environ["ANTHROPIC_API_KEY"]

    context = """
    DATASET: 48,123 rows × 46 columns, 12 open-space sites in Boston Chinatown, 10-min intervals, Jul 19 – Aug 23, 2023.
    
    PM2.5 (Purple Air corrected): Mean=9.49 µg/m³, Median=8.33, P90=17.14, P95=19.14, Max=25.09
    - 46.3% observations exceed NAAQS annual (9.0 µg/m³), 0% exceed 24-hr (35 µg/m³)
    - Right-skewed (skew=0.65), fails normality and log-normality tests
    
    WBGT (Kestrel): Mean=65.86°F, Median=66.20, P90=72.50, P95=73.80, Max=77.50
    - 0% exceed any OSHA threshold (80/85/90°F) — study period was not extreme
    - Nearly symmetric (skew=-0.05)
    
    PM2.5 × WBGT correlation: Pearson r=0.36, Spearman rho=0.37 (moderate)
    
    DAY vs NIGHT (KS tests both p<1e-50):
    - Day: PM2.5 P90=18.12, WBGT mean=66.20 | Night: PM2.5 P90=16.34, WBGT mean=65.53
    
    FOUR TIME PERIODS:
    - Night(0-5): PM2.5 P90=15.51 | WBGT P90=70.50
    - Morning(6-11): PM2.5 P90=16.90 | WBGT P90=72.38
    - Afternoon(12-17): PM2.5 P90=19.63 | WBGT P90=73.90
    - Evening(18-23): PM2.5 P90=17.44 | WBGT P90=72.00
    All pairwise KS tests significant (p<1e-9)
    
    INTER-SITE VARIABILITY:
    - PM2.5: Chin Park highest (median=9.97), Oxford Place lowest (median=7.36). Range:2.61 µg/m³
    - WBGT: Castle Square highest (median=66.70), Mary Soo Hoo lowest (median=65.50). Range:1.20°F
    - Largest PM2.5 CDF separation: Chin Park vs Oxford Place (D=0.288)
    - All 12 sites significantly different from overall PM2.5 CDF (KS p<0.01)
    - WBGT CDFs more uniform: 4 sites (Dewey, Greenway, Lyndboro, Tai Tung) NOT significantly different from overall
    
    DUAL EXPOSURE:
    - 35.2% of records have PM2.5>9 AND WBGT>65 simultaneously
    - Berkeley Garden worst (43.8%), Oxford Place best (27.0%)
    - Peaks midday (12-2pm)
    
    WEEKLY VARIATION:
    - Week 30 (hot): PM2.5 P50=11.28, WBGT P50=70.30
    - Week 33 (cool): PM2.5 P50=4.98, WBGT P50=66.20
    - All weekly CDFs significantly differ from overall (D>0.13)
    
    HUMIDITY EFFECT:
    - Dry (<50%): PM2.5 P90=18.18, WBGT P90=69.60
    - Humid (70-85%): PM2.5 P90=17.34, WBGT P90=73.40
    - Very Humid (>85%): PM2.5 drops to P90=14.01 (washout effect)
    - Non-monotonic PM2.5-humidity relationship
    
    LAND-USE:
    - Roads correlate with PM2.5 percentiles (r≈0.63, p<0.03)
    - Impervious surface inversely correlates with WBGT P90 (r=-0.57, p=0.053)
    
    WEEKEND/WEEKDAY: Weekend PM2.5 median higher (9.39 vs 7.47), but P90 lower (16.41 vs 17.49)
    
    EXISTING FIGURES (from Phase 3 initial work):
    - q3_cdf_overall.png: Side-by-side overall PM2.5 and WBGT CDFs with regulatory thresholds
    - q3_cdf_day_night.png: Day vs night CDFs for both variables
    - q3_cdf_by_site.png: 12-site overlay CDFs for both variables
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 3**: Create separate CDFs of PM2.5 and WBGT overall, by time of day, and per site.

    Here is the context of what we have analyzed so far and what data is available:

    {context}

    Please provide:

    1. **ADDITIONAL_ANALYSES** (3-7 items): What else should we compute, test, or visualize
       to thoroughly answer this question? For each item, specify:
       - What to compute/plot
       - Why it matters (what insight it provides)
       - Which columns/data to use

    2. **KPI_RECOMMENDATIONS** (3-5 items): Key performance indicators or summary metrics
       that should be prominently displayed. For each:
       - KPI name and formula/definition
       - Why it's meaningful for this question

    3. **VISUALIZATION_RECOMMENDATIONS** (4-8 items): Specific chart types and what they
       should show. For each:
       - Chart type (e.g., heatmap, scatter, violin, etc.)
       - What data it encodes
       - Why this chart type is the best choice
       - Any interactive features that would help

    4. **DASHBOARD_LAYOUT** (1-2 dashboards): Describe the ideal layout for presenting
       this question's findings. Include:
       - Visual hierarchy (what the eye should see first)
       - Panel arrangement (grid description: what goes where)
       - Recommended filters (dropdowns, sliders, toggles)
       - Color scheme and style notes
       - Screen distribution (what % of space each element gets)
       - How elements interplay to tell a coherent story

    5. **EDUCATIONAL_FRAMING**: How should we present this so a non-scientist
       (community member, city planner) can understand the findings? Suggest:
       - Key takeaway message (1 sentence)
       - Annotations or callouts for the most important patterns
       - Analogies or context to make numbers meaningful

    Format your response as structured JSON with these 5 top-level keys."""

    print("Calling Claude API for Q3 recommendations...")
    response = call_claude(prompt, api_key)

    out_path = ROOT / "reports/phase3_refined/q3_ai_recommendations.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        parsed = json.loads(response)
        out_path.write_text(json.dumps(parsed, indent=2))
        print("Saved as JSON")
    except json.JSONDecodeError:
        out_path.write_text(response)
        print("Saved as markdown")

    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()

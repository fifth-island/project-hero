#!/usr/bin/env python3
"""Q1 — AI consultation for dashboard & visualization recommendations."""

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
DATA SUMMARY:
- Dataset: 48,123 rows × 46 columns, 12 open-space sites in Boston Chinatown, 10-min intervals, Jul 19 – Aug 23, 2023
- PM2.5 columns: PurpleAir (pa_mean_pm2_5_atm_b_corr_2), DEP Chinatown FEM (dep_FEM_chinatown_pm2_5_ug_m3), DEP Nubian FEM (dep_FEM_nubian_pm2_5_ug_m3), EPA FEM (epa_pm25_fem)
- Meteorological columns: wind speed, wind direction, humidity, temperature, WBGT, dew point, pressure
- 12 sites: berkley, castle, chin, dewey, eliotnorton, greenway, lyndenboro, msh, oxford, reggie, taitung, tufts

EXISTING PHASE 3 Q1 ANALYSIS:
1. Scatter plots: PA vs DEP CT, PA vs DEP Nubian, PA vs EPA — all show strong linear relationships with Pearson r ~0.94
2. Bland-Altman: PA vs DEP CT — shows systematic positive bias, with mean diff = +1.53 µg/m³
3. Site-specific OLS regression: PA ~ DEP CT per site — slopes 0.89–1.16, intercepts -0.95 to +1.58, all R² > 0.85
4. Barkjohn correction: Applied PA correction factor 0.524×PA + 0.0862×RH + 0.5507 — reduced bias from 1.53 to ~0.2

ADDITIONAL EDA FINDINGS:
- Bias by concentration: Low PM2.5 (0-5 µg/m³) → bias +0.61; Medium (5-10) → +1.38; High (10-15) → +2.78; Very high (15-20) → +2.75; Extreme (20-30) → +1.58. Non-linear pattern — bias peaks at moderate-high concentrations
- Spearman correlations confirm Pearson: all ~0.94 (monotonic relationship holds)
- Daily bias time series (36 days): bias ranges from +0.04 (Jul 30) to +3.53 (Aug 5); highly variable day-to-day, correlated with PM2.5 concentration levels
- Diurnal pattern: daytime bias (1.95) nearly 2× nighttime (1.12); hourly peaks at 11-12 PM (2.44-2.46), trough at 1 AM (0.78)
- Humidity effect: modest. RH 20-40% → bias 1.43; 40-60% → 1.68; 60-80% → 1.63; 80-100% → 1.24. Slight decrease at very high humidity
- Wind speed effect: low wind (0-1 mph) → bias 1.84; moderate (2-3) → 1.40; higher (3-5) → 1.35. Stagnant air slightly amplifies bias
- Wind direction: S/SW winds carry highest bias (2.07/1.93), N/NW lowest (1.21/1.11). May relate to local emission sources
- Agreement: 63.2% within ±2 µg/m³, 94.6% within ±5 µg/m³
- Site-level Bland-Altman LOA: narrowest at reggie (width 5.87) and eliotnorton (6.15); widest at greenway (8.99) and castle (8.61)
- Reference-reference check: DEP CT vs DEP Nubian Pearson r = 0.962, RMSE = 1.23 → references agree well but not perfectly
- Imputed PA values (n=35): mean diff -0.47 vs non-imputed +1.53 — imputation introduces opposite bias but tiny sample

AVAILABLE BUT UNTAPPED:
- No site-level geographic visualization (no lat/lon in dataset, but could use nominal site positions)
- Land-use buffer columns (impervious_pct, tree_canopy_pct, etc.) could explain site-level bias differences
- Cross-pollutant context: EPA ozone, NO2, CO, SO2 could correlate with PA sensor interference
- Temperature/WBGT relationship to PA bias not explored
"""

    prompt = f"""You are a senior data visualization and dashboard design consultant
specializing in environmental health research and environmental justice.

I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

I need your help to enrich the analysis and design dashboards for the following
research question:

**Question 1**: How do Purple Air PM2.5 data at each of the 12 open space sites compare with MassDEP FEM PM2.5 data in Chinatown and Nubian Square?

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

Format your response as structured JSON with these 5 top-level keys."""

    print("Calling Claude API for Q1 recommendations...")
    response = call_claude(prompt, api_key)

    out_path = ROOT / "reports/phase3_refined/q1_ai_recommendations.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        parsed = json.loads(response)
        out_path.write_text(json.dumps(parsed, indent=2))
        print(f"Saved JSON to {out_path}")
    except json.JSONDecodeError:
        out_path = out_path.with_suffix(".md")
        out_path.write_text(response)
        print(f"Response saved as markdown (not valid JSON) to {out_path}")

    print("\n=== RESPONSE PREVIEW ===")
    print(response[:3000])


if __name__ == "__main__":
    main()

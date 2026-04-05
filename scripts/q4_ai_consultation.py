#!/usr/bin/env python3
"""Q4 — AI consultation for dashboard & visualization recommendations."""

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

    # --- Context block: filled by the agent with actual data summaries ---
    context = """
    **Dataset Context:**
    - 48,123 rows × 46 columns, July 19 – August 23, 2023
    - 12 monitoring sites in Boston's Chinatown
    - EPA pollutant data already integrated: epa_ozone, epa_so2, epa_co, epa_no2, epa_pm25_fem
    - Coverage: epa_ozone (97.4%), epa_so2 (93.4%), epa_co (97.7%), epa_no2 (86.3%), epa_pm25_fem (98.5%)
    - Data ranges: Ozone (0.00-0.06 ppm), SO2 (0.1-1.0 ppb), CO (0.14-0.99 ppm), NO2 (0-49 ppb), EPA PM2.5 (1.2-30.7 µg/m³)

    **Existing Phase 3 Analysis:**
    1. **Daily AQI calculations**: Computed EPA standard AQI sub-indices for each pollutant
    2. **Overall daily AQI**: Maximum of all sub-indices (mean: [VALUE], max: [VALUE])
    3. **Dominant pollutant analysis**: PM2.5 was dominant pollutant most days
    4. **Three figures generated**:
       - Stacked daily AQI component breakdown
       - Multi-pollutant correlation matrix (10x10 including meteorology)
       - Pollutant rose: PM2.5 concentrations by wind direction (16 sectors)

    **Available meteorological data**: Temperature, humidity, wind speed/direction, WBGT
    **Available spatial data**: Site coordinates, land-use percentages (25m/50m buffers)
    **Time resolution**: 10-minute intervals, can aggregate to hourly/daily
    
    **Gaps identified**:
    - No temporal patterns (hourly, day-of-week effects)
    - No AQI category analysis (Good/Moderate/Unhealthy thresholds)
    - No cross-site comparison of pollutant levels
    - No relationship with meteorology beyond correlation
    - No exceedance analysis (EPA standards)
    - Limited use of spatial data
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 4**: What were the air quality index and concentrations of other pollutants (CO, SO2, NO2, Ozone) in Chinatown between July 19 - August 2023 based on the MassDEP monitor? Extract data from website and merge with "data_HEROS" data.

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

    print(f"Calling Claude API for Q4 recommendations...")
    response = call_claude(prompt, api_key)

    # Save the raw response
    out_path = ROOT / f"reports/phase3_refined/q4_ai_recommendations.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Try to parse as JSON, fall back to saving as text
    try:
        parsed = json.loads(response)
        out_path.write_text(json.dumps(parsed, indent=2))
        print(f"Saved to {out_path}")
    except json.JSONDecodeError:
        out_path.with_suffix(".md").write_text(response)
        print(f"Response saved as markdown (not valid JSON): {out_path.with_suffix('.md')}")

    return response


if __name__ == "__main__":
    main()
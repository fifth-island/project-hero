#!/usr/bin/env python3
"""Q6 — AI consultation for dashboard & visualization recommendations."""

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
    DATASET OVERVIEW:
    • 48,123 records across 12 sites (berkley, castle, chin, dewey, eliotnorton, greenway, lyndenboro, msh, oxford, reggie, taitung, tufts)
    • Time period: July 19 - August 23, 2023 (36 days, 10-minute intervals)
    • No true "high AQI" days (>100) — highest AQI was 75.8 on July 26, 2023
    • AQI distribution: 69.4% Moderate (51-100), 30.6% Good (0-50)
    
    AQI CALCULATION:
    • Calculated from EPA pollutants: PM2.5 (range 6.7-75.8), Ozone (range 0.9-73.9), CO (range 1.6-11.2)
    • Overall AQI = maximum of individual pollutant AQIs
    • 47,395 PM2.5 AQI values (98.5% coverage), 46,848 Ozone AQI values (97.4% coverage)
    
    TOP 10 HIGHEST AQI DAYS:
    1. 2023-07-26 (Wed): AQI = 75.8
    2. 2023-08-20 (Sun): AQI = 73.9  
    3. 2023-07-24 (Mon): AQI = 73.9
    4. 2023-08-21 (Mon): AQI = 70.4
    5. 2023-08-09 (Wed): AQI = 70.2
    6. 2023-07-28 (Fri): AQI = 68.0
    7. 2023-08-07 (Mon): AQI = 64.6
    8. 2023-08-05 (Sat): AQI = 63.5
    9. 2023-07-27 (Thu): AQI = 63.3
    10. 2023-07-19 (Wed): AQI = 62.6
    
    PM2.5 DATA AVAILABLE:
    • Purple Air sensor data: pa_mean_pm2_5_atm_b_corr_2 (97.7% coverage, range 0.9-25.1 µg/m³, mean 9.5)
    • EPA FEM Chinatown: dep_FEM_chinatown_pm2_5_ug_m3 (100% coverage, range 0.8-24.7, mean 8.0)
    • EPA FEM Nubian: dep_FEM_nubian_pm2_5_ug_m3 (100% coverage, range 1.1-33.8, mean 8.1)
    • EPA Boston: epa_pm25_fem (98.5% coverage, range 1.2-22.4, mean 7.9)
    
    METEOROLOGICAL DATA:
    • Wind speed: mean_wind_speed_mph (100% coverage)
    • Wind direction: wind_direction_degrees_kr (100% coverage)  
    • Humidity: kes_mean_humid_pct (96.4% coverage)
    • Temperature: mean_temp_out_f, kes_mean_temp_f (100%, 96.4% coverage)
    • Heat index, dew point, barometric pressure available
    
    GEOGRAPHIC DATA:
    • Site coordinates available for mapping
    • Land use buffers (25m, 50m): Roads, Greenspace, Trees, Impervious, Industrial percentages
    • All sites have complete land use data (100% coverage)
    
    TEMPORAL DATA:
    • Hour, day_of_week, date_only, is_daytime columns
    • 10-minute resolution data allows temporal pattern analysis
    
    EXISTING PHASE3 ANALYSIS:
    • Created PM2.5 boxplots by site on top-5 AQI days
    • Generated wind rose colored by PM2.5 bins on high-AQI days
    • Calculated meteorological averages on high-AQI days
    • Found PM2.5 variation across sites on elevated AQI days
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 6**: Pick the highest AQI (Air Quality Index) days for summer of 2023 and visualize potential differences in PM2.5 across sites

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

    print(f"Calling Claude API for Q6 recommendations...")
    response = call_claude(prompt, api_key)

    # Save the raw response
    out_path = ROOT / f"reports/phase3_refined/q6_ai_recommendations.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Try to parse as JSON, fall back to saving as text
    try:
        parsed = json.loads(response)
        out_path.write_text(json.dumps(parsed, indent=2))
        print(f"Saved JSON to {out_path}")
    except json.JSONDecodeError:
        out_path.with_suffix(".md").write_text(response)
        print(f"Response saved as markdown (not valid JSON): {out_path.with_suffix('.md')}")

    print(f"\nAI Consultation Response Preview:")
    print("=" * 50)
    print(response[:1000] + "..." if len(response) > 1000 else response)
    
    return response


if __name__ == "__main__":
    main()
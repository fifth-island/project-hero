#!/usr/bin/env python3
"""Q2 — AI consultation for dashboard & visualization recommendations."""

import json, os, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def call_claude(prompt: str, api_key: str) -> str:
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
    DATASET: 48,123 rows × 49 columns, 12 monitoring sites in Boston Chinatown,
    10-minute intervals, July 19 – August 23, 2023.

    TEMPERATURE SOURCES:
    - kes_mean_temp_f: Kestrel field sensors at each site (mean=74.47°F, std=6.33, range 61.5-91.8°F, 3.6% missing)
    - mean_temp_out_f: Weather station on rooftop at 35 Kneeland St (mean=74.11°F, std=6.37, range 59.5-93.5°F, 0% missing)
    - dep_FEM_nubian_temp_f: MassDEP FEM monitor at Nubian Square (mean=74.83°F, std=7.10, range 60.3-94.2°F, 0% missing)

    ADDITIONAL COLUMNS: kes_mean_humid_pct, kes_mean_wbgt_f, mean_wind_speed_mph, wind_direction_degrees_kr,
    land-use (Impervious/Trees/Greenspace/Roads at 25m/50m buffers), epa pollutants.

    KEY FINDINGS SO FAR:
    1. OVERALL AGREEMENT:
       - Kestrel vs WS: r=0.597, bias=+0.34°F, RMSE=5.72°F (poor)
       - Kestrel vs DEP Nubian: r=0.899, bias=-0.37°F, RMSE=3.13°F (good)
       - WS vs DEP Nubian (ref cross-check): r=0.376, RMSE=7.58°F (very poor)

    2. ROOFTOP THERMAL MASS EFFECT:
       - WS shows INVERTED diurnal pattern vs ground-level sensors
       - WS peaks at evening (80.3°F at 18h), coldest at morning (67.8°F at 10h)
       - Kestrel & DEP follow normal solar cycle: peak at 13-14h, trough at 4-5h
       - Optimal lag: WS lags ground-level by ~4 hours (lag-corrected r=0.998!)

    3. DAYTIME vs NIGHTTIME:
       - Daytime (8-18h): WS bias=+4.53°F, DEP bias=-2.07°F
       - Nighttime (19-7h): WS bias=-2.97°F, DEP bias=+0.97°F
       - DEP agreement is much better than WS in both periods

    4. URBAN HEAT ISLAND:
       - Site temperature range: 1.39°F (Castle Square=75.31°F hottest, Mary Soo Hoo=73.91°F coolest)
       - Modest but consistent cross-site variability

    5. ENVIRONMENTAL MODULATION:
       - Humidity: Low RH (20-40%) → WS bias=+6.01°F; High RH (80-100%) → WS bias=-1.92°F
       - Wind direction: N winds → highest WS bias (+2.41°F)
       - Wind speed: Calm conditions amplify biases slightly

    6. AGREEMENT METRICS:
       - Kes vs WS: Only 15.6% within ±1°F, 29.1% within ±2°F
       - Kes vs DEP: 27.6% within ±1°F, 52.7% within ±2°F, 88.9% within ±5°F

    7. LAND-USE (n=12 sites):
       - Greenspace_50m vs DEP bias: r=-0.84, p=0.001 (strong, significant!)
       - More greenspace → Kestrel reads cooler relative to DEP

    8. WBGT: Mean=65.9°F, max=77.5°F — never reached OSHA caution level (80°F)
       - Kestrel temp to WBGT correlation: r=0.54 (moderate — humidity matters)

    EXISTING FIGURES: q2_temp_scatter.png (scatter plots), q2_bland_altman_temp.png (Bland-Altman)
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 2**: How do Kestrel ambient temperature data at each of the 12 sites
    compare with the weather station at 35 Kneeland St and DEP Nubian Square?

    Here is the context of what we have analyzed so far and what data is available:

    {context}

    Please provide:

    1. **ADDITIONAL ANALYSES** (3-7 items): What else should we compute, test, or visualize
       to thoroughly answer this question? For each item, specify:
       - What to compute/plot
       - Why it matters
       - Which columns/data to use

    2. **KPI RECOMMENDATIONS** (3-5 items): Key performance indicators or summary metrics
       that should be prominently displayed. For each:
       - KPI name and formula/definition
       - Why it's meaningful

    3. **VISUALIZATION RECOMMENDATIONS** (4-8 items): Specific chart types and what they
       should show. For each:
       - Chart type
       - What data it encodes
       - Why this chart type is the best choice
       - Any interactive features

    4. **DASHBOARD LAYOUT** (1-2 dashboards): Describe the ideal layout for presenting
       this question's findings. Include:
       - Visual hierarchy
       - Panel arrangement
       - Recommended filters
       - Color scheme and style notes

    5. **EDUCATIONAL FRAMING**: How should we present this so a non-scientist
       (community member, city planner) can understand? Suggest:
       - Key takeaway message (1 sentence)
       - Annotations or callouts
       - Analogies to make numbers meaningful

    Format your response as structured JSON with these 5 top-level keys.
    """

    print("Calling Claude API for Q2 recommendations...")
    response = call_claude(prompt, api_key)

    out_path = ROOT / "reports/phase3_refined/q2_ai_recommendations.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        parsed = json.loads(response)
        out_path.with_suffix(".json").write_text(json.dumps(parsed, indent=2))
        out_path.write_text(f"# Q2 AI Dashboard Recommendations\n\n```json\n{json.dumps(parsed, indent=2)}\n```\n")
        print(f"Saved JSON to {out_path.with_suffix('.json')}")
    except json.JSONDecodeError:
        out_path.write_text(f"# Q2 AI Dashboard Recommendations\n\n{response}\n")
        print("Response saved as markdown (not valid JSON)")

    print(f"Saved to {out_path}")
    print("\n--- RESPONSE PREVIEW (first 2000 chars) ---")
    print(response[:2000])


if __name__ == "__main__":
    main()

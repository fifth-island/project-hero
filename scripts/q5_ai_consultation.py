#!/usr/bin/env python3
"""Q5 — AI consultation for dashboard & visualization recommendations."""

import json, os, sys
from pathlib import Path
import urllib.request

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
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["content"][0]["text"]


def main():
    api_key = os.environ["ANTHROPIC_API_KEY"]

    context = """
    DATASET: 48,123 rows × 46 columns, 12 open-space sites in Boston Chinatown, 10-min intervals, Jul 19 – Aug 23, 2023.
    WBGT measured by Kestrel sensors at each site. Heat Index and ambient temperature also measured.

    TOP 5 HOTTEST DAYS (by daily mean WBGT across all sites):
    - 2023-07-27: WBGT mean=72.98°F, max=77.5°F, Temp=79.3°F, Humid=75.9%
    - 2023-07-28: WBGT mean=72.84°F, max=77.5°F, Temp=82.2°F, Humid=66.5%
    - 2023-07-29: WBGT mean=72.55°F, max=77.5°F, Temp=76.9°F, Humid=82.9%
    - 2023-08-08: WBGT mean=72.49°F, max=77.5°F, Temp=76.6°F, Humid=83.7%
    - 2023-08-13: WBGT mean=70.72°F, max=77.5°F, Temp=79.0°F, Humid=68.6%
    NOTE: Max WBGT=77.5°F across ALL days/sites. Never reached OSHA Caution (80°F).
    Heat Index reached 120.7°F (210 records >100°F on hot days).

    HEAT WAVE STRUCTURE: Jul 24-29 was 6-consecutive-day hot streak (all in top 10).
    Aug 8 and Aug 13, 18 were isolated hot days.

    SITE RANKINGS ON HOT DAYS (WBGT):
    - Tufts Garden: HOTTEST (mean 73.2°F, rank 1.2 avg, most consistent — std 0.4)
    - Berkeley Garden: mean 73.0°F, rank 4.0 avg
    - Castle Square: mean 72.7°F, rank 2.6 avg
    - Mary Soo Hoo: COOLEST (mean 71.6°F, rank 10.0 avg)
    - Inter-site range: 0.7-1.5°F per hot day
    - Effect size Tufts vs Mary Soo Hoo: Cohen's d=0.61 (medium)

    CRITICAL FINDING — WBGT vs TEMPERATURE RANK DIVERGENCE:
    - Reggie Wong: Temp rank #1 (79.9°F) but WBGT rank #7 (72.2°F) — lowest humidity (71.6%)
    - Tufts Garden: Temp rank #6 (78.8°F) but WBGT rank #1 (73.2°F) — highest humidity (78.8%)
    This shows humidity drives WBGT differences more than temperature alone.

    DIURNAL PATTERN ON HOT DAYS:
    - Min WBGT ~69°F at 11pm, peaks at 3pm (74.6°F)
    - Rise rate varies: Castle Square fastest (0.61°F/hr), Mary Soo Hoo slowest (0.20°F/hr)
    - Peak hours: most sites peak 1-3pm, Lyndboro earliest (12pm), Oxford/Chin latest (4pm)

    NIGHTTIME HEAT RETENTION:
    - Nighttime WBGT on hot days: 70.89°F (7.04°F above non-hot nights)
    - Berkeley Garden retains most heat at night (71.49°F)
    - Nighttime UHI effect is substantial

    THRESHOLD EXCEEDANCES (hot days):
    - >70°F: 80.6% of records
    - >72°F: 62.4%
    - >74°F: 24.7% (Tufts 39.6%, Mary Soo Hoo only 12.3%)
    - >75°F: 12.5%

    CO-EXPOSURE: PM2.5 12.2% higher on hot days (10.44 vs 9.31 µg/m³).
    47.2% of hot-day records have PM2.5>9 AND WBGT>70 simultaneously.

    KRUSKAL-WALLIS: H=213.31, p=1.28e-39. 46 of 66 site pairs significantly different.

    SITE TEMPORAL CORRELATION (hot days): r ranges 0.78-0.97. Most similar: Mary Soo Hoo–Oxford Place (r=0.967). Most different: Mary Soo Hoo–Tai Tung (r=0.784).

    LAND-USE: No significant correlations with WBGT on hot days (impervious r=-0.21, ns).
    No lat/lon columns available in dataset.
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for:

    **Question 5**: Pick the hottest days and visualize potential differences in WBGT across sites.

    Context:
    {context}

    Please provide:

    1. **ADDITIONAL_ANALYSES** (3-7 items): What else should we compute, test, or visualize?

    2. **KPI_RECOMMENDATIONS** (3-5 items): Key metrics to prominently display.

    3. **VISUALIZATION_RECOMMENDATIONS** (4-8 items): Specific chart types and what they show.

    4. **DASHBOARD_LAYOUT** (1-2 dashboards): Ideal layout for presenting findings.

    5. **EDUCATIONAL_FRAMING**: How to present for non-scientists.

    Format as structured JSON with these 5 top-level keys."""

    print("Calling Claude API for Q5 recommendations...")
    response = call_claude(prompt, api_key)

    out_path = ROOT / "reports/phase3_refined/q5_ai_recommendations.md"
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

#!/usr/bin/env python3
"""Q7 — AI consultation for dashboard & visualization recommendations."""

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
    - Dataset: 46,253 PM2.5-WBGT paired observations, 12 sites, 36 days (Jul-Aug 2023)
    - PM2.5 range: 0.88-25.09 µg/m³ (mean=9.48, median=8.30)
    - WBGT range: 54.8-77.5°F (mean=65.85, median=66.20)
    
    KEY FINDINGS FROM ANALYSIS:
    - Overall correlation: r = 0.360 (Pearson), ρ = 0.374 (Spearman), both p < 0.001
    - Site heterogeneity: correlations range from r=0.229 (Mary Soo Hoo) to r=0.620 (Berkeley Garden)
    - Humidity modulation: LOW humidity r=0.600, MED humidity r=0.425, HIGH humidity r=0.226
    - Wind modulation: Strongest at medium wind speeds (r=0.415)
    - Day/night: Slightly stronger during day (r=0.373) vs night (r=0.338)
    - Threshold effects: High WBGT (>68.9°F) associates with +3.15 µg/m³ higher PM2.5
    
    PHASE 3 COMPARISON: 
    - Previous analysis used temperature (r~0.20-0.45 range), this uses actual WBGT
    - WBGT shows stronger, more consistent relationship than temperature alone
    - No OSHA heat stress thresholds (80°F+) were exceeded in this study period
    
    UNTAPPED OPPORTUNITIES:
    - Geographic/spatial analysis: Site locations and buffer characteristics
    - Lag analysis: Do PM2.5 levels precede or follow WBGT changes?
    - Joint extremes: Co-occurring high PM2.5 AND high WBGT episodes
    - Mechanistic insights: humidity as key moderator suggests aerosol hygroscopic growth
    - Regression with interaction terms: WBGT × Humidity, WBGT × Site
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 7**: What is the relationship between PM2.5 and heat indicators, controlling for meteorological and temporal factors? Is there heterogeneity across sites?

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

    print(f"Calling Claude API for Q7 recommendations...")
    response = call_claude(prompt, api_key)

    # Save the raw response
    out_path = ROOT / "reports/phase3_refined/q7_ai_recommendations.json"
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
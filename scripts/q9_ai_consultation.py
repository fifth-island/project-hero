#!/usr/bin/env python3
"""Q9 — AI consultation for dashboard & visualization recommendations."""

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
    - PM2.5 column: pa_mean_pm2_5_atm_b_corr_2 (mean ~9.5 µg/m³)
    - WBGT column: kes_mean_wbgt_f (mean ~65.9 °F)
    - Land-use buffer data from landuse_HEROS.xlsx merged with monitoring data
    - 10 land-use variables: 5 categories (Trees, Grass, Bare_Soil, Impervious, Roads) × 2 buffers (25m, 50m)
    - Each variable is percent area within the buffer zone around each monitoring site

    KEY FINDINGS:
    - Roads within 50m is the STRONGEST predictor of PM2.5 (r=0.680, p=0.015)
    - Roads within 25m also significant for PM2.5 (r=0.634, p=0.027)
    - Trees within 50m is the strongest positive correlate of WBGT (r=0.506) — counterintuitive
    - Impervious surface within 25m is the strongest negative correlate of WBGT (r=-0.566) — also counterintuitive
    - No significant land-use predictors for WBGT at p<0.05
    - Only 2 significant environmental justice insights: road proximity → higher PM2.5
    
    REGRESSION RESULTS:
    - Best single predictor for PM2.5: Roads_50m (R² = 0.462, coef significant)
    - Best single predictor for WBGT: Trees_50m (R² = 0.256, not significant)
    - Multivariate models limited by n=12 sites (small sample)
    
    CLUSTERING:
    - 2 optimal clusters (silhouette = 0.317)
    - Cluster 0 (4 sites: berkley, castle, eliotnorton, lyndenboro): more impervious dominant
    - Cluster 1 (8 sites: chin, dewey, greenway, msh, oxford, reggie, taitung, tufts): more impervious but different mix
    - NO significant difference in PM2.5 or WBGT between clusters (p=0.95, p=0.31)
    
    PCA:
    - PC1 (44.1% variance) and PC2 (28.6% variance) capture 72.7% of land-use variation
    - Clear spatial separation of sites in PCA space
    
    LIMITATIONS:
    - Only 12 sites → low statistical power for cross-sectional correlations
    - Land-use buffers are small (25m, 50m) — may miss broader context
    - Impervious surface dominates all sites (urban context)
    - Counterintuitive WBGT correlations may reflect confounding (e.g., tree cover near waterfront = cooler breeze)
    
    FIGURES GENERATED (9):
    - q9_scatter_landuse_vs_pm25.png — scatter plots of each land-use variable vs site-mean PM2.5
    - q9_scatter_landuse_vs_wbgt.png — scatter plots vs site-mean WBGT
    - q9_heatmap_landuse_vs_outcomes.png — correlation heatmap (land-use × environmental outcomes)
    - q9_heatmap_landuse_intercorrelation.png — land-use variable intercorrelation
    - q9_regression_coefficients.png — standardized regression coefficients
    - q9_pca_sites_pm25.png — PCA biplot colored by PM2.5
    - q9_pca_sites_wbgt.png — PCA biplot colored by WBGT
    - q9_dendrogram_landuse.png — hierarchical clustering dendrogram
    - q9_cluster_comparison.png — environmental outcomes by cluster
    """

    prompt = f"""You are a senior data visualization and dashboard design consultant
    specializing in environmental health research and environmental justice.

    I am working on the Chinatown HEROS project — a study of air quality (PM2.5) and
    heat stress (WBGT) across 12 open-space sites in Boston's Chinatown during summer 2023.

    I need your help to enrich the analysis and design dashboards for the following
    research question:

    **Question 9**: Look at the landuse buffer characteristics across sites and whether
    they are associated with PM2.5 and heat indicators.

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

    print("Calling Claude API for Q9 recommendations...")
    response = call_claude(prompt, api_key)

    # Save the raw response
    out_path = ROOT / "reports/phase3_refined/q9_ai_recommendations.json"
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

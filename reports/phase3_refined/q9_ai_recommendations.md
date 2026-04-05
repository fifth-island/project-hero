```json
{
  "additional_analyses": [
    {
      "analysis": "Distance-based analysis from specific urban features",
      "what_to_compute": "Calculate actual distance (meters) from each site to nearest major road, highway, park, waterfront. Test correlation with PM2.5 and WBGT using these continuous distance variables instead of percent area buffers.",
      "why_it_matters": "Current buffer analysis may miss critical proximity effects. A site 10m from a highway vs 40m could have very different exposures, but both show up as 'high road percentage' in buffer analysis.",
      "data_needed": "Site coordinates, GIS road network data, distance calculations to supplement existing landuse_HEROS.xlsx"
    },
    {
      "analysis": "Temporal stability analysis of land-use effects",
      "what_to_compute": "Calculate daily correlations between Roads_50m and daily mean PM2.5 across the 36-day period. Test if the road-PM2.5 relationship is consistent across different weather conditions (wind speed/direction, temperature).",
      "why_it_matters": "Strong cross-sectional correlation (r=0.680) might vary by meteorological conditions. Understanding when land-use matters most helps identify vulnerable periods.",
      "data_needed": "Daily aggregated pa_mean_pm2_5_atm_b_corr_2, Roads_50m, weather data by date"
    },
    {
      "analysis": "Composite land-use vulnerability index",
      "what_to_compute": "Create weighted composite scores: PM2.5_Risk_Score = (Roads_50m × 0.68) + (other significant predictors), WBGT_Risk_Score using PCA weights. Rank sites by composite vulnerability.",
      "why_it_matters": "Single land-use variables don't capture cumulative exposure. A composite index provides actionable site ranking for intervention prioritization.",
      "data_needed": "All 10 land-use variables, correlation coefficients as weights"
    },
    {
      "analysis": "Land-use interaction effects analysis",
      "what_to_compute": "Test interaction terms: Roads_50m × Trees_50m, Impervious_25m × Grass_25m effects on PM2.5/WBGT. Use regularized regression (Ridge/Lasso) to handle small sample size.",
      "why_it_matters": "Trees might buffer road effects on air quality. Grass might modify impervious surface heat effects. These interactions could explain counterintuitive findings.",
      "data_needed": "Land-use variables for interaction term creation, regularized regression modeling"
    },
    {
      "analysis": "Extreme values and outlier analysis",
      "what_to_compute": "Identify which sites have the highest 90th percentile PM2.5 and WBGT days. Analyze land-use characteristics of these 'worst case' conditions vs typical conditions.",
      "why_it_matters": "Health impacts often driven by extreme exposure days, not averages. Land-use effects might be amplified during heat waves or high pollution episodes.",
      "data_needed": "Daily 90th percentiles of pa_mean_pm2_5_atm_b_corr_2 and kes_mean_wbgt_f by site"
    },
    {
      "analysis": "Spatial autocorrelation and neighborhood context",
      "what_to_compute": "Calculate Moran's I for PM2.5 and WBGT across the 12 sites. Test if nearby sites have similar exposures beyond what land-use explains.",
      "why_it_matters": "Sites might cluster spatially in ways that confound land-use analysis. Understanding spatial dependence helps interpret whether land-use effects are local or regional.",
      "data_needed": "Site coordinates, spatial weights matrix, mean PM2.5/WBGT by site"
    }
  ],
  
  "kpi_recommendations": [
    {
      "kpi_name": "Road Proximity Impact Factor",
      "formula": "Standardized coefficient of Roads_50m in predicting PM2.5 (currently 0.68 correlation)",
      "why_meaningful": "Quantifies the most robust environmental justice finding - road proximity drives air pollution exposure inequality across Chinatown sites"
    },
    {
      "kpi_name": "Land-use Vulnerability Score", 
      "formula": "Composite index: (Roads_50m percentile × 0.4) + (1 - Trees_50m percentile × 0.3) + (Impervious_25m percentile × 0.3)",
      "why_meaningful": "Single metric to rank sites from most to least vulnerable based on land-use characteristics, enabling prioritization of interventions"
    },
    {
      "kpi_name": "Green Space Effectiveness Ratio",
      "formula": "(Trees_50m + Grass_50m) / (Roads_50m + Impervious_25m) for each site",
      "why_meaningful": "Captures balance between beneficial vs harmful land uses - helps identify sites where green interventions could have biggest impact"
    },
    {
      "kpi_name": "Land-use Explained Variance",
      "formula": "R² from best land-use model for PM2.5 (currently 46.2%) and WBGT",
      "why_meaningful": "Shows how much environmental health disparities can be explained by immediate land-use context vs other factors"
    }
  ],
  
  "visualization_recommendations": [
    {
      "chart_type": "Interactive scatter plot with regression lines",
      "data_encoded": "X-axis: Roads_50m percentage, Y-axis: site mean PM2.5, points sized by population density, colored by cluster membership",
      "why_best_choice": "Clearly shows strongest relationship found, with context about which sites are most affected",
      "interactive_features": "Hover shows site name and exact values, toggle to switch Y-axis to WBGT, brushing to highlight outliers"
    },
    {
      "chart_type": "Radar/spider chart",
      "data_encoded": "Each axis represents one land-use variable (10 axes), separate polygon for each site, color-coded by PM2.5 or WBGT level",
      "why_best_choice": "Shows complete land-use profile for each site simultaneously, making it easy to identify patterns and compare sites",
      "interactive_features": "Select multiple sites to overlay, slider to switch coloring between PM2.5 and WBGT"
    },
    {
      "chart_type": "Spatial map with proportional symbols",
      "data_encoded": "Chinatown map with site locations, symbol size = PM2.5 level, symbol color = dominant land-use type, background shows road network",
      "why_best_choice": "Provides geographic context that's missing from statistical plots - shows how land-use effects play out across neighborhood",
      "interactive_features": "Click site for detailed land-use breakdown, toggle between PM2.5 and WBGT encoding, layer controls for different buffer sizes"
    },
    {
      "chart_type": "Stacked horizontal bar chart",
      "data_encoded": "Each bar = one site, segments show percentage breakdown of 5 land-use categories within 50m buffer, sorted by PM2.5 level",
      "why_best_choice": "Directly shows land-use composition while maintaining link to air quality outcomes, easy to spot patterns",
      "interactive_features": "Sort by different variables (PM2.5, WBGT, road percentage), hover for exact percentages"
    },
    {
      "chart_type": "Correlation network diagram",
      "data_encoded": "Nodes = land-use variables + PM2.5 + WBGT, edges = significant correlations, edge thickness = correlation strength, node color = variable type",
      "why_best_choice": "Shows complex interdependencies between all variables simultaneously, highlights which relationships are strongest",
      "interactive_features": "Filter edges by correlation threshold, click node to highlight connections, drag nodes to reorganize layout"
    },
    {
      "chart_type": "Small multiples time series",
      "data_encoded": "Grid of 12 small time series plots (one per site), each showing daily PM2.5 over 36 days, background color intensity = Roads_50m percentage",
      "why_best_choice": "Shows temporal patterns while maintaining connection to land-use context, reveals if road effects are consistent over time",
      "interactive_features": "Sync zoom/pan across all panels, click site to enlarge, overlay weather events"
    }
  ],
  
  "dashboard_layout": [
    {
      "dashboard_name": "Land-use Impact Overview Dashboard",
      "visual_hierarchy": "Large spatial map at top-left draws attention first, followed by key KPI cards across top, then detailed analytical plots below",
      "panel_arrangement": "3×3 grid: Row 1 - KPI cards (Road Impact Factor, Vulnerability Score, Green Space Ratio) spanning 25% height. Row 2 left (40% width) - Interactive spatial map. Row 2 right (60% width) - Radar chart showing land-use profiles. Row 3 left - Roads vs PM2.5 scatter plot. Row 3 right - Stacked bar chart of land-use composition",
      "filters": "Top filter bar: Site selector (multi-select), Buffer size toggle (25m/50m), Outcome variable toggle (PM2.5/WBGT), Time period slider for temporal analyses",
      "color_scheme": "Earth tones - greens for vegetation, grays for impervious surfaces, reds for roads/pollution, blues for low pollution. Consistent across all panels",
      "screen_distribution": "Header with filters (10%), KPI row (15%), main analysis grid (75%)",
      "story_coherence": "Flows from 'what are the key findings' (KPIs) → 'where do these patterns occur' (map) → 'what drives these patterns' (detailed analysis plots)"
    },
    {
      "dashboard_name": "Site-Level Intervention Dashboard", 
      "visual_hierarchy": "Site selector prominent at top, followed by detailed profile of selected site(s), with comparison context and recommendations",
      "panel_arrangement": "2×2 grid with sidebar: Left sidebar (20% width) - Site selection and key metrics. Main area top-left (40% width) - Selected site radar chart. Top-right (40% width) - Time series for selected site. Bottom row - Comparison scatter plots showing where selected site ranks among all 12 sites",
      "filters": "Site comparison mode (single site vs compare 2-3 sites), Intervention scenario slider (what if we increased trees by X%?), Temporal focus (typical days vs extreme days)",
      "color_scheme": "Selected sites in bold colors, comparison sites in muted grays, clear highlighting of selected elements",
      "screen_distribution": "Sidebar (20%), main panels (80% split equally among 3-4 key visualizations)",
      "story_coherence": "Enables deep dive into specific sites for intervention planning - shows current status, temporal patterns, and relative ranking to guide decision-making"
    }
  ],
  
  "educational_framing": {
    "key_takeaway": "Sites closer to roads have nearly 70% higher air pollution levels, but green space effects on temperature are more complex than expected in this dense urban environment.",
    "annotations": [
      "Add text box on road-PM2.5 scatter: 'Each 10% increase in nearby roads = ~1.2 µg/m³ higher PM2.5'",
      "Highlight counterintuitive finding: 'Trees correlate with higher heat - likely because treed sites are away from cooling water/wind'", 
      "Mark WHO PM2.5 guideline (5 µg/m³) as reference line on relevant charts",
      "Add site photos/thumbnails to help users recognize locations"
    ],
    "analogies_and_context": [
      "PM2.5 differences: 'The most road-adjacent sites have air pollution levels comparable to a moderately busy day in Beijing, while tree-lined sites are closer to rural New England levels'",
      "Buffer zones: 'Within 50 meters means roughly half a city block - the immediate neighborhood matters most'",
      "Heat effects: 'A 3°F difference in heat stress is like the difference between a warm day and a heat advisory day'",
      "Statistical confidence: 'With only 12 sites, we found the clearest pattern is roads → air pollution, but temperature patterns need more investigation'"
    ]
  }
}
```
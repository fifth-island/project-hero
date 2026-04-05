```json
{
  "ADDITIONAL_ANALYSES": [
    {
      "analysis": "Compute percentile band differences (25th-75th, 10th-90th) for PM2.5 and WBGT across time periods and sites",
      "why_matters": "CDF analysis should quantify spread/uncertainty, not just medians. Band widths reveal which sites/times have most variable exposure - critical for environmental justice assessment",
      "columns_used": "pm25_corrected, wbgt_f, hour, site_name - calculate IQR and interdecile ranges by groupings"
    },
    {
      "analysis": "Calculate CDF crossover points between site pairs and time periods",
      "why_matters": "Identifies threshold values where one site/time transitions from lower to higher risk than another. Shows nuanced exposure patterns beyond simple ranking",
      "columns_used": "pm25_corrected, wbgt_f grouped by site_name and time_period - find intersection points of empirical CDFs"
    },
    {
      "analysis": "Create joint CDF analysis for simultaneous PM2.5/WBGT exposure levels",
      "why_matters": "CDFs typically examine single variables, but environmental health requires understanding combined exposure burden. Shows probability of experiencing dual high exposure",
      "columns_used": "pm25_corrected, wbgt_f - create bivariate CDF surface and marginal probability contours"
    },
    {
      "analysis": "Compute CDF area-under-curve (AUC) metrics for exposure burden ranking",
      "why_matters": "Single summary metric to rank sites/times by overall exposure burden. AUC above/below reference thresholds quantifies cumulative risk",
      "columns_used": "pm25_corrected, wbgt_f - integrate empirical CDFs above NAAQS (9.0) and comfort thresholds (68°F WBGT)"
    },
    {
      "analysis": "Bootstrap confidence intervals for CDF curves by site and time",
      "why_matters": "Small sample sizes per site/time may make CDF differences appear significant when they're not. Confidence bands show statistical reliability",
      "columns_used": "pm25_corrected, wbgt_f, datetime, site_name - 1000 bootstrap resamples per grouping"
    },
    {
      "analysis": "Calculate CDF-based environmental justice metrics (exposure inequality ratios)",
      "why_matters": "Compare worst-exposed site's 90th percentile to best-exposed site's 50th percentile. Quantifies exposure inequity across Chinatown open spaces",
      "columns_used": "pm25_corrected, wbgt_f, site_name - ratio of (max_site_P90)/(min_site_P50) for each pollutant"
    }
  ],

  "KPI_RECOMMENDATIONS": [
    {
      "kpi_name": "Exposure Burden Index (EBI)",
      "formula": "AUC of site CDF above regulatory thresholds / AUC of overall CDF above same thresholds",
      "why_meaningful": "Single metric (>1.0 = higher burden than average) that combines frequency and magnitude of exceedances for ranking sites and informing intervention priorities"
    },
    {
      "kpi_name": "Peak Vulnerability Window",
      "formula": "Time period with highest joint probability of PM2.5>P75 AND WBGT>P75",
      "why_meaningful": "Identifies when residents face highest combined exposure risk, critical for public health advisories and activity planning"
    },
    {
      "kpi_name": "Inter-site Exposure Equity Ratio",
      "formula": "(Highest site P90) / (Lowest site P50) for each pollutant",
      "why_meaningful": "Environmental justice metric showing how much worse the most exposed site's typical high exposure is compared to the least exposed site's median"
    },
    {
      "kpi_name": "CDF Separation Distance (Maximum D-statistic)",
      "formula": "Largest vertical distance between site CDF and overall CDF",
      "why_meaningful": "Quantifies how different each site's exposure profile is from the neighborhood average - identifies outlier locations needing attention"
    }
  ],

  "VISUALIZATION_RECOMMENDATIONS": [
    {
      "chart_type": "Interactive multi-panel CDF overlay with confidence bands",
      "data_encoded": "Empirical CDFs for PM2.5/WBGT with bootstrap 95% CI bands, colored by site/time period",
      "why_best_choice": "CDFs directly answer the research question while confidence bands show statistical significance. Multiple panels prevent visual clutter",
      "interactive_features": "Toggle sites on/off, switch between time periods, hover for exact percentile values, click to highlight individual CDFs"
    },
    {
      "chart_type": "CDF difference heatmap matrix",
      "data_encoded": "Pairwise Kolmogorov-Smirnov D-statistics between all sites, with color intensity showing magnitude of difference",
      "why_best_choice": "Compact way to show all 66 pairwise site comparisons simultaneously. Reveals clusters of similar/different sites",
      "interactive_features": "Click cell to show the two CDFs being compared, tooltip with KS test p-value and effect size"
    },
    {
      "chart_type": "Ridgeline plot (joy plot) of CDFs",
      "data_encoded": "Vertically stacked density curves for each site's PM2.5 and WBGT distributions",
      "why_best_choice": "Shows full distribution shape while maintaining ability to compare across sites. More intuitive than overlapping CDFs",
      "interactive_features": "Sort by median/P90/variance, highlight percentile lines across all ridges, zoom to focus on specific percentile ranges"
    },
    {
      "chart_type": "Quantile-quantile (Q-Q) plots against overall distribution",
      "data_encoded": "Each site's quantiles plotted against overall study quantiles for both pollutants",
      "why_best_choice": "Directly shows where each site deviates from average across the entire distribution, not just at extremes",
      "interactive_features": "Select multiple sites to overlay, show confidence envelope for expected variation, annotate departure points"
    },
    {
      "chart_type": "Bivariate CDF contour map",
      "data_encoded": "Joint probability contours for simultaneous PM2.5/WBGT exposure levels",
      "why_best_choice": "Environmental health depends on combined exposures. Shows probability surfaces for dual high exposure events",
      "interactive_features": "Slider to adjust contour levels, overlay regulatory threshold lines, toggle between sites/time periods"
    },
    {
      "chart_type": "CDF crossing point timeline",
      "data_encoded": "Time series showing threshold values where day/night CDFs intersect across the study period",
      "why_best_choice": "Reveals temporal dynamics of when daytime vs nighttime exposure patterns shift, beyond static comparisons",
      "interactive_features": "Brush to select time ranges, overlay weather events, show confidence intervals around crossing points"
    }
  ],

  "DASHBOARD_LAYOUT": [
    {
      "name": "Primary CDF Analysis Dashboard",
      "visual_hierarchy": "Large multi-panel CDF plot dominates center (40% of screen), flanked by KPI cards (15% top), with site comparison matrix below (25%), and time-period selector tabs at bottom (20%)",
      "panel_arrangement": "3x3 grid: Top row = KPI cards (EBI, Peak Window, Equity Ratio). Middle row = Main CDF panel spans 2 columns, site ranking list in column 3. Bottom row = CDF difference heatmap (2 columns), interactive controls (1 column)",
      "filters": "Site selector (multi-select dropdown), time period toggle (tabs), pollutant selector (PM2.5/WBGT/Both), confidence interval toggle, threshold overlay options",
      "color_scheme": "Sequential blues for PM2.5, sequential oranges for WBGT. Sites get distinct categorical colors. Red accent for regulatory thresholds. Gray confidence bands.",
      "element_interplay": "Selecting sites in dropdown highlights them in main CDF and updates heatmap. KPI cards update dynamically. Clicking heatmap cells shows detailed comparison in side panel."
    },
    {
      "name": "Environmental Justice Dashboard", 
      "visual_hierarchy": "Large choropleth map of sites sized by exposure burden (35% left), ridgeline CDFs by site (35% right), equity metrics prominently displayed in header (15% top), narrative summary panel at bottom (15%)",
      "panel_arrangement": "2x2 grid: Top spans full width for equity KPIs and key findings. Bottom left = interactive site map with EBI scores. Bottom right = ridgeline distributions ranked by burden",
      "filters": "Vulnerability threshold slider (adjust percentile cutoffs), time period filter, bootstrap confidence toggle, sort ridgelines by different metrics",
      "color_scheme": "Red-yellow-green diverging scale for equity (red=high burden). Consistent with environmental justice color conventions. High contrast for accessibility.",
      "element_interplay": "Map and ridgelines are synchronized - clicking sites highlights distributions. Slider updates all visualizations in real-time. Summary text updates with selected filters to provide contextual interpretation."
    }
  ],

  "EDUCATIONAL_FRAMING": {
    "key_takeaway": "Air pollution and heat exposure vary significantly across Chinatown's open spaces, with some sites having 40% higher exposure levels than others, creating unequal health burdens within the same neighborhood.",
    "annotations": [
      "Label the 'worst 10%' and 'best 10%' areas on CDFs with callout boxes explaining what these percentiles mean for daily life",
      "Add reference lines for 'typical summer day in Boston suburbs' to provide citywide context",
      "Annotate crossing points where 'Site A becomes riskier than Site B' with threshold values",
      "Include time-of-day annotations like 'afternoon rush hour' and 'early morning' instead of just numerical hours"
    ],
    "analogies": [
      "Explain CDFs as 'what percentage of time you'd experience pollution levels below X' - like weather forecasts",
      "Compare site differences to 'living in different climate zones within the same neighborhood'",
      "Describe exposure burden as 'some playgrounds have dirty air 4 days per week, others only 2 days per week'",
      "Frame percentile differences as 'on a typical bad air day, Site A feels like Site B's worst day'"
    ]
  }
}
```
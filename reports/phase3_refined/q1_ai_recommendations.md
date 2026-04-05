```json
{
  "additional_analyses": [
    {
      "analysis": "Site-level bias clustering and geographic patterns",
      "what_to_compute": "Perform hierarchical clustering on site-level bias characteristics (mean bias, bias variability, LOA width) and create pseudo-geographic visualization using site positions relative to major roads/pollution sources",
      "why_it_matters": "Identifies which sites behave similarly and reveals spatial patterns that could explain systematic differences in Purple Air accuracy across the neighborhood",
      "columns_data": "Site-aggregated bias metrics, land-use buffer columns (impervious_pct, tree_canopy_pct), site coordinates for spatial context"
    },
    {
      "analysis": "Multi-pollutant interference analysis",
      "what_to_compute": "Calculate correlations between PA-DEP bias and EPA co-pollutants (ozone, NO2, CO, SO2). Create scatter plots of bias vs each pollutant with trend lines",
      "why_it_matters": "Purple Air sensors can be affected by other pollutants, helping explain when and why readings diverge from reference monitors",
      "columns_data": "epa_pm25_fem, EPA ozone/NO2/CO/SO2 columns, calculated PA bias values"
    },
    {
      "analysis": "Temperature-dependent bias characterization",
      "what_to_compute": "Binned analysis of bias vs temperature and WBGT, with separate analysis for extreme heat events (WBGT >28°C). Include interaction effects between temperature and humidity on bias",
      "why_it_matters": "Heat affects sensor electronics and particle behavior - critical for environmental justice communities experiencing heat islands",
      "columns_data": "Temperature, WBGT columns, humidity, calculated bias metrics"
    },
    {
      "analysis": "Pollution episode performance assessment",
      "what_to_compute": "Identify high pollution episodes (>95th percentile) and calculate PA accuracy metrics specifically during these events. Compare detection rates and timing of episode onset/offset",
      "why_it_matters": "Community health protection depends on accurate detection of pollution spikes - when air quality matters most for health",
      "columns_data": "All PM2.5 columns, timestamp for episode timing analysis"
    },
    {
      "analysis": "Land use and microenvironment bias drivers",
      "what_to_compute": "Multiple regression analysis: bias ~ impervious_pct + tree_canopy_pct + other land use variables. Calculate partial correlation coefficients and variable importance",
      "why_it_matters": "Explains why certain sites have better/worse PA accuracy - informs optimal sensor placement strategies",
      "columns_data": "All land-use buffer columns (impervious_pct, tree_canopy_pct, etc.), site-aggregated bias metrics"
    },
    {
      "analysis": "Correction factor validation and site-specific adjustments",
      "what_to_compute": "Compare Barkjohn correction performance across sites. Develop site-specific correction factors and test hybrid approach combining global + local adjustments",
      "why_it_matters": "Determines if one correction works everywhere or if local calibration is needed for accurate community monitoring",
      "columns_data": "PA corrected values, site identifiers, humidity, temperature for site-specific correction development"
    },
    {
      "analysis": "Temporal stability of PA-DEP relationships",
      "what_to_compute": "Rolling window correlation analysis (7-day windows) to track how PA-DEP relationships change over the study period. Identify periods of degraded performance",
      "why_it_matters": "Sensor drift or environmental factors may cause accuracy to change over time - important for long-term monitoring programs",
      "columns_data": "All PM2.5 columns, timestamps, 7-day rolling window calculations"
    }
  ],

  "kpi_recommendations": [
    {
      "kpi_name": "Community Monitoring Reliability Index",
      "formula": "(% of readings within ±2 μg/m³ of reference) × (1 - |normalized_bias|)",
      "why_meaningful": "Combines accuracy and precision into single metric meaningful for community health protection - higher values mean more trustworthy local monitoring"
    },
    {
      "kpi_name": "High Pollution Detection Accuracy", 
      "formula": "% of pollution episodes (>15 μg/m³) correctly identified by PA within 1 hour of reference detection",
      "why_meaningful": "Critical for community health alerts - measures if Purple Air can reliably warn residents when air quality becomes unhealthy"
    },
    {
      "kpi_name": "Site Performance Equity Score",
      "formula": "1 - (coefficient of variation of site-level bias across all 12 sites)",
      "why_meaningful": "Environmental justice metric - higher scores mean all community sites perform similarly rather than some areas having worse monitoring"
    },
    {
      "kpi_name": "Extreme Conditions Robustness",
      "formula": "Correlation coefficient between PA and reference during top 10% of temperature/humidity/pollution events",
      "why_meaningful": "Measures sensor reliability when conditions are most challenging and health impacts highest - when accurate monitoring matters most"
    }
  ],

  "visualization_recommendations": [
    {
      "chart_type": "Interactive scatter plot matrix",
      "data_encoded": "PA vs each reference monitor (DEP Chinatown, DEP Nubian, EPA) with site-based color coding and 1:1 reference lines",
      "why_best_choice": "Allows direct comparison of relationships across references while showing site-specific patterns",
      "interactive_features": "Hover for site details, brushing to highlight specific sites across all plots, toggle for pre/post correction data"
    },
    {
      "chart_type": "Geographic bias heatmap",
      "data_encoded": "Pseudo-spatial layout of 12 sites colored by mean bias magnitude, with size encoding LOA width",
      "why_best_choice": "Reveals spatial patterns in sensor accuracy across the community - shows if certain areas have systematically better/worse monitoring",
      "interactive_features": "Click to zoom to site-specific time series, toggle between different bias metrics"
    },
    {
      "chart_type": "Multi-panel time series with dual y-axes",
      "data_encoded": "Top panel: PA and reference concentrations over time; Bottom panel: bias over time with pollution episodes highlighted",
      "why_best_choice": "Shows both absolute values and accuracy simultaneously, with context of when bias matters most",
      "interactive_features": "Time range selection, site filtering, episode threshold adjustment"
    },
    {
      "chart_type": "Violin plot ensemble",
      "data_encoded": "Bias distribution by site, with overlaid box plots and individual data points for outliers",
      "why_best_choice": "Shows full bias distribution shape per site, not just means - reveals sites with consistent vs variable performance",
      "interactive_features": "Click to isolate specific sites, toggle between raw and corrected bias distributions"
    },
    {
      "chart_type": "Conditional heatmap matrix",
      "data_encoded": "Rows: environmental conditions (temp/humidity/wind bins), Columns: pollution level bins, Cells: bias magnitude with color intensity",
      "why_best_choice": "Reveals complex interactions between environmental factors and sensor accuracy in intuitive grid format",
      "interactive_features": "Hover for sample size and confidence intervals, click to filter main dashboard to specific conditions"
    },
    {
      "chart_type": "Performance degradation timeline",
      "data_encoded": "Rolling 7-day correlation coefficients and RMSE values over the study period, with weather overlays",
      "why_best_choice": "Tracks sensor reliability over time and identifies periods when accuracy degrades - critical for maintenance scheduling",
      "interactive_features": "Adjustable window size, weather variable selection, site comparison toggle"
    },
    {
      "chart_type": "Correction factor effectiveness dashboard",
      "data_encoded": "Before/after comparison showing bias reduction by site and condition, with correction formula display",
      "why_best_choice": "Demonstrates value of calibration and helps users understand when corrections work best",
      "interactive_features": "Toggle between correction methods, site-specific vs global corrections"
    },
    {
      "chart_type": "Pollution episode detection matrix",
      "data_encoded": "Timeline showing when each monitor detected pollution episodes, with accuracy statistics",
      "why_best_choice": "Focuses on health-critical question of whether Purple Air can reliably identify dangerous air quality periods",
      "interactive_features": "Episode threshold adjustment, time lag analysis, false positive/negative highlighting"
    }
  ],

  "dashboard_layout": [
    {
      "name": "Main Comparison Dashboard",
      "visual_hierarchy": "Hero KPI cards at top (40% screen width) → Central geographic bias map (35% screen) → Supporting scatter plots and time series (25% screen)",
      "panel_arrangement": "3×4 grid: Row 1: 4 KPI cards spanning full width; Row 2: Geographic bias map (2 columns) + Site performance violin plots (2 columns); Row 3: PA vs Reference scatter matrix (3 columns) + Correction effectiveness panel (1 column)",
      "filters": "Site multi-select dropdown, Date range slider, Weather condition toggles (high heat, high humidity, stagnant air), Pollution level filter, Correction method toggle",
      "color_scheme": "Diverging red-blue for bias (red = PA overestimates), Sequential blue for correlations, Categorical colorblind-safe palette for sites, Red alerts for health-concerning episodes",
      "screen_distribution": "KPIs: 15%, Geographic map: 25%, Scatter plots: 20%, Time series: 20%, Filters/controls: 10%, Legends/annotations: 10%",
      "story_flow": "Start with KPIs showing overall performance → Geographic patterns reveal spatial equity → Scatter plots show technical accuracy → Time series reveals when accuracy degrades"
    },
    {
      "name": "Environmental Conditions Deep Dive",
      "visual_hierarchy": "Conditional bias heatmap dominates center (50% screen) → Environmental time series on left (25%) → Performance degradation timeline on right (25%)",
      "panel_arrangement": "2×3 grid: Column 1: Stacked environmental conditions time series (temp, humidity, wind) over 3 rows; Column 2: Large conditional bias heatmap spanning 2 rows + correction comparison below; Column 3: Performance degradation metrics and episode detection matrix",
      "filters": "Environmental condition sliders, Season/month selector, Extreme event toggles, Site grouping options, Reference monitor selector",
      "color_scheme": "Heat colormap for temperature effects, Blue-green for humidity, Grayscale for wind, Consistent bias diverging palette throughout",
      "screen_distribution": "Conditional heatmap: 35%, Environmental time series: 25%, Performance timeline: 20%, Controls: 10%, Context/legends: 10%",
      "story_flow": "Environmental conditions drive accuracy → Heatmap shows complex interactions → Timeline reveals when problems occur → Episode detection shows health relevance"
    }
  ],

  "educational_framing": {
    "key_takeaway": "Purple Air sensors in Chinatown generally track official air quality monitors well (94% correlation), but tend to read 1-2 μg/m³ higher on average, with accuracy varying by location and weather conditions.",
    "annotations": [
      "Highlight the 94% correlation with annotation: 'Strong agreement - when official monitors go up, Purple Air goes up too'",
      "Mark the +1.53 μg/m³ bias with context: 'Purple Air reads slightly higher - like a scale that adds 1-2 pounds'",
      "Annotate geographic patterns: 'Sensors near busy streets show larger differences - traffic affects readings'",
      "Label correction success: 'Mathematical adjustment reduces error from 1.5 to 0.2 μg/m³ - much more accurate'",
      "Flag extreme conditions: 'Accuracy decreases during heat waves and high pollution - when monitoring matters most'"
    ],
    "analogies": [
      "Sensor accuracy like a thermometer that reads 2°F high - systematic but correctable",
      "94% correlation like two weather apps mostly agreeing but with slightly different numbers",
      "Site differences like how different street corners have different traffic noise levels",
      "Pollution episodes like smoke alarms - need to detect the dangerous moments reliably"
    ],
    "context_for_numbers": [
      "1-2 μg/m³ difference is small relative to health standard of 12 μg/m³ annual average",
      "Bias matters most during high pollution when health risks increase",
      "Site-to-site variation suggests optimal sensor placement strategies for community monitoring"
    ]
  }
}
```
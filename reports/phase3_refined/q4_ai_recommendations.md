```json
{
  "additional_analyses": [
    {
      "analysis": "Hourly pollutant pattern analysis with weekday/weekend stratification",
      "what_to_compute": "Calculate mean pollutant concentrations by hour of day (0-23) separately for weekdays vs weekends, including statistical significance testing",
      "why_it_matters": "Reveals traffic-related pollution patterns and identifies peak exposure times for community members. Weekend vs weekday differences indicate anthropogenic vs natural sources",
      "columns_to_use": "datetime, epa_ozone, epa_so2, epa_co, epa_no2, epa_pm25_fem"
    },
    {
      "analysis": "AQI category frequency and duration analysis",
      "what_to_compute": "Calculate percentage of time in each AQI category (Good: 0-50, Moderate: 51-100, Unhealthy for Sensitive: 101-150, etc.) and compute consecutive hours/days in each category",
      "why_it_matters": "Provides actionable health guidance - shows how often air quality poses risks to sensitive groups and general population",
      "columns_to_use": "calculated daily AQI values, datetime"
    },
    {
      "analysis": "Meteorological influence on pollutant concentrations",
      "what_to_compute": "Regression analysis of pollutant levels vs temperature, humidity, wind speed with interaction terms. Create conditional plots showing pollutant concentrations binned by meteorological conditions",
      "why_it_matters": "Understanding weather's role helps predict high pollution days and explains why certain days have worse air quality",
      "columns_to_use": "epa_*, temperature, humidity, wind_speed, wind_direction"
    },
    {
      "analysis": "Multi-pollutant event identification and characterization",
      "what_to_compute": "Identify days when multiple pollutants simultaneously exceed moderate thresholds, cluster analysis of pollutant co-occurrence patterns",
      "why_it_matters": "Multiple pollutant events pose compounded health risks - important for emergency preparedness and health advisories",
      "columns_to_use": "all epa_* columns, datetime"
    },
    {
      "analysis": "Spatial variation analysis across monitoring sites",
      "what_to_compute": "Calculate site-specific pollutant statistics, identify consistently high/low pollution sites, correlate with land-use variables within 25m/50m buffers",
      "why_it_matters": "Reveals environmental justice implications - some areas of Chinatown may have consistently worse air quality due to proximity to pollution sources",
      "columns_to_use": "site coordinates, land-use percentages, epa_* columns"
    },
    {
      "analysis": "EPA standard exceedance analysis",
      "what_to_compute": "Compare measured concentrations to EPA NAAQS standards, calculate exceedance frequencies and magnitudes, identify worst-case scenarios",
      "why_it_matters": "Determines regulatory compliance and identifies when air quality poses legally-defined health risks",
      "columns_to_use": "epa_ozone, epa_so2, epa_co, epa_no2, epa_pm25_fem"
    },
    {
      "analysis": "Heat-air quality interaction analysis",
      "what_to_compute": "Examine pollutant concentrations during high WBGT periods, test for synergistic effects between heat stress and air pollution",
      "why_it_matters": "Combined heat and air pollution create compounded health risks, especially relevant for vulnerable populations in urban areas",
      "columns_to_use": "WBGT, temperature, epa_* columns"
    }
  ],
  "kpi_recommendations": [
    {
      "kpi_name": "Community Health Risk Score",
      "formula": "Weighted average of time spent in each AQI category: (% Good × 0) + (% Moderate × 1) + (% Unhealthy for Sensitive × 2) + (% Unhealthy × 3)",
      "why_meaningful": "Single metric that communicates overall air quality health impact to community members and policymakers"
    },
    {
      "kpi_name": "Peak Pollution Hours Frequency",
      "formula": "Percentage of measurement hours where any pollutant AQI > 100 (Unhealthy for Sensitive Groups)",
      "why_meaningful": "Identifies how often residents should limit outdoor activities, crucial for vulnerable populations"
    },
    {
      "kpi_name": "Multi-Pollutant Event Rate",
      "formula": "Number of days when ≥3 pollutants simultaneously exceed moderate AQI thresholds / total monitoring days",
      "why_meaningful": "Highlights days with compounded pollution risks that require enhanced health precautions"
    },
    {
      "kpi_name": "Dominant Pollutant Diversity Index",
      "formula": "Shannon diversity index applied to frequency of each pollutant being the AQI-determining pollutant",
      "why_meaningful": "Shows whether air quality is driven by single source (low diversity) or multiple sources (high diversity), informing mitigation strategies"
    },
    {
      "kpi_name": "Regulatory Exceedance Frequency",
      "formula": "Percentage of measurements exceeding EPA NAAQS standards for each pollutant",
      "why_meaningful": "Direct measure of legal air quality compliance and regulatory health protection"
    }
  ],
  "visualization_recommendations": [
    {
      "chart_type": "Heatmap calendar",
      "data_encoded": "Daily maximum AQI values with color intensity representing severity, arranged in calendar format",
      "why_best_choice": "Intuitive temporal pattern recognition, immediately shows good vs bad air quality days in familiar calendar layout",
      "interactive_features": "Hover for detailed daily breakdown by pollutant, click to filter other charts to specific date ranges"
    },
    {
      "chart_type": "Stacked area chart",
      "data_encoded": "Hourly pollutant concentrations over the entire study period, with separate areas for each pollutant",
      "why_best_choice": "Shows both individual pollutant trends and total pollution burden over time, reveals episodic events",
      "interactive_features": "Toggle pollutants on/off, zoom to date ranges, overlay meteorological conditions"
    },
    {
      "chart_type": "Polar bar chart (pollution rose)",
      "data_encoded": "Average pollutant concentrations by wind direction (16 sectors) with different colors for different pollutants",
      "why_best_choice": "Immediately identifies pollution source directions, critical for environmental justice and source attribution",
      "interactive_features": "Filter by pollutant type, adjust wind speed thresholds, overlay site locations"
    },
    {
      "chart_type": "Small multiples violin plots",
      "data_encoded": "Pollutant concentration distributions by hour of day, separate panels for weekday/weekend",
      "why_best_choice": "Shows both central tendency and variability in daily patterns, reveals traffic and activity-related sources",
      "interactive_features": "Hover for statistical summaries, click to highlight specific hours across all charts"
    },
    {
      "chart_type": "Scatterplot matrix with regression lines",
      "data_encoded": "Pairwise relationships between pollutants and meteorological variables with correlation coefficients",
      "why_best_choice": "Reveals complex multi-pollutant interactions and meteorological dependencies",
      "interactive_features": "Brush selection to highlight data subsets, color points by AQI category or time period"
    },
    {
      "chart_type": "Animated bubble chart",
      "data_encoded": "Daily data with AQI on y-axis, temperature on x-axis, bubble size=dominant pollutant concentration, color=AQI category",
      "why_best_choice": "Shows evolution of air quality-weather relationships over time, engaging for public presentations",
      "interactive_features": "Play/pause animation, scrub through time, filter by AQI categories"
    },
    {
      "chart_type": "Geographic dot map",
      "data_encoded": "Monitoring sites sized by average pollutant concentration, colored by primary pollutant type",
      "why_best_choice": "Reveals spatial environmental justice patterns within Chinatown",
      "interactive_features": "Toggle between pollutants, adjust time period, overlay land-use data"
    },
    {
      "chart_type": "Parallel coordinates plot",
      "data_encoded": "Daily observations with axes for each pollutant and meteorological variable",
      "why_best_choice": "Identifies multi-dimensional patterns and pollutant profiles for different weather conditions",
      "interactive_features": "Brush axes to filter, color by AQI category, highlight extreme events"
    }
  ],
  "dashboard_layout": [
    {
      "dashboard_name": "Chinatown Air Quality Overview Dashboard",
      "visual_hierarchy": "Top banner with key KPIs draws attention first, followed by large calendar heatmap as central focus, supporting details in lower panels",
      "panel_arrangement": "Grid layout: Top row (100% width): KPI banner with 4-5 key metrics. Second row (60% left): Calendar heatmap of daily AQI, (40% right): Current conditions summary with gauge charts. Third row (50% left): Hourly pattern violin plots, (50% right): Pollution rose. Bottom row (100% width): Timeline view with stacked area chart",
      "recommended_filters": "Date range slider, pollutant type multiselect dropdown, AQI category toggle buttons, weekday/weekend radio buttons, weather condition slider (temperature, wind speed)",
      "color_scheme": "EPA standard AQI colors (green-yellow-orange-red-purple) for consistency with public health messaging. Clean white background with subtle gray gridlines. Blue accents for interactive elements",
      "screen_distribution": "KPIs: 15%, Calendar heatmap: 30%, Supporting charts: 40%, Timeline: 15%",
      "story_flow": "Start with 'how bad was it overall' (KPIs), then 'when were the bad days' (calendar), then 'what caused the patterns' (supporting analyses), finally 'detailed timeline' for investigation"
    },
    {
      "dashboard_name": "Environmental Justice Analysis Dashboard",
      "visual_hierarchy": "Geographic map as primary focus showing spatial disparities, flanked by site-specific comparisons and demographic overlays",
      "panel_arrangement": "Grid layout: Left panel (30%): Site selection list with summary statistics, Center panel (50%): Interactive geographic map with pollutant overlays, Right panel (20%): Selected site details. Bottom section (100% width): Comparative analysis charts showing inequities across sites",
      "recommended_filters": "Site multiselect, pollutant type, time aggregation (daily/weekly/monthly), land-use category toggles, demographic overlay options",
      "color_scheme": "Diverging color palette (blue to red) for showing relative pollution levels. Maintain AQI standard colors for health categories. High contrast for accessibility",
      "screen_distribution": "Map: 40%, Site comparisons: 35%, Site details: 15%, Filters/controls: 10%",
      "story_flow": "Geographic overview reveals hotspots, site selection enables detailed comparison, supporting charts quantify disparities and link to potential causes"
    }
  ],
  "educational_framing": {
    "key_takeaway": "Air quality in Chinatown varied significantly by time of day and weather conditions, with PM2.5 being the primary health concern and certain locations experiencing consistently higher pollution levels.",
    "annotations_and_callouts": [
      "Highlight peak pollution hours (typically 7-9 AM and 5-7 PM) with 'Rush Hour Risk' labels",
      "Mark days exceeding EPA standards with warning icons and 'Health Alert' badges",
      "Add contextual notes like '30 µg/m³ PM2.5 = breathing air in moderately polluted urban area'",
      "Include 'Good News' callouts for periods of excellent air quality",
      "Use traffic light symbols (red/yellow/green) alongside numerical AQI values"
    ],
    "analogies_and_context": [
      "Compare PM2.5 levels to 'fine particles smaller than 1/30th the width of human hair'",
      "Relate AQI categories to daily activities: 'Green = great for outdoor exercise, Yellow = sensitive people should consider indoor activities'",
      "Use local references: 'Pollution levels similar to downtown Boston during rush hour'",
      "Provide health context: 'Levels that may cause coughing in sensitive individuals like children and elderly'",
      "Compare to familiar experiences: 'Air quality similar to a moderately hazy day'"
    ]
  }
}
```
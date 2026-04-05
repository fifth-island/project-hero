```json
{
  "additional_analyses": [
    {
      "analysis": "Compound Exposure Risk Windows",
      "what_to_compute": "Calculate hourly probability of simultaneous high PM2.5 (>12 µg/m³) and high WBGT (>68°F). Create risk matrix showing percentage of days each hour-DOW combination exceeds both thresholds.",
      "why_it_matters": "Identifies critical time windows when residents face dual environmental health stressors, directly addressing environmental justice concerns about cumulative exposure burden.",
      "columns_needed": "pa_mean_pm2_5_atm_b_corr_2, kes_mean_wbgt_f, hour, dow_name"
    },
    {
      "analysis": "Rush Hour vs Non-Rush Hour Comparison", 
      "what_to_compute": "Define rush periods (7-9 AM, 5-7 PM) and compare PM2.5 levels during rush vs non-rush hours by site. Test for traffic-proximity correlations.",
      "why_it_matters": "Links air quality patterns to transportation equity issues - communities near major roads may face disproportionate traffic-related pollution during commute times.",
      "columns_needed": "pa_mean_pm2_5_atm_b_corr_2, hour, site_name"
    },
    {
      "analysis": "Heat Persistence Overnight Analysis",
      "what_to_compute": "Calculate 'cooling deficit' - difference between nighttime (10 PM - 6 AM) WBGT and daily minimum. Identify sites with poor overnight cooling recovery.",
      "why_it_matters": "Prolonged heat exposure without nighttime relief increases health risks, especially for vulnerable populations without air conditioning in environmental justice communities.",
      "columns_needed": "kes_mean_wbgt_f, hour, site_name, date"
    },
    {
      "analysis": "Temporal Trend Analysis Across Study Period",
      "what_to_compute": "Divide 36-day period into weekly chunks, analyze how diurnal peak timing and magnitude change over time. Test for significant temporal shifts in exposure patterns.",
      "why_it_matters": "Climate patterns may be shifting even within a single summer - understanding trajectory helps predict future exposure scenarios for community planning.",
      "columns_needed": "pa_mean_pm2_5_atm_b_corr_2, kes_mean_wbgt_f, hour, date, site_name"
    },
    {
      "analysis": "Exposure Episode Duration Analysis",
      "what_to_compute": "Calculate autocorrelation and run-length statistics - how long do high PM2.5 (>10 µg/m³) or high WBGT (>67°F) episodes typically persist? Map consecutive-hour exposure patterns.",
      "why_it_matters": "Duration of exposure may be more health-relevant than peak values alone. Helps communities understand when protective actions are most needed.",
      "columns_needed": "pa_mean_pm2_5_atm_b_corr_2, kes_mean_wbgt_f, datetime, site_name"
    },
    {
      "analysis": "Site Vulnerability Ranking System",
      "what_to_compute": "Create composite vulnerability score combining: peak exposure levels, diurnal amplitude, compound exposure frequency, and cooling deficit. Rank all 12 sites.",
      "why_it_matters": "Provides actionable site prioritization for interventions like shade structures, air quality monitors, or cooling centers based on multi-dimensional risk assessment.",
      "columns_needed": "pa_mean_pm2_5_atm_b_corr_2, kes_mean_wbgt_f, hour, site_name"
    },
    {
      "analysis": "Weekend vs Weekday Site-Specific Patterns",
      "what_to_compute": "For each site, calculate weekend-weekday differences in peak timing and magnitude for both pollutants. Test for sites with strongest weekend effects.",
      "why_it_matters": "Different sites may have distinct weekend patterns (residential vs commercial areas), informing targeted community messaging about when risks are highest.",
      "columns_needed": "pa_mean_pm2_5_atm_b_corr_2, kes_mean_wbgt_f, hour, is_weekend, site_name"
    }
  ],
  
  "kpi_recommendations": [
    {
      "kpi_name": "Compound Exposure Risk Hours",
      "formula": "Percentage of measurement hours where PM2.5 > 12 µg/m³ AND WBGT > 68°F",
      "why_meaningful": "Single metric capturing dual-stressor burden that most directly threatens community health, easily understood by non-experts as 'dangerous air + dangerous heat hours'"
    },
    {
      "kpi_name": "Peak Exposure Window",
      "formula": "3-hour time window with highest average compound risk score across all sites",
      "why_meaningful": "Identifies the single most critical time period for community health messaging and intervention timing"
    },
    {
      "kpi_name": "Site Thermal Recovery Rate", 
      "formula": "(Daily WBGT max - overnight WBGT min) / hours from peak to minimum",
      "why_meaningful": "Measures how quickly sites cool down overnight - critical for heat health equity as some areas may trap heat longer than others"
    },
    {
      "kpi_name": "Weekly Air Quality Burden",
      "formula": "Total person-hours above PM2.5 threshold per week (assuming constant occupancy)",
      "why_meaningful": "Translates pollution exposure into community health impact terms that resonate with public health officials and community advocates"
    },
    {
      "kpi_name": "Traffic Impact Factor",
      "formula": "(Rush hour PM2.5 mean - overnight PM2.5 mean) / overnight PM2.5 mean",
      "why_meaningful": "Quantifies how much traffic increases pollution exposure, directly linking transportation policy to environmental health outcomes"
    }
  ],

  "visualization_recommendations": [
    {
      "chart_type": "Interactive Multi-Layer Polar Plot",
      "data_encoded": "24-hour diurnal cycles for PM2.5 and WBGT as overlaid polar curves, with compound exposure zones highlighted",
      "why_best_choice": "Polar plots naturally represent cyclical time patterns and can overlay multiple variables while highlighting intersection zones where both exposures are high",
      "interactive_features": "Site selector toggle, threshold sliders for defining 'high' exposure, hover details showing exact values and percentile ranks"
    },
    {
      "chart_type": "Site Vulnerability Matrix Heatmap",
      "data_encoded": "12 sites × 4 vulnerability dimensions (PM2.5 peak, WBGT peak, compound exposure %, cooling deficit) with color intensity showing risk level",
      "why_best_choice": "Matrix format allows quick comparison across multiple risk dimensions simultaneously, identifying sites needing priority attention",
      "interactive_features": "Click to drill down to individual site detail view, sortable by any vulnerability dimension, tooltips with exact values and community context"
    },
    {
      "chart_type": "Animated Calendar Risk View", 
      "data_encoded": "Calendar grid showing daily compound exposure risk level with hourly detail on hover, animated progression through study period",
      "why_best_choice": "Calendar format is universally understood and shows temporal patterns community members can relate to their daily routines",
      "interactive_features": "Play/pause animation, click any day for hourly breakdown, filter by site, color coding for risk levels with clear legend"
    },
    {
      "chart_type": "Rush Hour Impact Scatter Plot",
      "data_encoded": "X-axis: distance to major road, Y-axis: rush hour PM2.5 elevation, point size: site foot traffic, color: WBGT level",
      "why_best_choice": "Scatter plots effectively show correlations between spatial factors and pollution impacts, revealing environmental justice patterns",
      "interactive_features": "Brushing to select point clusters, regression line toggle, site labels on hover, filter by rush hour period"
    },
    {
      "chart_type": "Stacked Area Time Series",
      "data_encoded": "Daily progression showing hours in different risk categories (low, moderate, high compound exposure) stacked by area",
      "why_best_choice": "Shows both absolute exposure burden and relative composition of risk levels over time, revealing temporal trends in community threat levels",
      "interactive_features": "Date range selector, site comparison mode, click legend to hide/show risk categories, export capability for community reporting"
    },
    {
      "chart_type": "Radial Bar Chart for DOW Patterns",
      "data_encoded": "7 days of week as radial segments, bar height showing peak exposure level, dual encoding for PM2.5 and WBGT",
      "why_best_choice": "Weekly cycles are naturally circular, and radial display emphasizes the continuous nature of weekly patterns while allowing dual variable encoding",
      "interactive_features": "Toggle between mean and percentile views, site selector, animation showing seasonal progression"
    },
    {
      "chart_type": "Violin Plot Distribution Comparison",
      "data_encoded": "Hour-by-hour distribution shapes for both PM2.5 and WBGT, showing not just means but full distribution patterns",
      "why_best_choice": "Violin plots reveal distributional differences that box plots miss - important for understanding exposure variability and extreme events",
      "interactive_features": "Brush to zoom on specific hours, overlay individual site distributions, toggle between pollutants"
    },
    {
      "chart_type": "Network Diagram of Temporal Correlations",
      "data_encoded": "Sites as nodes, edge thickness showing temporal correlation strength between sites for each pollutant",
      "why_best_choice": "Network visualization reveals spatial clustering and synchronization patterns that traditional maps cannot show effectively",
      "interactive_features": "Node dragging for layout adjustment, filter by correlation strength threshold, toggle between PM2.5 and WBGT networks"
    }
  ],

  "dashboard_layout": [
    {
      "dashboard_name": "Community Exposure Overview Dashboard",
      "visual_hierarchy": "Top: Key KPIs in large cards (25% screen height). Middle: Interactive polar plot showing current risk pattern (40% height). Bottom: Calendar view and site ranking (35% height).",
      "panel_arrangement": "3×4 grid. Row 1: 4 KPI cards spanning full width. Row 2: Large polar plot (75% width) + site selector panel (25% width). Row 3: Calendar view (60% width) + vulnerability ranking table (40% width).",
      "filters": "Master site selector (multiselect dropdown), date range slider, risk threshold sliders for PM2.5 and WBGT, weekend/weekday toggle",
      "color_scheme": "Health-intuitive color palette: blue-to-red gradient for PM2.5 (clean air to pollution), green-to-orange for WBGT (comfortable to dangerous heat), purple for compound risk zones",
      "screen_distribution": "KPIs 25%, main visualization 40%, temporal patterns 25%, controls/filters 10%",
      "story_flow": "User first sees current risk status (KPIs), then explores timing patterns (polar plot), finally examines specific dates and site comparisons (calendar/ranking)"
    },
    {
      "dashboard_name": "Site-Specific Risk Assessment Dashboard", 
      "visual_hierarchy": "Left sidebar: Site selection and vulnerability matrix (30% width). Main area: Detailed temporal patterns for selected site(s) (70% width). Top of main area: Rush hour vs normal comparison. Bottom: Seasonal progression.",
      "panel_arrangement": "Left column: Site vulnerability heatmap + site selector. Right area divided: Top half shows diurnal patterns and rush hour impact scatter. Bottom half shows temporal trends and weekend effects.",
      "filters": "Site multiselect with map preview, time period selector, comparison mode toggle (single vs multiple sites), exposure threshold customization",
      "color_scheme": "Consistent with overview dashboard but allows site-specific accent colors. Gray-to-red intensity for vulnerability levels, temporal patterns use consistent blue-red PM2.5 and green-orange WBGT encoding",
      "screen_distribution": "Site selection 30%, temporal analysis 45%, spatial correlation 25%",
      "story_flow": "Users select sites of interest, compare vulnerability scores, then drill into detailed temporal patterns and relationships with spatial factors like traffic proximity"
    }
  ],

  "educational_framing": {
    "key_takeaway": "Air pollution peaks at noon when people are most active outdoors, while dangerous heat peaks in late afternoon, creating a critical 3-6 PM window when both health threats are elevated.",
    "annotations_and_callouts": [
      "Arrow pointing to 3-6 PM zone: 'Highest Risk Window - limit outdoor activities'",
      "Callout on Monday PM2.5 peak: 'Monday = worst air quality day - likely from weekend traffic buildup'", 
      "Highlight overnight cooling rates: 'Sites that stay hot at night increase heat stroke risk'",
      "Rush hour markers: 'Traffic times = breathing danger times - especially near major roads'",
      "Weekend vs weekday differences: 'Different pollution patterns = different protection strategies needed'"
    ],
    "analogies_and_context": [
      "PM2.5 levels: 'Like cigarette smoke particles - 9.5 µg/m³ is equivalent to breathing air with light haze vs crystal clear'",
      "WBGT temperature: '65.9°F average feels like warm indoor temperature, but 68°F+ becomes dangerous for extended outdoor work'",
      "Diurnal patterns: 'Like a daily pollution and heat weather forecast - predictable enough to plan protective actions'",
      "Site differences: 'Some parks are like natural air conditioners (Mary Soo Hoo), others like urban heat islands (Chin Park)'",
      "Compound exposure: 'Like being hit by two health threats at once - breathing bad air while overheating'"
    ]
  }
}
```
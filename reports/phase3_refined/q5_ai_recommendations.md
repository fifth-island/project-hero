```json
{
  "ADDITIONAL_ANALYSES": [
    {
      "analysis": "Heat Stress Duration Analysis",
      "description": "Calculate consecutive hours above WBGT thresholds (70°F, 72°F, 74°F) for each site on hot days. Identify which sites have longest exposure periods and potential recovery windows.",
      "rationale": "Duration of heat exposure matters more for health than peak values alone"
    },
    {
      "analysis": "Microclimate Vulnerability Index",
      "description": "Create composite score combining: peak WBGT rank, nighttime heat retention rank, morning heating rate, and >74°F exceedance frequency. Classify sites as High/Medium/Low vulnerability.",
      "rationale": "Single metric for community to understand overall site heat risk"
    },
    {
      "analysis": "Heat-PM2.5 Synergistic Risk Mapping",
      "description": "Calculate time-weighted co-exposure index when both WBGT>72°F AND PM2.5>10μg/m³ occur simultaneously. Map hourly risk periods across sites.",
      "rationale": "Combined exposures create compounded health risks that need specific attention"
    },
    {
      "analysis": "Heat Wave vs Isolated Hot Day Comparison",
      "description": "Compare WBGT patterns, inter-site differences, and recovery periods between Jul 24-29 consecutive heat wave vs isolated hot days (Aug 8, Aug 13).",
      "rationale": "Heat wave physiology and urban heat island effects differ from single hot days"
    },
    {
      "analysis": "Morning Warming Rate by Site Characteristics",
      "description": "Correlate 6am-12pm WBGT rise rates with available site metadata (size, surrounding buildings, vegetation presence) to identify design factors affecting heat buildup.",
      "rationale": "Actionable insights for improving site design and heat mitigation"
    },
    {
      "analysis": "Peak Hour Heat Refuge Identification",
      "description": "Rank sites by coolest WBGT during critical afternoon hours (12-4pm) on hottest days. Calculate potential health benefit of moving between sites.",
      "rationale": "Practical guidance for community on where to seek relief during peak heat"
    },
    {
      "analysis": "Statistical Change Point Detection",
      "description": "Use change point analysis to identify exact timing when each site transitions from morning heating to afternoon peak to evening cooling phases.",
      "rationale": "Precise timing helps optimize outdoor activity scheduling and heat warning systems"
    }
  ],
  
  "KPI_RECOMMENDATIONS": [
    {
      "kpi": "Site Heat Vulnerability Score",
      "description": "Composite 1-10 scale combining peak WBGT rank, heating rate, and threshold exceedance frequency",
      "display": "Color-coded site ranking with vulnerability categories (High: 8-10, Medium: 4-7, Low: 1-3)"
    },
    {
      "kpi": "Dangerous Heat Hours",
      "description": "Total hours >74°F WBGT per site across all hot days (Tufts: 39.6%, Mary Soo Hoo: 12.3%)",
      "display": "Prominent percentage with site comparison bar chart"
    },
    {
      "kpi": "Heat-Air Pollution Co-Exposure Risk",
      "description": "Percentage of time with simultaneous WBGT>72°F AND PM2.5>10μg/m³ (currently 47.2% on hot days)",
      "display": "Risk thermometer gauge with threshold markers"
    },
    {
      "kpi": "Nighttime Heat Island Intensity",
      "description": "Overnight WBGT elevation above baseline (currently 7.04°F above non-hot nights)",
      "display": "Temperature differential with sleep health impact context"
    },
    {
      "kpi": "Coolest Peak-Hour Refuge Sites",
      "description": "Top 3 sites with lowest WBGT during critical 12-4pm period on hottest days",
      "display": "Ranked list with temperature differences and walking distances"
    }
  ],
  
  "VISUALIZATION_RECOMMENDATIONS": [
    {
      "chart_type": "Interactive Heat Map Timeline",
      "description": "Hourly WBGT across all 12 sites for top 5 hottest days, with temperature gradient color coding",
      "features": "Clickable cells showing exact values, site comparison tooltips, threshold line overlays"
    },
    {
      "chart_type": "Site Vulnerability Radar Chart",
      "description": "Multi-axis comparison of peak WBGT, heating rate, nighttime retention, and threshold exceedance for each site",
      "features": "Overlapping polygons for easy site comparison, color-coded vulnerability zones"
    },
    {
      "chart_type": "Diurnal Pattern Spaghetti Plot",
      "description": "24-hour WBGT curves for all sites on hottest day (July 27), with shaded risk zones",
      "features": "Thick lines for highest/lowest sites, interactive legend, peak timing annotations"
    },
    {
      "chart_type": "Co-Exposure Risk Scatter Plot",
      "description": "WBGT vs PM2.5 with points colored by site, sized by frequency, quadrants showing risk levels",
      "features": "Threshold lines at WBGT=72°F and PM2.5=10μg/m³, site filtering options"
    },
    {
      "chart_type": "Site Ranking Flow Chart",
      "description": "Sankey/alluvial diagram showing how sites rank differently for temperature vs WBGT vs humidity",
      "features": "Flowing bands highlight ranking changes, emphasizes humidity's role in heat stress"
    },
    {
      "chart_type": "Heat Duration Stacked Bar Chart",
      "description": "Consecutive hours above different WBGT thresholds (70°F, 72°F, 74°F, 75°F) by site",
      "features": "Color intensity increases with threshold, site sorting by total exposure time"
    },
    {
      "chart_type": "Nighttime Heat Retention Map",
      "description": "Site comparison of 9pm-6am average WBGT on hot days vs non-hot days",
      "features": "Diverging color scale showing heat retention intensity, sleep impact annotations"
    },
    {
      "chart_type": "Peak Hour Heat Refuge Guide",
      "description": "Horizontal bar chart ranking sites by coolest temperatures during 12-4pm peak hours",
      "features": "Temperature differences shown, walking time estimates, capacity/accessibility notes"
    }
  ],
  
  "DASHBOARD_LAYOUT": [
    {
      "dashboard_name": "Hot Day Heat Risk Overview",
      "layout": {
        "header": "KPI cards showing Heat Vulnerability Scores for top 3 highest/lowest risk sites",
        "left_panel": "Interactive heat map timeline (primary visualization) with site selector and day filter",
        "right_top": "Site vulnerability radar chart with comparison selector",
        "right_middle": "Co-exposure risk scatter plot with real-time filtering",
        "right_bottom": "Diurnal pattern comparison for selected sites",
        "footer": "Key findings callouts: humidity drives differences, nighttime heat retention, co-exposure risks"
      },
      "target_audience": "Researchers, public health officials, community leaders"
    },
    {
      "dashboard_name": "Community Heat Safety Guide", 
      "layout": {
        "header": "Simple traffic light indicators for current conditions at each site",
        "main_center": "Peak hour heat refuge guide (large, prominent) with site recommendations",
        "left_side": "Heat duration stacked bars showing 'dangerous heat hours' by location",
        "right_side": "Nighttime heat retention map with sleep health messaging",
        "bottom_banner": "Co-exposure risk gauge with actionable advice for high-risk periods",
        "sidebar": "Educational content: what is WBGT, why humidity matters, when to seek cooling"
      },
      "target_audience": "Chinatown residents, community organizations, outdoor workers"
    }
  ],
  
  "EDUCATIONAL_FRAMING": {
    "key_message": "Your local park or plaza can be significantly hotter or cooler than others just blocks away - and humidity makes the difference for your health.",
    "analogies": {
      "wbgt_explanation": "WBGT is like 'feels-like temperature' but more accurate for health - it accounts for humidity, sun, and wind together",
      "site_differences": "The 1.5°F difference between hottest and coolest sites is like the difference between a fever and normal temperature",
      "humidity_impact": "High humidity blocks your body's natural cooling (sweating) - like wearing a plastic bag while exercising"
    },
    "actionable_insights": {
      "site_selection": "On hot days, Mary Soo Hoo Park stays coolest while Tufts Garden gets most dangerous - plan activities accordingly",
      "timing_guidance": "Heat peaks at 3pm, but some sites cool faster than others - check site-specific timing",
      "co_exposure_warning": "Nearly half the time on hot days, you're getting hit with both heat stress AND air pollution - limit outdoor exercise",
      "nighttime_risks": "Hot days mean hot nights too - indoor cooling remains important even after sunset"
    },
    "health_context": {
      "threshold_meaning": "74°F WBGT = when healthy adults start feeling heat stress during light activity",
      "vulnerable_populations": "Children, elderly, and those with health conditions feel effects at lower temperatures",
      "duration_matters": "Hours of exposure count more than peak temperature - even 'moderate' heat becomes dangerous over time"
    },
    "visual_design_principles": {
      "color_coding": "Use intuitive green-yellow-red for safe-caution-danger, avoid rainbow scales",
      "comparative_context": "Always show differences between sites, not just absolute numbers",
      "time_emphasis": "Highlight that heat varies by hour and location - timing and place both matter",
      "uncertainty_communication": "Show confidence in findings through statistical significance indicators"
    }
  }
}
```
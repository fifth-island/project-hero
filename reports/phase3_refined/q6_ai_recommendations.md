```json
{
  "ADDITIONAL_ANALYSES": {
    "threshold_definition": {
      "approach": "Use relative high AQI days since no days exceeded 100",
      "recommended_threshold": "Top 10% of AQI days (≥70) or top 5 highest AQI days",
      "rationale": "Focus on locally significant air quality events for community relevance"
    },
    "comparative_metrics": [
      "PM2.5 deviation from site average on high AQI days",
      "Coefficient of variation across sites on high vs. low AQI days",
      "Site ranking consistency across different high AQI days",
      "Distance-weighted spatial correlation analysis"
    ],
    "temporal_patterns": {
      "intraday_analysis": "Hourly PM2.5 patterns on July 26 vs. typical days",
      "meteorological_correlation": "Wind patterns, temperature, humidity effects on spatial distribution",
      "lag_analysis": "Time delays in PM2.5 peaks across different sites"
    }
  },

  "KPI_RECOMMENDATIONS": {
    "spatial_disparity_metrics": {
      "max_min_ratio": "Ratio of highest to lowest PM2.5 reading across sites on high AQI days",
      "spatial_range": "Difference between maximum and minimum site readings",
      "hotspot_identification": "Sites consistently in top 25% on high AQI days"
    },
    "community_impact_indicators": {
      "population_weighted_exposure": "PM2.5 levels weighted by residential density near each site",
      "vulnerable_population_exposure": "Readings near schools, senior centers, healthcare facilities",
      "equity_index": "Ratio of highest exposed community to lowest exposed community"
    },
    "alert_thresholds": {
      "site_specific_percentiles": "90th percentile PM2.5 for each site as local alert threshold",
      "network_wide_disparity": "When site PM2.5 range exceeds 15 μg/m³",
      "trend_indicators": "3-day moving average exceeding site historical 75th percentile"
    }
  },

  "VISUALIZATION_RECOMMENDATIONS": {
    "primary_visualization": {
      "type": "Interactive map with proportional symbols",
      "description": "Chinatown map showing PM2.5 levels as sized/colored circles for July 26 and other high AQI days",
      "features": ["Time slider", "Site click-through for details", "Legend with health impact zones"]
    },
    "comparative_charts": [
      {
        "type": "Parallel coordinates plot",
        "purpose": "Show PM2.5 patterns across all 12 sites for top 5 AQI days",
        "interaction": "Highlight individual days, filter by AQI range"
      },
      {
        "type": "Heatmap matrix",
        "axes": "Sites (y-axis) vs. High AQI days (x-axis)",
        "color_scale": "PM2.5 concentration with diverging colors from network average"
      },
      {
        "type": "Box plot comparison",
        "categories": "Each site showing PM2.5 distribution on high AQI days vs. all days",
        "highlight": "Identify sites with highest variability"
      }
    ],
    "supporting_visuals": {
      "scatter_plot": "Site PM2.5 vs. distance from major roads/industrial sources",
      "time_series": "July 26 hourly PM2.5 trends for all sites with peak identification",
      "ranking_chart": "Site rankings on high AQI days with consistency indicators"
    }
  },

  "DASHBOARD_LAYOUT": {
    "header_section": {
      "title": "Air Quality Disparities on High Pollution Days",
      "key_metrics": ["Peak AQI: 75.8 (July 26)", "Site Range: XX μg/m³", "Most Affected Area: [Site Name]"]
    },
    "main_panel": {
      "primary": "Interactive Chinatown map (60% width)",
      "secondary": "Time series for selected day (40% width)",
      "controls": "Date selector, AQI threshold slider, site toggle"
    },
    "analysis_panels": [
      {
        "position": "Lower left",
        "content": "Parallel coordinates plot with day selector",
        "size": "33% width"
      },
      {
        "position": "Lower center", 
        "content": "Site ranking and consistency metrics",
        "size": "33% width"
      },
      {
        "position": "Lower right",
        "content": "Community impact summary and alerts",
        "size": "33% width"
      }
    ],
    "interactive_features": {
      "cross_filtering": "Site selection filters all charts",
      "brushing": "Time period selection on main chart",
      "tooltips": "Detailed metrics, health implications, nearby landmarks"
    }
  },

  "EDUCATIONAL_FRAMING": {
    "context_setting": {
      "headline": "Even on 'Moderate' Air Quality Days, Some Chinatown Areas Face Higher Pollution",
      "background": "While July 26's AQI of 75.8 falls in the 'moderate' range, PM2.5 levels varied significantly across our 12 monitoring sites, revealing important local air quality disparities."
    },
    "health_messaging": {
      "risk_communication": "PM2.5 differences of 10+ μg/m³ between sites can mean varying health risks for sensitive individuals",
      "vulnerable_populations": "Children, elderly residents, and those with respiratory conditions may experience symptoms even at moderate AQI levels",
      "actionable_guidance": "Residents near consistently higher-reading sites should consider limiting outdoor activities during elevated pollution periods"
    },
    "community_empowerment": {
      "local_knowledge": "Community members often notice air quality differences - this data validates those observations",
      "advocacy_tools": "Use site-specific data to request targeted interventions like traffic management or industrial monitoring",
      "personal_protection": "Identify cleaner areas within Chinatown for outdoor activities and commuting routes"
    },
    "scientific_literacy": {
      "spatial_concepts": "Air pollution can vary dramatically over short distances due to traffic, buildings, and wind patterns",
      "temporal_patterns": "High pollution episodes often show predictable spatial patterns that repeat during similar weather conditions",
      "data_limitations": "36 days provides a snapshot - longer monitoring reveals seasonal patterns and trend changes"
    }
  }
}
```
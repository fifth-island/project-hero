{
  "metadata": {
    "analysis_date": "2026-04-04T23:43:19.107911",
    "dataset_period": "2023-07-19T16:40:00 to 2023-08-23T15:50:00",
    "total_observations": 48123,
    "analysis_observations": 46253,
    "sites_analyzed": 12
  },
  "key_findings": {
    "research_question": "What is the relationship between PM2.5 and heat indicators, controlling for meteorological and temporal factors? Is there heterogeneity across sites?",
    "overall_relationship": {
      "correlation_coefficient": 0.3598,
      "correlation_strength": "Moderate positive",
      "p_value": "0.00e+00",
      "variance_explained": 12.9,
      "sample_size": 46253,
      "regression_slope": 0.3992,
      "interpretation": "Each 1\u00b0F increase in WBGT associates with 0.399 \u00b5g/m\u00b3 increase in PM2.5"
    },
    "site_heterogeneity": {
      "heterogeneity_detected": "True",
      "correlation_range": [
        0.229,
        0.62
      ],
      "strongest_site": {
        "name": "Berkeley Community Garden",
        "correlation": 0.62,
        "r_squared": 0.384
      },
      "weakest_site": {
        "name": "Mary Soo Hoo Park",
        "correlation": 0.229,
        "r_squared": 0.052
      },
      "mean_correlation": 0.379,
      "std_correlation": 0.095,
      "coefficient_of_variation": 25.0
    },
    "heat_stress_context": {
      "max_wbgt_celsius": 25.3,
      "mean_wbgt_celsius": 18.8,
      "above_28c_percent": 0.0,
      "heat_stress_level": "Low"
    },
    "air_quality_context": {
      "mean_pm25": 9.5,
      "exceed_who_guideline": 76.1,
      "exceed_epa_annual": 46.2,
      "exceed_epa_daily": 0.0
    }
  },
  "detailed_stats": {
    "pm25_statistics": {
      "mean": 9.48,
      "median": 8.3,
      "std": 5.36,
      "min": 0.88,
      "max": 25.09,
      "p25": 5.1,
      "p75": 13.46,
      "p95": 19.16,
      "count": 46253,
      "missing_pct": 3.9
    },
    "wbgt_statistics": {
      "mean": 65.85,
      "median": 66.2,
      "std": 4.83,
      "min": 54.8,
      "max": 77.5,
      "p25": 62.6,
      "p75": 68.9,
      "p95": 73.8,
      "count": 46253,
      "missing_pct": 3.9,
      "mean_celsius": 18.8,
      "max_celsius": 25.3
    },
    "correlation_results": {
      "pearson_r": 0.359751437637032,
      "pearson_p": 0.0,
      "pearson_ci": [
        0.3512479011973942,
        0.3682549740766698
      ],
      "spearman_rho": 0.3739579067781378,
      "spearman_p": 0.0,
      "r_squared": 0.1294210968819113,
      "sample_size": 46253
    },
    "regression_results": {
      "linear_model": {
        "intercept": -16.807956163133884,
        "slope": 0.39919453682017964,
        "r_squared": 0.12942109688190695,
        "adj_r_squared": 0.12940227396125392,
        "f_statistic": 6875.71813473305,
        "f_pvalue": 0.0,
        "slope_pvalue": 0.0
      },
      "polynomial_model": {
        "r_squared": 0.13523219455468305,
        "improvement": 0.0058110976727761
      }
    },
    "site_heterogeneity": [
      {
        "site_id": "berkley",
        "site_name": "Berkeley Community Garden",
        "n_obs": 2445,
        "correlation": 0.6199251031936949,
        "p_value": 1.3291846165725857e-259,
        "r_squared": 0.3843071335697146,
        "slope": 0.5981529427552144,
        "intercept": -30.008872544572856,
        "slope_pvalue": 1.3291846165690328e-259,
        "pm25_mean": 9.526223573247592,
        "wbgt_mean": 66.09529652351738
      },
      {
        "site_id": "chin",
        "site_name": "Chin Park",
        "n_obs": 2199,
        "correlation": 0.464466213363454,
        "p_value": 4.309852011967056e-118,
        "r_squared": 0.21572886335618535,
        "slope": 0.5134829372168326,
        "intercept": -23.408098049674358,
        "slope_pvalue": 4.309852011965547e-118,
        "pm25_mean": 10.488517945794062,
        "wbgt_mean": 66.01313021070185
      },
      {
        "site_id": "reggie",
        "site_name": "Reggie Wong Park",
        "n_obs": 4126,
        "correlation": 0.4218826814931029,
        "p_value": 8.925044661409984e-178,
        "r_squared": 0.17798499694381154,
        "slope": 0.4323538878936445,
        "intercept": -20.04974143063352,
        "slope_pvalue": 8.925044661398512e-178,
        "pm25_mean": 8.341168873045714,
        "wbgt_mean": 65.66590725480691
      },
      {
        "site_id": "eliotnorton",
        "site_name": "Eliot Norton Park",
        "n_obs": 3132,
        "correlation": 0.4131517079993779,
        "p_value": 2.117155233686221e-129,
        "r_squared": 0.1706943338228033,
        "slope": 0.4016131736050676,
        "intercept": -17.165698771803108,
        "slope_pvalue": 2.1171552336862427e-129,
        "pm25_mean": 9.133185270826884,
        "wbgt_mean": 65.48312100063589
      },
      {
        "site_id": "castle",
        "site_name": "Castle Square",
        "n_obs": 3793,
        "correlation": 0.40018677920844414,
        "p_value": 6.832459839930246e-146,
        "r_squared": 0.16014945825322746,
        "slope": 0.46395187628551005,
        "intercept": -22.79588180466229,
        "slope_pvalue": 6.832459839939401e-146,
        "pm25_mean": 8.174942530788629,
        "wbgt_mean": 66.7543896651727
      },
      {
        "site_id": "tufts",
        "site_name": "Tufts Community Garden",
        "n_obs": 4095,
        "correlation": 0.3799346544777858,
        "p_value": 9.105064426593536e-141,
        "r_squared": 0.1443503416731543,
        "slope": 0.4424451466004361,
        "intercept": -19.250190149052205,
        "slope_pvalue": 9.105064426604121e-141,
        "pm25_mean": 10.043676228771943,
        "wbgt_mean": 66.20903540903541
      },
      {
        "site_id": "dewey",
        "site_name": "Dewey Square",
        "n_obs": 4889,
        "correlation": 0.3458552438069181,
        "p_value": 2.1106149721112273e-137,
        "r_squared": 0.11961584966874239,
        "slope": 0.40855810071469734,
        "intercept": -17.23344156813379,
        "slope_pvalue": 2.110614972120618e-137,
        "pm25_mean": 9.694573545558038,
        "wbgt_mean": 65.90987932092453
      },
      {
        "site_id": "lyndenboro",
        "site_name": "Lyndboro Park",
        "n_obs": 4786,
        "correlation": 0.3320580143257121,
        "p_value": 1.4945247248140802e-123,
        "r_squared": 0.1102625248779352,
        "slope": 0.4059782787688945,
        "intercept": -16.047324374893822,
        "slope_pvalue": 1.4945247248159483e-123,
        "pm25_mean": 10.678015347442154,
        "wbgt_mean": 65.82948182198078
      },
      {
        "site_id": "taitung",
        "site_name": "Tai Tung Park",
        "n_obs": 4839,
        "correlation": 0.32070221733277127,
        "p_value": 3.6058045556570105e-116,
        "r_squared": 0.10284991220215745,
        "slope": 0.32661004037463626,
        "intercept": -12.171763304903148,
        "slope_pvalue": 3.6058045556544684e-116,
        "pm25_mean": 9.365121442362264,
        "wbgt_mean": 65.94066955982642
      },
      {
        "site_id": "greenway",
        "site_name": "One Greenway",
        "n_obs": 4893,
        "correlation": 0.31643744854573724,
        "p_value": 3.159621782757604e-114,
        "r_squared": 0.10013265884213651,
        "slope": 0.39495385162289726,
        "intercept": -15.24618705315768,
        "slope_pvalue": 3.1596217827513823e-114,
        "pm25_mean": 10.714991184167536,
        "wbgt_mean": 65.73218144511966
      },
      {
        "site_id": "oxford",
        "site_name": "Oxford Place Plaza",
        "n_obs": 2879,
        "correlation": 0.30245291399665575,
        "p_value": 5.701550244965556e-62,
        "r_squared": 0.09147776518506845,
        "slope": 0.255824900010656,
        "intercept": -8.857851838695947,
        "slope_pvalue": 5.701550244965579e-62,
        "pm25_mean": 7.925203506810359,
        "wbgt_mean": 65.60368183397013
      },
      {
        "site_id": "msh",
        "site_name": "Mary Soo Hoo Park",
        "n_obs": 4177,
        "correlation": 0.22882068880818213,
        "p_value": 9.42622840929656e-51,
        "r_squared": 0.05235890762665185,
        "slope": 0.22689999575236375,
        "intercept": -5.6951189127016075,
        "slope_pvalue": 9.42622840930167e-51,
        "pm25_mean": 9.072958201307165,
        "wbgt_mean": 65.08628202058894
      }
    ]
  }
}
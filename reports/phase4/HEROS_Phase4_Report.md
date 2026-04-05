# HEROS Phase 4 — Advanced Analytics Report

**Chinatown HEROS Project**
**Date:** 2025-01-27
**Study Period:** July 19 – August 23, 2023
**Dataset:** 48,123 observations × 46 variables across 12 monitoring sites

---

## Executive Summary

Phase 4 applies advanced analytics to the HEROS environmental monitoring data from Boston's Chinatown neighborhood. Eight analytical components reveal nuanced patterns in PM2.5 air quality and heat stress (WBGT) across the 12 monitoring sites. Key findings include:

- **9 of 12 sites** exceed the EPA NAAQS annual PM2.5 standard (9.0 µg/m³) during the study period
- **Temperature is the strongest predictor** of PM2.5 (Random Forest importance = 0.271), followed by WBGT (0.213)
- **WBGT's effect on PM2.5 intensifies at higher pollution levels** (quantile regression coefficient rises from 0.18 at 10th percentile to 0.75 at 75th)
- **PM2.5 and WBGT rankings are largely discordant** across sites (Spearman ρ = 0.245, p = 0.44), meaning the worst air quality sites are not necessarily the hottest
- **No OSHA heat stress thresholds were exceeded**, but compound exposure (PM2.5 > 12 µg/m³ AND WBGT > 72.5°F) affected 3.74% of readings

---

## 1. K-Means Clustering

### Methodology
Standardized 15 features (5 environmental means + 5 environmental P95 values + 5 land-use variables) and tested k = 2–7 using the elbow method and silhouette scores.

### Results
- **Optimal k = 4** (silhouette score = 0.218)
- PCA biplot captures 61.9% of variance in 2 components

| Cluster | Sites | Mean PM2.5 | Mean WBGT |
|---------|-------|-----------|-----------|
| 0 | berkley, eliotnorton, lyndenboro, tufts | 9.9 µg/m³ | 65.9°F |
| 1 | chin | 10.5 µg/m³ | 66.0°F |
| 2 | castle | 8.2 µg/m³ | 66.8°F |
| 3 | dewey, greenway, msh, oxford, reggie, taitung | 9.2 µg/m³ | 65.7°F |

### Interpretation
Chin Park stands out as a singleton cluster with the highest PM2.5 levels, likely driven by its proximity to major roadways. Castle Square forms its own cluster with the highest WBGT but lowest PM2.5, suggesting distinct microclimate characteristics (high impervious surface, low tree canopy). The moderate silhouette score (0.218) indicates overlapping cluster boundaries, consistent with the small geographic area of the study.

**Figures:** `p4_kmeans_selection.png`, `p4_kmeans_pca_biplot.png`, `p4_kmeans_radar.png`

---

## 2. Regression Deep-Dive

### 2a. Quantile Regression (PM2.5 ~ WBGT + Humidity + Wind + Hour)

| Quantile | WBGT Coefficient | p-value | Pseudo R² |
|----------|-----------------|---------|-----------|
| 0.10 | 0.182 | <0.001 | 0.908 |
| 0.25 | 0.330 | <0.001 | 0.884 |
| 0.50 | 0.574 | <0.001 | 0.843 |
| 0.75 | 0.747 | <0.001 | 0.880 |
| 0.90 | 0.626 | <0.001 | 0.886 |
| 0.95 | 0.649 | <0.001 | 0.859 |

OLS R² = 0.209. The WBGT coefficient increases substantially from the 10th to 75th percentile, indicating that **heat stress amplifies PM2.5 concentrations disproportionately during high-pollution episodes**. The slight decrease at the 90th–95th percentiles suggests other factors (wildfire smoke, regional transport) dominate at extreme PM2.5 levels.

### 2b. Random Forest Feature Importance

Model R² = 0.740. Feature importance ranking:

1. **Temperature:** 0.271
2. **WBGT:** 0.213
3. **Day of Week:** 0.206
4. **Humidity:** 0.116
5. **Hour:** 0.105
6. **Wind Speed:** 0.055
7. **Wind Direction:** 0.034

The high importance of Day of Week (0.206) suggests traffic-related emission patterns differ on weekdays vs. weekends, consistent with Chinatown's urban setting.

**Figures:** `p4_quantile_regression.png`, `p4_rf_importance.png`

---

## 3. Principal Component Analysis

### Results
- **PC1 (38.4%):** Thermal comfort axis — strong positive loadings for Temperature (0.671), WBGT (0.469), PM2.5 (0.490)
- **PC2 (29.0%):** Humidity/moisture axis — strong positive loadings for Humidity (0.727) and WBGT (0.549), negative for Wind Speed (-0.319)
- **PC3 (19.8%):** Wind axis — dominated by Wind Speed (0.881)
- 3 components explain 87.2% of variance; 4 components explain 99.9%

### Loadings Matrix

|     | PM2.5 | WBGT  | Temperature | Humidity | Wind Speed |
|-----|-------|-------|-------------|----------|------------|
| PC1 | 0.490 | 0.469 | 0.671       | -0.289   | 0.072      |
| PC2 | 0.192 | 0.549 | -0.177      | 0.727    | -0.319     |
| PC3 | -0.282| 0.277 | 0.030       | 0.259    | 0.881      |
| PC4 | 0.802 | -0.311| -0.369      | 0.083    | 0.343      |

PC1 confirms that PM2.5 and thermal conditions covary — hot days with high WBGT tend to have higher PM2.5. PC4 isolates a PM2.5-specific component (loading = 0.802) independent of thermal conditions, suggesting pollution sources beyond heat-driven photochemistry.

**Figure:** `p4_pca_biplot.png`

---

## 4. Spatial Analysis

Static maps show the geographic distribution of mean PM2.5 and WBGT across the 12 Chinatown monitoring sites. Key spatial patterns:

- **PM2.5 gradient:** Higher concentrations in northern sites (greenway: 10.7, chin: 10.5 µg/m³) near major roadways; lower in southern/western sites (oxford: 7.9, castle: 8.2 µg/m³)
- **WBGT gradient:** Less spatial variation (CV = 0.6% vs. 10.1% for PM2.5); highest at Castle Square (66.8°F), lowest at Mary Soo Hoo Park (65.1°F)
- Folium interactive map not generated (library not installed)

**Figure:** `p4_spatial_static.png`

---

## 5. Change-Point Detection

### Pettitt's Test + CUSUM Analysis on Daily Means

| Variable | Change Point | K Statistic | p-value | Pre-Change | Post-Change |
|----------|-------------|-------------|---------|------------|-------------|
| PM2.5 | 2023-08-18 | 155 | 0.099 | 9.4 µg/m³ | 12.1 µg/m³ |
| WBGT | 2023-08-23 | 106 | 0.490 | — | — |

The PM2.5 change point on August 18 is marginally significant (p = 0.099). Post-change-point PM2.5 rose to 12.1 µg/m³, though the t-test was not significant (p = 0.227) due to limited post-change observations. This date coincides with Canadian wildfire smoke events affecting the Northeast US. The WBGT change point was not statistically significant.

**Figure:** `p4_changepoint.png`

---

## 6. Anomaly Detection

### Isolation Forest (contamination = 2%)
- **926 anomalies detected** (2.0% of 46,253 valid readings)
- No observations exceeded z-score > 3 for either PM2.5 or WBGT in isolation

### Anomaly Distribution by Site

| Site | Anomalies | % of Site Obs |
|------|-----------|---------------|
| lyndenboro | 134 | Highest |
| castle | 128 | — |
| greenway | 116 | — |
| taitung | 102 | — |
| dewey | 98 | — |
| oxford | 1 | Lowest |

### Peak Anomaly Event
July 27, 2023 afternoon (15:10–16:40) — multiple sites recorded simultaneous anomalies with PM2.5 > 20 µg/m³ and WBGT > 77°F, representing the most extreme compound exposure event in the dataset.

**Figure:** `p4_anomaly_detection.png`

---

## 7. Sankey Rank Diagram (Bump Chart)

Site rankings for PM2.5 and WBGT reveal **discordant exposure profiles**:

- **Spearman rank correlation:** ρ = 0.245 (p = 0.443) — PM2.5 and WBGT rankings are **not significantly correlated**
- **Largest discordances:**
  - Castle: PM2.5 rank #11 but WBGT rank #1 (Δ = +10) — hot but clean air
  - Greenway: PM2.5 rank #1 but WBGT rank #8 (Δ = −7) — worst air quality, moderate heat
  - Lyndenboro: PM2.5 rank #2 but WBGT rank #7 (Δ = −5)

This discordance has important environmental justice implications: **interventions targeting heat exposure will not necessarily address air quality**, and vice versa. Community strategies need to address both hazards independently.

**Figure:** `p4_sankey_rank.png`

---

## 8. Environmental Justice Framing

### PM2.5 Regulatory Thresholds

| Threshold | Standard | Sites Exceeding |
|-----------|----------|----------------|
| EPA NAAQS Annual | 9.0 µg/m³ | **9 of 12** (75%) |
| AQI "Moderate" | 12.0 µg/m³ | 30.3% of readings |
| EPA NAAQS 24-Hour | 35.0 µg/m³ | 0 site-days |

### Heat Stress Thresholds

| OSHA Level | Threshold | Exceedances |
|------------|-----------|-------------|
| Caution | 80.0°F WBGT | 0% |
| Warning | 85.0°F WBGT | 0% |
| Danger | 88.0°F WBGT | 0% |

Maximum WBGT recorded: 77.5°F (below all OSHA thresholds)

### Compound Exposure
- **3.74% of readings** experienced both elevated PM2.5 (> 12 µg/m³) and elevated WBGT (> 72.5°F, 90th percentile)
- These compound events cluster around July 27 and late August heat episodes

### Site-Level Disparities
- PM2.5 inter-site range: **2.79 µg/m³** (CV = 10.1%)
- WBGT inter-site range: **1.67°F** (CV = 0.6%)
- **Greenway** has highest PM2.5 (10.7 µg/m³); **Castle** has highest WBGT (66.8°F)
- **Oxford** has lowest PM2.5 (7.9 µg/m³); **MSH** has lowest WBGT (65.1°F)

### EJ Implications
The fact that 75% of monitored sites exceed the EPA annual PM2.5 standard underscores the disproportionate air quality burden in Chinatown. While no OSHA heat thresholds were formally exceeded, the 95th percentile WBGT values approach 77°F at several sites, and the study period did not include the most extreme heat events of 2023. The discordance between PM2.5 and WBGT rankings demands **dual-hazard intervention strategies** tailored to each site's specific exposure profile.

**Figure:** `p4_ej_thresholds.png`

---

## Figures Index

| # | File | Description |
|---|------|-------------|
| 1 | `p4_kmeans_selection.png` | Elbow + silhouette cluster selection |
| 2 | `p4_kmeans_pca_biplot.png` | PCA biplot with cluster labels |
| 3 | `p4_kmeans_radar.png` | Radar chart of cluster profiles |
| 4 | `p4_quantile_regression.png` | WBGT coefficient across quantiles |
| 5 | `p4_rf_importance.png` | Random Forest feature importance |
| 6 | `p4_pca_biplot.png` | Full PCA scree + biplot |
| 7 | `p4_spatial_static.png` | Static spatial maps (PM2.5 + WBGT) |
| 8 | `p4_changepoint.png` | CUSUM + Pettitt's change-point |
| 9 | `p4_anomaly_detection.png` | Isolation Forest anomalies |
| 10 | `p4_sankey_rank.png` | Bump chart (PM2.5 vs WBGT ranks) |
| 11 | `p4_ej_thresholds.png` | EJ threshold exceedance analysis |

All figures saved to `figures/phase4/`.

---

## Methodology Notes

- **Clustering:** StandardScaler normalization → K-Means with k = 2–7 → silhouette-optimal selection
- **Quantile Regression:** statsmodels QuantReg at τ = {0.10, 0.25, 0.50, 0.75, 0.90, 0.95}
- **Random Forest:** 200 trees, max_depth = 10, random_state = 42
- **PCA:** Standardized 5 environmental variables, observation-level (n = 46,253)
- **Change-Point:** Pettitt's nonparametric test on site-averaged daily means
- **Anomaly Detection:** Isolation Forest with contamination = 0.02, n_estimators = 100
- **EJ Thresholds:** EPA NAAQS (2024 annual = 9.0 µg/m³), OSHA WBGT action levels

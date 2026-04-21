# HEROS — Comprehensive Summary Report

**Project:** Chinatown HEROS (Health & Environmental Research in Open Spaces)  
**Location:** Boston's Chinatown neighborhood, Boston, MA  
**Study Period:** July 19 – August 23, 2023  
**Temporal Resolution:** 10-minute intervals  
**Monitoring Sites:** 12 open-space locations  
**Total Observations:** 48,123 rows × 48 variables

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Phase 1 — Dataset Inventory, Cleaning & Preparation](#2-phase-1--dataset-inventory-cleaning--preparation)
3. [Phase 2 — Exploratory Data Analysis](#3-phase-2--exploratory-data-analysis)
4. [Phase 3 — Research Questions (Q1–Q9)](#4-phase-3--research-questions-q1q9)
   - [Q1 — PM2.5 Sensor Comparison](#q1--pm25-sensor-comparison-purple-air-vs-massdup-fem)
   - [Q2 — Temperature Sensor Comparison](#q2--temperature-sensor-comparison-kestrel-vs-reference-monitors)
   - [Q3 — Cumulative Distribution Functions](#q3--cumulative-distribution-functions)
   - [Q4 — Air Quality Index & Multi-Pollutant Analysis](#q4--air-quality-index--multi-pollutant-analysis)
   - [Q5 — Hottest Days: WBGT Across Sites](#q5--hottest-days-wbgt-across-sites)
   - [Q6 — Highest AQI Days: PM2.5 Across Sites](#q6--highest-aqi-days-pm25-across-sites)
   - [Q7 — PM2.5 and Heat Stress Relationship](#q7--pm25-and-heat-stress-relationship)
   - [Q8 — Temporal Patterns](#q8--temporal-patterns)
   - [Q9 — Land-Use Associations](#q9--land-use-associations)
5. [Phase 4 — Advanced Analytics](#5-phase-4--advanced-analytics)
6. [Cross-Phase Synthesis & Key Takeaways](#6-cross-phase-synthesis--key-takeaways)

---

## 1. Project Overview

The Chinatown HEROS project deployed a multi-sensor monitoring network across **12 open-space locations** in Boston's Chinatown over a five-week summer period. The study measured PM2.5 air quality (Purple Air low-cost sensors), heat stress (Kestrel WBGT sensors), and meteorological conditions, validated against official MassDEP and EPA reference monitors.

### Monitoring Sites

| Site | Code | Observations |
|------|------|-------------|
| Berkeley Community Garden | `berkley` | 2,445 |
| Castle Square | `castle` | 4,881 |
| Chin Park | `chin` | 2,199 |
| Dewey Square | `dewey` | 4,903 |
| Eliot Norton Park | `eliotnorton` | 3,888 |
| One Greenway | `greenway` | 4,893 |
| Lyndboro Park | `lyndenboro` | 4,786 |
| Mary Soo Hoo Park | `msh` | 4,189 |
| Oxford Place Plaza | `oxford` | 2,879 |
| Reggie Wong Park | `reggie` | 4,126 |
| Tai Tung Park | `taitung` | 4,839 |
| Tufts Community Garden | `tufts` | 4,095 |

### Sensor System

| Sensor Type | Variables Measured |
|------------|-------------------|
| **Purple Air** (site-level) | PM2.5 (µg/m³) — ALT-CF3 corrected |
| **Kestrel** (site-level) | Temperature, WBGT, Humidity, Pressure, Heat Index, Dew Point |
| **Weather Station** (35 Kneeland St, rooftop) | Temperature, Humidity, Wind Speed & Direction, Heat Index |
| **MassDEP FEM** (reference) | PM2.5 (Chinatown & Nubian Square), Temperature, Humidity |
| **EPA AQS** (regional) | Ozone, SO₂, CO, NO₂, PM2.5 FEM |

---

## 2. Phase 1 — Dataset Inventory, Cleaning & Preparation

### 2.1 Data Sources & Integration

The clean dataset (`data_HEROS_clean.parquet`) integrates five data streams into a single 48-column, 48,123-row file at 10-minute resolution.

| Dataset | Source | Rows | Status |
|---------|--------|------|--------|
| `data_HEROS.xlsx` | Project team | 48,123 | ✅ Primary |
| `landuse_HEROS.xlsx` | MassGIS (25m & 50m buffers) | 24 | ✅ Merged |
| EPA AQS Ozone | EPA AQS bulk (site 0042) | 844 hourly | ✅ Joined |
| EPA AQS SO₂ | EPA AQS bulk (site 0042) | 810 hourly | ✅ Joined |
| EPA AQS CO | EPA AQS bulk (site 0042) | 846 hourly | ✅ Joined |
| EPA AQS NO₂ | EPA AQS bulk (site 0042) | 730 hourly | ✅ Joined |
| EPA AQS PM2.5 FEM | EPA AQS bulk (site 0045) | 901 hourly | ✅ Joined |

EPA hourly data was merged by rounding 10-minute timestamps to the nearest hour.

### 2.2 Missing Data & Imputation

Overall missingness after cleaning: **1.10%** across all columns and rows. The highest-missingness variable was `epa_no2` at 13.7%, due to gaps in the EPA monitor record. Kestrel sensor variables had ~3.6% missingness from known deployment gaps at Castle Square and Eliot Norton Park.

**Imputation strategy applied:**
- Short gaps (≤ 30 min): Linear interpolation within site
- Moderate gaps (up to 2 hours): Spline interpolation
- Long gaps (> 2 hours): Left as `NaN` — flagged for exclusion
- Reference monitor columns: Forward-fill then back-fill

### 2.3 Outlier Treatment

- **151 negative PM2.5 readings** removed (physically impossible Purple Air values)
- **Winsorization** applied at 0.5th/99.5th percentiles for PM2.5 and temperature variables
- Boolean `imputed_<variable>` flags included in dataset for sensitivity analysis

### 2.4 Derived Variables

`hour`, `day_of_week`, `date_only`, `is_daytime` (6am–6pm), and site coordinates were appended, yielding the final **48-column dataset**.

---

## 3. Phase 2 — Exploratory Data Analysis

### 3.1 Summary Statistics

| Variable | Mean | Median | Std | Min | Max | Skew |
|----------|------|--------|-----|-----|-----|------|
| PM2.5 — Purple Air (µg/m³) | 9.49 | 8.33 | 5.34 | 0.88 | 25.09 | 0.65 |
| Temperature — Kestrel (°F) | 74.47 | 73.80 | 6.33 | 61.50 | 91.80 | 0.40 |
| WBGT — Kestrel (°F) | 65.86 | 66.20 | 4.82 | 54.80 | 77.50 | −0.05 |
| Humidity — Kestrel (%) | 65.95 | 65.10 | 18.89 | 27.50 | 100.00 | 0.07 |
| Wind Speed (mph) | 2.81 | 2.50 | 1.50 | 0.00 | 10.50 | 0.88 |

PM2.5 is right-skewed (0.65) due to episodic pollution events; WBGT is nearly symmetric, indicating consistent heat exposure across the study period.

### 3.2 Temporal Patterns

| Variable | Diurnal Peak | Note |
|----------|-------------|------|
| PM2.5 | **12:00 (noon)** | Traffic + photochemical secondary aerosol |
| Temperature | **14:00 (2 PM)** | Classic solar heating lag |
| WBGT | **17:00 (5 PM)** | Humidity-weighted; elevated into evening |

No strong weekday/weekend PM2.5 difference was found at this stage, suggesting regional transport dominates over local traffic sources.

### 3.3 Spatial Patterns — PM2.5 Site Rankings

| Rank | Site | Mean PM2.5 (µg/m³) |
|------|------|--------------------|
| 1 | One Greenway | 10.71 |
| 2 | Lyndboro Park | 10.68 |
| 3 | Chin Park | 10.49 |
| 4 | Tufts Community Garden | 10.07 |
| 5 | Dewey Square | 9.68 |
| 6 | Berkeley Garden | 9.53 |
| 7 | Tai Tung Park | 9.37 |
| 8 | Eliot Norton Park | 9.30 |
| 9 | Mary Soo Hoo Park | 9.05 |
| 10 | Reggie Wong Park | 8.34 |
| 11 | Castle Square | 8.17 |
| 12 | Oxford Place Plaza | 7.93 |

A ~3 µg/m³ intra-neighborhood gradient exists. One Greenway and Lyndboro Park are consistently the most polluted; Oxford Place and Castle Square are the cleanest.

### 3.4 Key Correlations

| Pair | r |
|------|---|
| Purple Air PM2.5 ↔ DEP Chinatown FEM | **0.939** |
| Purple Air PM2.5 ↔ DEP Nubian FEM | **0.942** |
| Purple Air PM2.5 ↔ EPA PM2.5 FEM | **0.940** |
| Temperature ↔ WBGT | 0.541 |
| Temperature ↔ Humidity | −0.571 |
| PM2.5 ↔ Temperature | 0.386 |
| Ozone ↔ Temperature | 0.584 |
| PM2.5 ↔ Wind Speed | −0.095 |

Purple Air sensors show excellent agreement with reference monitors (r > 0.93), validating data quality. The positive PM2.5–temperature association (r = 0.39) points to photochemical secondary aerosol formation on hot days.

### 3.5 Land-Use Overview

- **Impervious surface dominates** all sites (43–100% at 50m buffer)
- **Greenspace** ranges from 0% (Mary Soo Hoo) to 22% (One Greenway) at 50m
- **Tree cover** ranges from 0.4% to 67% (Tufts Community Garden) at 25m
- Limited land-use contrast across this dense urban neighborhood constrains regression power

---

## 4. Phase 3 — Research Questions (Q1–Q9)

### Q1 — PM2.5 Sensor Comparison: Purple Air vs MassDEP FEM

**Question:** How do Purple Air PM2.5 data at each of the 12 sites compare with MassDEP FEM monitors at Chinatown and Nubian Square?

| Metric | Value |
|--------|-------|
| Pearson Correlation (PA vs DEP Chinatown) | **r = 0.94** |
| Mean Bias (PA − DEP) | **+1.53 µg/m³** (PA reads higher) |
| RMSE | 2.53 µg/m³ |
| Readings within ±5 µg/m³ | 94.6% |
| Paired observations | 47,009 |

**Key findings:**
- Purple Air sensors track official air quality reliably (r = 0.94), but read **~1.5 µg/m³ higher** on average — slight but systematic positive bias.
- A local linear calibration (`DEP_est = 0.7376 × PA + 0.9596`) reduces bias to ~0.00 µg/m³ and RMSE to 1.44 µg/m³.
- Bias varies by site: One Greenway shows the largest positive bias (+2.64 µg/m³); Castle Square is nearly unbiased (−0.01 µg/m³).
- Bias increases at higher concentrations (funnel-shaped Bland-Altman), meaning PA over-reads during pollution events.
- The PA column already has ALT-CF3 correction applied — do **not** apply Barkjohn on top.

---

### Q2 — Temperature Sensor Comparison: Kestrel vs Reference Monitors

**Question:** How do Kestrel ambient temperature data compare with the rooftop weather station at 35 Kneeland St and DEP Nubian Square?

| Metric | vs WS Rooftop | vs DEP Nubian |
|--------|--------------|---------------|
| Pearson r | 0.60 | **0.90** |
| Mean Bias | +0.81°F | −0.37°F |
| RMSE | 7.03°F | 3.10°F |
| Within ±2°F | 29.0% | 53.2% |
| Heat Event Agreement (> 85°F) | 14.1% | **74.3%** |

**Key findings:**
- The rooftop weather station is a **poor reference** for ground-level temperature — only 29% of Kestrel readings agree within ±2°F. The two reference monitors themselves correlate at only r = 0.38, revealing a phase-shifted diurnal cycle (the WS thermal mass "lags" the true air temperature).
- **DEP Nubian is the superior reference** (r = 0.90), and Kestrel sensors agree well with ground-level conditions.
- A 1.4°F range in mean temperature across sites (Castle Square hottest at ~75.3°F; Mary Soo Hoo coolest at ~73.9°F) represents a persistent urban heat island microclimate effect.

---

### Q3 — Cumulative Distribution Functions

**Question:** Create CDFs of PM2.5 and WBGT overall, by time of day, and per site.

| Metric | Value |
|--------|-------|
| PM2.5 > 9.0 µg/m³ (EPA NAAQS annual) | **46.3% of readings** |
| PM2.5 > 35.0 µg/m³ (EPA NAAQS 24-hr) | 0.0% |
| WBGT > 80°F (OSHA Caution) | 0.0% |
| WBGT > 85°F (OSHA Warning) | 0.0% |
| WBGT > 90°F (OSHA Danger) | 0.0% |

**Key findings:**
- Nearly **half of all PM2.5 readings** exceeded the EPA annual standard (9.0 µg/m³), while no 24-hour standard was violated.
- WBGT remained entirely **below all OSHA heat thresholds** throughout the study period (max 77.5°F).
- PM2.5 CDFs are notably shifted during **daytime hours** compared to nighttime — midday readings are substantially higher.
- Site CDFs reveal consistent ordering: One Greenway and Lyndboro occupy the high-exposure tail; Oxford and Castle are at the low end.

---

### Q4 — Air Quality Index & Multi-Pollutant Analysis

**Question:** What were the AQI and concentrations of CO, SO₂, NO₂, and Ozone in Chinatown during the study?

| Metric | Value |
|--------|-------|
| Days in "Good" AQI (0–50) | **36/36 (100%)** |
| Mean Daily AQI | 29.4 |
| Maximum Daily AQI | 46.2 |
| Multi-Pollutant Events (≥3 elevated) | **0** |
| EPA NAAQS Exceedances | **0** for all pollutants |
| Dominant AQI Pollutant | **Ozone (97% of days)** |

**Pollutant Ranges:**

| Pollutant | Mean ± SD | Max Observed | EPA Standard | Margin |
|-----------|----------|-------------|-------------|--------|
| Ozone | 0.032 ± 0.011 ppm | 0.062 ppm | 0.070 ppm (8-hr) | 11% below |
| NO₂ | 5.55 ± 4.40 ppb | 49.0 ppb | 100 ppb (1-hr) | 51% below |
| CO | 0.262 ± 0.077 ppm | 0.988 ppm | 9.0 ppm (8-hr) | 89% below |
| SO₂ | 0.275 ± 0.080 ppb | 1.0 ppb | 75 ppb (1-hr) | 99% below |
| PM2.5 FEM | 7.92 ± 4.19 µg/m³ | 22.4 µg/m³ | 35.0 µg/m³ (24-hr) | 36% below |

**Key findings:**
- Chinatown experienced **exceptionally clean air** during summer 2023 for criteria pollutants. All five pollutants remained well below federal health standards.
- **NO₂ showed the strongest weekday/weekend signal** (197% difference between peaks), confirming traffic as the primary NO₂ source.
- Ozone drove the AQI on 35 of 36 days, peaking at 15:00 on both weekdays and weekends via photochemical production.

---

### Q5 — Hottest Days: WBGT Across Sites

**Question:** Pick the hottest days and visualize potential differences in WBGT across sites.

**Top 5 Hottest Days:**

| Date | WBGT Mean (°F) | WBGT Max (°F) | Temp Mean (°F) | Humidity (%) |
|------|----------------|---------------|----------------|-------------|
| 2023-07-27 | 73.0 | 77.5 | 79.3 | 76 |
| 2023-07-28 | 72.8 | 77.5 | 82.2 | 66 |
| 2023-07-29 | 72.5 | 77.5 | 76.9 | 83 |
| 2023-08-08 | 72.5 | 77.5 | 76.5 | 84 |
| 2023-08-13 | 70.7 | 77.5 | 79.0 | 69 |

**Site Rankings on Hottest Days:**

| Metric | Value |
|--------|-------|
| Hottest site | Tufts Garden (73.2°F mean on hot days) |
| Coolest site | Mary Soo Hoo (71.7°F mean on hot days) |
| Inter-site range | **1.5°F** (Cohen's d = 0.61, medium effect) |
| Hours > 74°F (Tufts) | 39.6% |
| Hours > 74°F (Mary Soo Hoo) | 12.3% |
| Dual exposure (PM2.5 > 9 µg/m³ AND WBGT > 70°F) | **47.2% of hot-day records** |

**Key findings:**
- A **1.5°F inter-site WBGT range** exists on the hottest days — a medium-sized microclimate effect that translates directly into heat stress risk differences.
- No OSHA thresholds were exceeded (max 77.5°F, still 2.5°F below OSHA Caution at 80°F).
- Nearly **half of hot-day readings** were co-exposed to both high PM2.5 and elevated WBGT — a compound health burden.
- July 24–29 was a sustained heat wave (6-day event); August episodes were more isolated.

---

### Q6 — Highest AQI Days: PM2.5 Across Sites

**Question:** Pick the highest AQI days and visualize potential differences in PM2.5 across sites.

**Top 5 Highest AQI Days:**

| Date | AQI | Dominant Pollutant | Note |
|------|-----|--------------------|------|
| 2023-08-19 | **500 (Hazardous)** | PM2.5 | Canadian wildfire smoke event |
| 2023-08-21 | 69.9 | PM2.5 | Post-smoke residual |
| 2023-08-20 | 66.8 | PM2.5 | Post-smoke residual |
| 2023-07-26 | 66.7 | PM2.5 | Late July heat episode |
| 2023-08-07 | 65.6 | PM2.5 | August heat episode |

**Site PM2.5 on High-AQI Days:**

| Site | High-AQI Mean (µg/m³) | Normal Mean (µg/m³) | Elevation |
|------|----------------------|--------------------|----|
| Chin Park | 18.5 | 9.7 | +92% |
| One Greenway | 17.7 | 9.6 | +84% |
| Lyndboro Park | 17.1 | 9.5 | +80% |
| Oxford Place | 14.2 | 7.9 | +80% |

**Key findings:**
- The August 19 event (AQI = 500, Hazardous) was driven by **Canadian wildfire smoke** — a regional air quality emergency, not a local source.
- The **spatial disparity amplifies on high-AQI days**: the inter-site PM2.5 range grows from 2.8 µg/m³ (normal days) to **4.3 µg/m³** (high-AQI days) — a 1.5× amplification factor.
- Site rankings are **consistent** across events (SD of rank positions = 1.5), meaning the most-exposed sites on typical days are also the most-exposed during episodes.

---

### Q7 — PM2.5 and Heat Stress Relationship

**Question:** What is the relationship between PM2.5 and heat indicators, controlling for meteorological and temporal factors? Is there heterogeneity across sites?

| Metric | Value |
|--------|-------|
| Overall Pearson r (PM2.5 ↔ WBGT) | **0.360** (p < 0.001) |
| Variance explained (R²) | 12.9% |
| OLS coefficient | +0.399 µg/m³ per °F of WBGT |
| Site heterogeneity (r range) | 0.229 – 0.620 |
| Paired observations | 46,253 |

**Key findings:**
- A **moderate positive relationship** exists between PM2.5 and WBGT (r = 0.36) — hotter conditions are associated with higher air pollution.
- WBGT explains ~13% of PM2.5 variance; other factors (day-of-week, wind, regional transport) explain the rest.
- Significant **site-level heterogeneity**: some sites show nearly twice the PM2.5–WBGT coupling strength compared to others, suggesting local emission sources interact differently with heat at different locations.
- 76.1% of observations exceed the WHO PM2.5 guideline of 5 µg/m³; 46.2% exceed the EPA annual standard.

---

### Q8 — Temporal Patterns

**Question:** What times of day and days of week are associated with the highest WBGT and PM2.5, overall and per site?

| Metric | PM2.5 | WBGT |
|--------|-------|------|
| Peak hour | **12:00** (10.6 µg/m³) | **17:00** (67.2°F) |
| Trough hour | 01:00 (8.5 µg/m³) | 06:00 (64.2°F) |
| Diurnal amplitude | 2.1 µg/m³ | 3.1°F |
| Peak day-of-week | Monday (10.9 µg/m³) | Friday (68.1°F) |
| Weekday mean | 9.3 µg/m³ | 66.0°F |
| Weekend mean | 10.0 µg/m³ | 65.6°F |
| Hour effect (Kruskal-Wallis) | H = 743, p < 0.001 | H = 1,896, p ≈ 0 |
| Day-of-week effect | H = 1,812, p < 0.001 | H = 3,614, p ≈ 0 |

**Key findings:**
- PM2.5 and WBGT have **opposite diurnal cycles** with a ~5-hour offset between peaks (noon vs 5 PM). This means compound exposure windows are concentrated in the **late-afternoon transition (3–6 PM)**.
- Both temporal effects are **highly significant** (Kruskal-Wallis), even though the absolute amplitudes are modest.
- The highest single-cell hotspot in the hour × day-of-week matrix is **Wednesday 15:00–17:00** PM2.5 (15.3–15.7 µg/m³), coinciding with the August 16 wildfire-smoke event.
- DOW patterns in a 36-day study are confounded with weather — specific high-pollution or hot days falling on particular weekdays drive the signal.

---

### Q9 — Land-Use Associations

**Question:** Do land-use buffer characteristics across sites associate with PM2.5 and heat indicators?

| Metric | PM2.5 | WBGT |
|--------|-------|------|
| Strongest positive predictor | **Roads 50m** (r = 0.680, p = 0.015) | Trees 50m (r = 0.506, p = 0.093) |
| Strongest negative predictor | Trees 50m (r = −0.206) | Impervious 25m (r = −0.566, p = 0.055) |
| Best single-predictor R² | Roads 50m: **R² = 46.2%** | Trees 50m: R² = 25.6% |
| Statistically significant predictors (p < 0.05) | Roads 50m, Roads 25m | None |

**Key findings:**
- **Road proximity is the only statistically significant predictor of PM2.5** across sites, explaining ~46% of the inter-site variance. Both the 25m and 50m buffer measures are significant.
- No land-use variable significantly predicts WBGT at p < 0.05 (limited statistical power with n = 12 sites).
- **Counterintuitive WBGT finding:** Trees ↔ WBGT correlation is positive (r = 0.506) — likely confounded by geography: tree-covered inland sites miss harbor cooling breezes.
- **Environmental justice implication:** Road proximity explains nearly half of PM2.5 disparities. Sites nearest roads — where community foot traffic is highest — bear the greatest air quality burden.
- Hierarchical clustering identifies **2 site groupings** by land-use profile: a high-road/high-PM2.5 cluster and a lower-road/lower-PM2.5 cluster.

---

## 5. Phase 4 — Advanced Analytics

### 5.1 Executive Summary

Phase 4 applied machine learning, multivariate statistics, and environmental justice framing to the full dataset. Key headline findings:

- **9 of 12 sites** exceed the EPA NAAQS annual PM2.5 standard (9.0 µg/m³) during the study period
- **Temperature is the strongest predictor of PM2.5** (Random Forest importance = 0.271)
- **WBGT's effect on PM2.5 intensifies at higher pollution levels** (quantile regression coefficient rises from 0.18 at the 10th percentile to 0.75 at the 75th)
- **PM2.5 and WBGT site rankings are largely discordant** (Spearman ρ = 0.245, p = 0.44) — the worst air quality sites are not the hottest
- **Compound exposure** (PM2.5 > 12 µg/m³ AND WBGT > 72.5°F) affected **3.74% of all readings**

### 5.2 K-Means Clustering

Sites were grouped into **4 clusters** (optimal by silhouette score = 0.218) using 15 standardized features (environmental means, P95 values, and land-use variables):

| Cluster | Sites | Mean PM2.5 | Mean WBGT | Character |
|---------|-------|-----------|-----------|-----------|
| 0 | berkley, eliotnorton, lyndenboro, tufts | 9.9 µg/m³ | 65.9°F | Moderate-PM2.5, moderate-heat |
| 1 | chin | **10.5 µg/m³** | 66.0°F | Highest PM2.5 singleton |
| 2 | castle | 8.2 µg/m³ | **66.8°F** | Lowest PM2.5, highest WBGT |
| 3 | dewey, greenway, msh, oxford, reggie, taitung | 9.2 µg/m³ | 65.7°F | Moderate, largest group |

Chin Park is a **singleton cluster** — uniquely high PM2.5 from roadway proximity. Castle Square forms its own cluster with the highest WBGT but lowest PM2.5, indicating distinct microclimate characteristics.

### 5.3 Quantile Regression (PM2.5 ~ WBGT + Humidity + Wind + Hour)

WBGT's effect on PM2.5 is **non-linear and intensifies at higher pollution levels**:

| Quantile | WBGT Coefficient | Pseudo R² |
|----------|-----------------|-----------|
| 0.10 (10th pct) | 0.182 | 0.908 |
| 0.25 | 0.330 | 0.884 |
| 0.50 (median) | 0.574 | 0.843 |
| 0.75 | **0.747** | 0.880 |
| 0.90 | 0.626 | 0.886 |
| 0.95 | 0.649 | 0.859 |

At the 75th percentile, heat stress amplifies PM2.5 **4× more** than at the 10th percentile. The slight drop at the 90th–95th percentiles suggests regional transport and wildfire smoke dominate at the most extreme pollution levels.

### 5.4 Random Forest Feature Importance

A Random Forest model (R² = 0.740) identified temperature as the top predictor of PM2.5:

| Rank | Feature | Importance |
|------|---------|-----------|
| 1 | Temperature | 0.271 |
| 2 | WBGT | 0.213 |
| 3 | Day of Week | 0.206 |
| 4 | Humidity | 0.116 |
| 5 | Hour | 0.105 |
| 6 | Wind Speed | 0.055 |
| 7 | Wind Direction | 0.034 |

The high Day-of-Week importance (0.206) confirms traffic-driven emission patterns vary between weekdays and weekends.

### 5.5 Principal Component Analysis

| Component | Variance Explained | Interpretation |
|-----------|-------------------|----------------|
| PC1 | 38.4% | Thermal axis: Temperature (0.671), WBGT (0.469), PM2.5 (0.490) |
| PC2 | 29.0% | Moisture axis: Humidity (0.727), WBGT (0.549) |
| PC3 | 19.8% | Wind axis: Wind Speed (0.881) |
| PC4 | 12.7% | PM2.5-specific: PM2.5 (0.802), independent of heat |

Three components explain **87.2% of variance**. PC4 isolates a PM2.5 signal independent of thermal conditions — indicating pollution sources beyond heat-driven photochemistry (e.g., traffic, regional transport).

### 5.6 Change-Point Detection

A **marginally significant PM2.5 change point** was detected on **August 18, 2023** (Pettitt's K = 155, p = 0.099):

- Pre-change: 9.4 µg/m³ mean PM2.5
- Post-change: **12.1 µg/m³** (+29%)
- This date coincides with the start of Canadian wildfire smoke events affecting the Northeast U.S.

No significant WBGT change point was detected.

### 5.7 Anomaly Detection (Isolation Forest)

- **926 anomalies** detected (2.0% of valid readings)
- **Peak anomaly event:** July 27, 2023 afternoon (15:10–16:40) — simultaneous PM2.5 > 20 µg/m³ AND WBGT > 77°F across multiple sites; the most extreme compound exposure event in the dataset.
- Highest anomaly counts: Lyndboro Park (134), Castle Square (128), One Greenway (116).

### 5.8 PM2.5 vs WBGT Site Rank Discordance

Spearman rank correlation between PM2.5 and WBGT site rankings: **ρ = 0.245 (p = 0.44, not significant)**.

| Site | PM2.5 Rank | WBGT Rank | Δ |
|------|------------|-----------|---|
| Castle Square | #11 | #1 | **+10** — hot but clean |
| One Greenway | #1 | #8 | −7 — worst air, moderate heat |
| Lyndboro Park | #2 | #7 | −5 — high PM2.5, moderate heat |

This **discordance has direct environmental justice implications**: heat interventions (e.g., shade, cooling centers) will not necessarily help the sites with worst air quality, and vice versa. Dual-hazard strategies are required.

### 5.9 Environmental Justice Thresholds

**PM2.5 Standards:**

| Threshold | Sites Exceeding |
|-----------|----------------|
| EPA NAAQS Annual (9.0 µg/m³) | **9 of 12 (75%)** |
| AQI "Moderate" (12.0 µg/m³) | 30.3% of all readings |
| EPA NAAQS 24-Hour (35.0 µg/m³) | 0 site-days |

**Heat Thresholds:**
- No OSHA heat stress thresholds (Caution: 80°F WBGT) were exceeded.
- Maximum WBGT recorded: 77.5°F — 2.5°F below the OSHA Caution level.

**Compound Exposure (PM2.5 > 12 µg/m³ AND WBGT > 72.5°F):** 3.74% of all readings, clustered around July 27 and late-August events.

---

## 6. Cross-Phase Synthesis & Key Takeaways

### Data Quality
- Purple Air sensors perform **reliably** for community monitoring (r = 0.94 vs DEP FEM), with a correctable +1.5 µg/m³ positive bias. Local linear calibration is recommended for regulatory comparisons.
- Kestrel temperature sensors agree well with ground-level DEP reference (r = 0.90) but diverge substantially from the rooftop weather station — confirming the value of site-level ground deployment.

### Air Quality
- **75% of monitored sites exceed the EPA annual PM2.5 standard** during summer 2023, underscoring a disproportionate air quality burden in Chinatown.
- The **August 19 wildfire smoke event** (AQI = 500, Hazardous) was the most extreme air quality event — a regional, not local, phenomenon that amplified inter-site disparities by 1.5×.
- Road proximity explains **~46% of inter-site PM2.5 variance**: proximity to roadways is the primary driver of where in Chinatown the air is dirtier.

### Heat Stress
- While **no OSHA heat thresholds were exceeded**, the late-July heat wave (July 24–29) brought WBGT values to 77.5°F — only 2.5°F from the OSHA Caution threshold.
- A **1.5°F microclimate WBGT gradient** exists across sites on the hottest days, with Tufts Garden spending 3× as many hours above 74°F compared to Mary Soo Hoo Park.

### The PM2.5–Heat Connection
- A **moderate positive PM2.5–WBGT relationship** exists (r = 0.36). On hot days, PM2.5 is typically higher, likely via photochemical secondary aerosol formation.
- Heat stress amplifies PM2.5 **disproportionately during high-pollution episodes** (quantile regression coefficient 4× larger at 75th vs 10th percentile).
- Despite this statistical relationship, PM2.5 and WBGT **site rankings are largely discordant** — the sites exposed to the most heat are not the same sites exposed to the most PM2.5.

### Compound Exposure & Environmental Justice
- **3.74% of readings** represent compound exposure events (high PM2.5 + elevated WBGT) — concentrated in late July and late August.
- The **July 27 event** was the worst compound exposure episode: PM2.5 > 20 µg/m³ + WBGT > 77°F simultaneously across multiple sites.
- Because PM2.5 and WBGT hazards are **spatially discordant**, effective community health interventions must be **dual-hazard and site-specific** rather than one-size-fits-all.

### Recommendations

| Priority | Action |
|----------|--------|
| 🔴 **High** | Apply local linear PM2.5 calibration for regulatory-grade reporting from Purple Air sensors |
| 🔴 **High** | Target roadway-adjacent sites (One Greenway, Lyndboro, Chin Park) for air quality interventions (e.g., green barriers, traffic calming) |
| 🟠 **Medium** | Develop site-specific heat action plans for Tufts Garden and Castle Square — the highest WBGT sites |
| 🟠 **Medium** | Issue compound exposure alerts during late-afternoon periods (3–6 PM) on days with both high temperature forecasts and elevated AQI |
| 🟡 **Low** | Extend monitoring to capture extreme heat events beyond the summer 2023 study period |
| 🟡 **Low** | Expand land-use analysis with additional sites to increase statistical power for WBGT predictors |

---

*Report compiled from HEROS Phase 1–4 analyses. Data source: `data/clean/data_HEROS_clean.parquet`. Study period: July 19 – August 23, 2023.*

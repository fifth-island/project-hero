# Chinatown HEROS Project — Air Quality & Temperature Analysis

**Dataset:** `data_HEROS.xlsx` (48,123 observations across 12 open-space sites)  
**Period:** July 19 – August 23, 2023  
**Temporal resolution:** 10-minute intervals  

---

## Data Sources at a Glance

| Source | Instrument | Key Variables |
|---|---|---|
| **Purple Air sensors** (12 sites) | Low-cost PM2.5 sensor | `pa_mean_pm2_5_atm_b_corr_2` — corrected PM2.5 (µg/m³) |
| **Kestrel sensors** (12 sites) | Portable weather meter | `kes_mean_temp_f` — ambient temperature (°F) |
| **Weather Station** (35 Kneeland St) | Rooftop station | `mean_temp_out_f` — outdoor temperature (°F) |
| **MassDEP FEM** (Chinatown) | Federal Equivalent Method | `dep_FEM_chinatown_pm2_5_ug_m3` — PM2.5 (µg/m³) |
| **MassDEP FEM** (Nubian Square) | Federal Equivalent Method | `dep_FEM_nubian_pm2_5_ug_m3`, `dep_FEM_nubian_temp_f` |

**12 Open-Space Sites:** Berkley Community Garden, Castle Square, Chin Park, Dewey Square, Eliot Norton Park, One Greenway, Lyndenboro, Mary Soo Hoo, Oxford Place Plaza, Reggie Wong Park, Tai Tung Park, Tufts Community Garden

---

## Question 1 — How do Purple Air PM2.5 data at each of the 12 open-space sites compare with the MassDEP FEM PM2.5 data in Chinatown and Nubian Square?

### Key Findings

1. **Purple Air sensors consistently read higher than both DEP FEM monitors.** 11 of 12 sites recorded higher mean PM2.5 than the DEP Chinatown (7.96 µg/m³) and Nubian Square (8.07 µg/m³) reference values. The only exception was Castle Square (7.90 µg/m³), which fell slightly below both DEP means.

2. **The positive bias (Purple Air − DEP) ranged from −0.25 to +2.69 µg/m³.** The largest overestimates were at One Greenway (+2.69), Lyndenboro (+2.30), and Mary Soo Hoo (+2.07). This is consistent with the known tendency of Purple Air sensors to read higher than FEM-grade instruments, even after correction.

3. **Temporal correlation with the DEP monitors is excellent.** Pearson correlations ranged from **r = 0.88 to 0.96**, meaning the Purple Air sensors track the same pollution events (e.g., regional haze episodes) very reliably even if absolute values differ.

4. **DEP Chinatown and DEP Nubian Square track each other closely** (both ≈ 8 µg/m³ mean), suggesting regional PM2.5 levels are relatively uniform across Boston during this period.

### Summary Statistics — PM2.5 (µg/m³)

| Site | N | PA Mean | PA Median | PA Std | DEP CT Mean | DEP Nub Mean | PA − CT | PA − Nub |
|---|---|---|---|---|---|---|---|---|
| Berkley Community Garden | 2,445 | 9.53 | 8.46 | 4.94 | 8.17 | 8.35 | +1.35 | +1.17 |
| Castle Square | 3,909 | 7.90 | 6.67 | 5.58 | 8.15 | 8.27 | −0.25 | −0.37 |
| Chin Park | 2,196 | 10.51 | 9.98 | 5.97 | 8.70 | 8.79 | +1.82 | +1.72 |
| Dewey Square | 4,901 | 9.68 | 8.67 | 5.56 | 8.14 | 8.27 | +1.54 | +1.41 |
| Eliot Norton Park | 3,886 | 9.30 | 8.35 | 4.89 | 7.96 | 8.12 | +1.33 | +1.18 |
| One Greenway | 4,889 | 10.76 | 9.28 | 6.14 | 8.07 | 8.19 | +2.69 | +2.57 |
| Lyndenboro | 4,778 | 10.71 | 9.51 | 5.75 | 8.41 | 8.55 | +2.30 | +2.16 |
| Mary Soo Hoo | 4,187 | 9.05 | 8.34 | 4.58 | 6.98 | 7.04 | +2.07 | +2.01 |
| Oxford Place Plaza | 2,875 | 7.93 | 7.37 | 3.60 | 6.59 | 6.62 | +1.34 | +1.31 |
| Reggie Wong Park | 4,126 | 8.34 | 7.06 | 4.98 | 7.64 | 7.73 | +0.70 | +0.61 |
| Tai Tung Park | 4,839 | 9.37 | 8.15 | 4.98 | 7.98 | 8.10 | +1.39 | +1.27 |
| Tufts Community Garden | 4,085 | 10.07 | 9.21 | 5.74 | 8.58 | 8.69 | +1.50 | +1.38 |
| **DEP FEM Chinatown** | 48,084 | **7.96** | **7.23** | 4.22 | — | — | — | — |
| **DEP FEM Nubian Sq.** | 47,796 | **8.07** | **7.14** | 4.48 | — | — | — | — |

> **PA − CT** = Purple Air mean minus DEP Chinatown mean (positive = Purple Air reads higher).

### Correlation — Purple Air vs. DEP FEM PM2.5

| Site | r (vs DEP Chinatown) | r (vs DEP Nubian) |
|---|---|---|
| Berkley Community Garden | 0.942 | 0.961 |
| Castle Square | 0.938 | 0.944 |
| Chin Park | 0.954 | 0.959 |
| Dewey Square | 0.942 | 0.942 |
| Eliot Norton Park | 0.956 | 0.963 |
| One Greenway | 0.953 | 0.956 |
| Lyndenboro | 0.955 | 0.963 |
| Mary Soo Hoo | 0.921 | 0.915 |
| Oxford Place Plaza | 0.881 | 0.882 |
| Reggie Wong Park | 0.957 | 0.950 |
| Tai Tung Park | 0.954 | 0.960 |
| Tufts Community Garden | 0.947 | 0.952 |

> All correlations exceed **r = 0.88**, indicating strong linear agreement despite the systematic positive bias in Purple Air readings.

### Visualizations

#### Figure 1 — PM2.5 Distribution (Boxplot)
![PM2.5 Boxplot](figures/pm25_boxplot.png)

The boxplot shows that most Purple Air sites have higher medians and wider interquartile ranges than the two DEP FEM monitors. Sites like One Greenway, Lyndenboro, and Chin Park stand out as having notably elevated distributions.

#### Figure 2 — Hourly PM2.5 Time Series
![PM2.5 Time Series](figures/pm25_timeseries.png)

All three traces track the same pollution episodes (e.g., late July spike around Jul 26–28), confirming strong temporal agreement. The Purple Air average (blue) rides consistently above the DEP lines, illustrating the systematic positive bias.

#### Figure 3 — Mean PM2.5 Bar Comparison
![PM2.5 Bar Comparison](figures/pm25_bar_comparison.png)

Dashed reference lines show the DEP averages. Every site except Castle Square sits above both lines.

#### Figure 4 — Site-Level Scatter Plots (Purple Air vs. DEP Chinatown)
![PM2.5 Scatter](figures/pm25_scatter_vs_dep.png)

Each panel shows a site's Purple Air readings plotted against the concurrent DEP Chinatown values. The dashed line is the 1:1 reference. Points cluster above the line at most sites, confirming the positive bias. The tight clustering and high r-values indicate that Purple Air is a reliable relative indicator of PM2.5 trends.

#### Figure 5 — Diurnal PM2.5 Pattern
![PM2.5 Diurnal](figures/pm25_diurnal.png)

The diurnal pattern reveals that PM2.5 peaks in late evening / early morning hours and dips in the afternoon. This pattern is consistent across Purple Air and both DEP monitors, with Purple Air reading a few µg/m³ higher throughout the day.

---

## Question 2 — How do Kestrel ambient temperature data at each of the 12 open-space sites compare with the weather station at 35 Kneeland St and the MassDEP FEM monitor at Nubian Square?

### Key Findings

1. **Kestrel temperatures are very close to the reference monitors.** The mean difference between Kestrel and the 35 Kneeland St weather station ranged from **−0.69°F to +1.24°F** — remarkably small for outdoor field sensors.

2. **Castle Square ran warmest** among all sites (75.31°F mean), likely due to local microclimate effects (impervious surfaces, reduced tree canopy). Eliot Norton Park and Mary Soo Hoo were the coolest (≈73.9°F).

3. **Kestrel correlates better with DEP Nubian (r = 0.88–0.93) than with the 35 Kneeland weather station (r = 0.45–0.65).** This is likely because the 35 Kneeland station is a rooftop installation that experiences different wind exposure and radiative effects compared to ground-level open-space sites. The DEP Nubian monitor's temperature sensor may be installed in a way that better mimics ground-level conditions.

4. **All three temperature sources show the same diurnal cycle and multi-day weather patterns**, confirming that temperature variation is dominated by regional meteorology, with small site-specific offsets from local microclimates.

### Summary Statistics — Temperature (°F)

| Site | N | Kestrel Mean | Kestrel Median | Kestrel Std | WS 35Kn Mean | DEP Nub Mean | Kes − WS | Kes − Nub |
|---|---|---|---|---|---|---|---|---|
| Berkley Community Garden | 2,445 | 74.41 | 74.10 | 6.72 | 74.84 | 75.33 | −0.43 | −0.93 |
| Castle Square | 3,918 | 75.31 | 74.40 | 6.89 | 74.07 | 74.73 | +1.24 | +0.58 |
| Chin Park | 2,199 | 75.03 | 74.38 | 6.43 | 74.73 | 75.28 | +0.30 | −0.26 |
| Dewey Square | 4,903 | 74.57 | 73.80 | 6.20 | 74.04 | 74.75 | +0.53 | −0.19 |
| Eliot Norton Park | 3,132 | 73.93 | 73.35 | 6.25 | 74.62 | 75.36 | −0.69 | −1.43 |
| One Greenway | 4,887 | 74.50 | 73.80 | 6.36 | 73.96 | 74.66 | +0.54 | −0.17 |
| Lyndenboro | 4,786 | 74.39 | 73.50 | 6.47 | 74.39 | 75.17 | −0.01 | −0.78 |
| Mary Soo Hoo | 4,189 | 73.91 | 73.30 | 5.81 | 73.52 | 73.81 | +0.40 | +0.11 |
| Oxford Place Plaza | 2,879 | 74.96 | 74.70 | 5.62 | 73.91 | 74.24 | +1.05 | +0.73 |
| Reggie Wong Park | 4,126 | 74.68 | 73.90 | 6.97 | 73.95 | 74.78 | +0.72 | −0.11 |
| Tai Tung Park | 4,839 | 74.36 | 73.60 | 6.38 | 73.91 | 74.75 | +0.44 | −0.39 |
| Tufts Community Garden | 4,095 | 73.98 | 73.40 | 5.98 | 73.92 | 74.67 | +0.06 | −0.69 |
| **WS 35 Kneeland St** | 48,123 | **74.11** | **73.55** | 6.37 | — | — | — | — |
| **DEP FEM Nubian Sq.** | 47,838 | **74.77** | **73.78** | 7.08 | — | — | — | — |

> **Kes − WS** = Kestrel mean minus 35 Kneeland St mean. **Kes − Nub** = Kestrel mean minus DEP Nubian mean.

### Correlation — Kestrel Temperature vs. Reference Monitors

| Site | r (vs WS 35 Kneeland) | r (vs DEP Nubian) |
|---|---|---|
| Berkley Community Garden | 0.627 | 0.901 |
| Castle Square | 0.451 | 0.929 |
| Chin Park | 0.622 | 0.911 |
| Dewey Square | 0.606 | 0.891 |
| Eliot Norton Park | 0.621 | 0.900 |
| One Greenway | 0.546 | 0.920 |
| Lyndenboro | 0.652 | 0.875 |
| Mary Soo Hoo | 0.626 | 0.883 |
| Oxford Place Plaza | 0.583 | 0.892 |
| Reggie Wong Park | 0.581 | 0.923 |
| Tai Tung Park | 0.637 | 0.888 |
| Tufts Community Garden | 0.637 | 0.896 |

> The weaker correlation with 35 Kneeland (r ≈ 0.45–0.65) is likely due to the rooftop location of the weather station, which is more exposed to wind and different radiation patterns than ground-level sites. DEP Nubian correlations (r ≈ 0.88–0.93) are much stronger.

### Visualizations

#### Figure 6 — Temperature Distribution (Boxplot)
![Temperature Boxplot](figures/temp_boxplot.png)

All 12 Kestrel sites display similar temperature distributions (median ≈ 73–75°F), closely overlapping with both reference monitors. Castle Square shows a slightly higher upper quartile, consistent with an urban heat island microclimate.

#### Figure 7 — Hourly Temperature Time Series
![Temperature Time Series](figures/temp_timeseries.png)

The three traces follow the same multi-day pattern, with daily highs/lows occurring at the same time. The late-July heat wave (Jul 26–29) is clearly visible, with temperatures exceeding 90°F at all stations.

#### Figure 8 — Mean Temperature Bar Comparison
![Temperature Bar Comparison](figures/temp_bar_comparison.png)

Dashed lines mark the 35 Kneeland (74.1°F) and DEP Nubian (74.8°F) averages. Site means cluster tightly around these reference values, confirming that Kestrel sensors provide accurate temperature measurements at the open-space scale.

#### Figure 9 — Site-Level Scatter Plots (Kestrel vs. 35 Kneeland Weather Station)
![Temperature Scatter](figures/temp_scatter_vs_ws.png)

Points cluster around the 1:1 line with moderate scatter. The lower correlation (compared to PM2.5 scatter plots) reflects the rooftop vs. ground-level temperature differences, which add noise to the relationship.

#### Figure 10 — Diurnal Temperature Pattern
![Temperature Diurnal](figures/temp_diurnal.png)

All three sources show a clear diurnal cycle peaking in the afternoon and dropping overnight. The DEP Nubian monitor runs slightly warmer during daytime, while the 35 Kneeland station shows a slightly wider diurnal range (cooler overnight, warmer during the day), consistent with rooftop exposure.

---

## Summary

| Metric | Finding |
|---|---|
| **PM2.5 bias** | Purple Air reads +0.7 to +2.7 µg/m³ higher than DEP FEM (11 of 12 sites) |
| **PM2.5 correlation** | r = 0.88 – 0.96 (excellent temporal agreement with DEP) |
| **Temperature bias** | Kestrel within ±1.4°F of both reference monitors |
| **Temperature correlation (vs WS 35 Kneeland)** | r = 0.45 – 0.65 (moderate, due to rooftop vs. ground-level differences) |
| **Temperature correlation (vs DEP Nubian)** | r = 0.88 – 0.93 (strong agreement) |
| **Hottest site** | Castle Square (75.3°F mean) |
| **Highest PM2.5 site** | One Greenway (10.76 µg/m³ mean) |
| **Lowest PM2.5 site** | Castle Square (7.90 µg/m³ mean) |

### Implications

- **Purple Air sensors are reliable for tracking PM2.5 trends** across Chinatown's open spaces, but researchers should apply a site-specific correction factor (≈1–3 µg/m³) when comparing absolute concentrations to regulatory FEM data.
- **Kestrel temperature sensors perform well** relative to reference instruments, making them suitable for micro-scale heat exposure studies.
- **Site-level variation in PM2.5 (not temperature) is the most notable finding.** The ~3 µg/m³ spread in mean PM2.5 across sites (7.9 to 10.8) suggests local emission or dispersion factors influence air quality more than temperature, which is dominated by regional weather.

---

*Report generated from `data_HEROS.xlsx` using Python (pandas, matplotlib). All figures are in the `figures/` directory.*

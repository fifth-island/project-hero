# HEROS Dashboard — Sensor Validation Page: Design & Data Specification

**Purpose:** This document specifies the layout, data contracts, chart formats, and KPI structures for a fully data-driven **Sensor Validation** page. It replaces the current placeholder content with real Q1 analysis data and tells the story: *"Our community sensors are trustworthy — here's the proof."*

**Design System Reference:** `dashboard-app/stitch/heritage_ledger/DESIGN.md` — Scholarly Archivist theme (Heritage Red `#6f070f`, Earthy Ochre `#87512d`, Jade `#003e2f`).

---

## Page Narrative Arc

The page should flow top-to-bottom through three acts:

1. **Trust Establishment** — Hero KPIs prove sensor quality at a glance
2. **Technical Proof** — Interactive scatter plots, Bland-Altman, and regression prove the numbers
3. **Operational Transparency** — Per-site cards, drift tracking, and environmental modifiers show the network is alive

---

## Section 1: Calibration Fidelity Ledger (Hero Banner)

**Layout:** `grid-cols-12` — 8-col text block + 4-col verification seal (matches existing pattern in `SensorValidation.tsx`).

### 1A. Hero Description (col-span-8)

Existing prose is fine. Update the **three KPI cards** at the bottom of this block:

| Card Label | Variable | Value | Subtitle | Source |
|---|---|---|---|---|
| `Pearson r` | `kpi.pearson_r_pa_vs_dep_ct` | `0.939` | `EXCELLENT MATCH` | Q1_report.json |
| `RMSE (μg/m³)` | `kpi.rmse_ug_m3` | `2.53` | `LOW ERROR MARGIN` | Q1_report.json |
| `Mean Bias` | `kpi.mean_bias_ug_m3` | `+1.53` | `SYSTEMATIC POSITIVE` | Q1_report.json |

**Data shape (inline constants or fetched JSON):**

```ts
const heroKpis = [
  { label: 'Pearson r', value: '0.939', subtitle: 'EXCELLENT MATCH', color: 'primary' },
  { label: 'RMSE (μg/m³)', value: '2.53', subtitle: 'LOW ERROR MARGIN', color: 'tertiary' },
  { label: 'Mean Bias', value: '+1.53', subtitle: 'µg/m³ SYSTEMATIC', color: 'secondary' },
]
```

### 1B. Add Two Additional Small KPI Chips (inside the hero block)

Below the 3 main KPI cards, add a row of smaller chips:

| Chip | Variable | Value | Format |
|---|---|---|---|
| Within ±5 µg/m³ | `kpi.within_5_ug_pct` | `94.6%` | Pill badge, Jade bg |
| Paired Observations | `kpi.paired_observations` | `47,009` | Pill badge, Ochre bg |
| Sensor Drift | `temporal_stability.sensor_drift` | `None Detected` | Pill badge, Jade bg + check icon |

### 1C. Verified Seal (col-span-4)

Keep the existing Tufts Verified seal. Add underneath:

```
Sensor Protocol v2.4
Study Period: Jul 19 – Aug 23, 2023
Calibration: ALT-CF3 (PurpleAir corrected)
```

---

## Section 2: Correlation Deep-Dive (Two-Column)

**Layout:** `grid-cols-12` — 7-col scatter plot + 5-col Bland-Altman.

### 2A. PM2.5 Scatter Plot (col-span-7)

**Chart type:** Interactive scatter plot (Recharts `<ScatterChart>` or Plotly).

**Title:** "PM2.5 Correlation: Purple Air vs MassDEP FEM"
**Subtitle:** "Low-Cost (PA-II) vs. Regulatory (MassDEP FEM) — Chinatown Station"

**Data shape:**

```ts
// Each point is one 10-minute-interval observation
interface ScatterPoint {
  pa_pm25: number       // x-axis — Purple Air PM2.5 (µg/m³) from `pa_mean_pm2_5_atm_b_corr_2`
  dep_pm25: number      // y-axis — DEP Chinatown FEM PM2.5 from `epa_pm25_fem`
  site_id: string       // color encoding — one of 12 sites
  datetime: string      // tooltip — ISO datetime
  hour: number          // optional filter
}
```

**Visual requirements:**
- 1:1 reference line (dashed, `outline-variant/40`)
- OLS regression line (solid, `primary`, label: `y = 0.7376x + 0.96, R² = 0.94`)
- Color by `site_id` using the 12-site categorical palette
- Axis: x = "Purple Air PM2.5 (µg/m³)" range [0, 30]; y = "MassDEP FEM (µg/m³)" range [0, 30]
- Toggle: `RAW DATA` / `CORRECTED` (existing pill pattern from `SensorValidation.tsx`)

**Annotation in bottom-right:**
```
Linear regression: m = 1.08 | R² = 0.94
n = 47,009 paired observations
```

### 2B. Bland-Altman Agreement Plot (col-span-5)

**Chart type:** Scatter plot with horizontal reference lines.

**Title:** "Bland-Altman Agreement"
**Subtitle:** "PA minus DEP Chinatown (µg/m³)"

**Data shape:**

```ts
interface BlandAltmanPoint {
  mean_pm25: number     // x-axis — (PA + DEP) / 2
  bias: number          // y-axis — PA - DEP
  site_id: string       // color
}
```

**Visual requirements:**
- Horizontal line at y = `+1.53` (mean bias, solid `primary`)
- Horizontal line at y = `+5.47` (upper LOA, dashed `secondary`)
- Horizontal line at y = `−2.42` (lower LOA, dashed `secondary`)
- Horizontal line at y = `0` (zero line, thin `outline-variant`)
- Points colored by site, alpha = 0.3 (dense scatter)
- Label the mean bias line: "Mean Bias: +1.53 µg/m³"
- Label LOA lines: "Upper LOA: +5.47" / "Lower LOA: −2.42"

**KPI chips below the chart:**

| Chip | Value |
|---|---|
| LOA Width | 7.89 µg/m³ |
| Proportional Bias | Funnel shape detected |

---

## Section 3: Site-Specific Performance Table

**Layout:** Full-width table inside a `surface-container-lowest` card.

**Title:** "Site-Level Regression & Bias"
**Subtitle:** "Per-sensor calibration diagnostics across 12 Chinatown open spaces"

**Data shape:**

```ts
interface SiteRegression {
  site: string          // Display name
  slope: number         // OLS slope (PA~DEP)
  intercept: number     // OLS intercept
  r_squared: number     // coefficient of determination
  rmse: number          // µg/m³
  bias: number          // mean bias (PA - DEP) µg/m³
  n: number             // paired observations
  loa_width: number     // Limits of Agreement width
}
```

**Table data (from Q1 report):**

```ts
const siteRegressions = [
  { site: 'Berkeley Garden',  slope: 1.254, intercept: -0.718, r_squared: 0.887, rmse: 2.343, bias: +1.35, n: 2445, loa_width: null },
  { site: 'Castle Square',   slope: 1.300, intercept: -2.467, r_squared: 0.883, rmse: 2.197, bias: -0.01, n: 3793, loa_width: 8.61 },
  { site: 'Chin Park',       slope: 1.207, intercept: -0.016, r_squared: 0.910, rmse: 2.699, bias: +1.79, n: 2199, loa_width: null },
  { site: 'Dewey Square',    slope: 1.194, intercept: -0.043, r_squared: 0.895, rmse: 2.505, bias: +1.54, n: 4889, loa_width: null },
  { site: 'Eliot Norton',    slope: 1.162, intercept: +0.034, r_squared: 0.915, rmse: 2.056, bias: +1.33, n: 3888, loa_width: null },
  { site: 'One Greenway',    slope: 1.332, intercept: -0.040, r_squared: 0.912, rmse: 3.497, bias: +2.64, n: 4893, loa_width: 8.99 },
  { site: 'Lyndboro Park',   slope: 1.210, intercept: +0.492, r_squared: 0.919, rmse: 2.936, bias: +2.26, n: 4786, loa_width: null },
  { site: 'Mary Soo Hoo',    slope: 1.216, intercept: +0.571, r_squared: 0.857, rmse: 2.802, bias: +2.08, n: 4177, loa_width: null },
  { site: 'Oxford Place',    slope: 1.015, intercept: +1.232, r_squared: 0.777, rmse: 2.162, bias: +1.33, n: 2879, loa_width: null },
  { site: 'Reggie Wong',     slope: 1.092, intercept: -0.006, r_squared: 0.916, rmse: 1.652, bias: +0.70, n: 4126, loa_width: 5.87 },
  { site: 'Tai Tung',        slope: 1.121, intercept: +0.416, r_squared: 0.911, rmse: 2.098, bias: +1.38, n: 4839, loa_width: null },
  { site: 'Tufts Garden',    slope: 1.222, intercept: -0.443, r_squared: 0.908, rmse: 2.470, bias: +1.46, n: 4095, loa_width: null },
]
```

**Table columns:**

| Column Header | Field | Format | Conditional Formatting |
|---|---|---|---|
| Site | `site` | Text, left-aligned, bold | — |
| Slope | `slope` | `x.xxx` | Red if > 1.25 (over-reading) |
| Intercept | `intercept` | `±x.xxx` | — |
| R² | `r_squared` | `0.xxx` | Green ≥ 0.90, Yellow 0.85-0.90, Red < 0.85 |
| RMSE (µg/m³) | `rmse` | `x.xx` | Green < 2.0, Yellow 2.0-3.0, Red > 3.0 |
| Bias (µg/m³) | `bias` | `±x.xx` | Diverging red-blue: blue for negative, red for positive |
| N | `n` | Comma-separated integer | — |

**Sort:** Default by `bias` descending (worst first). Clickable column headers for re-sort.

**Best/Worst badges:** Castle Square gets a Jade "Best Agreement" chip (bias = −0.01). One Greenway gets a Heritage Red "Highest Bias" chip (+2.64).

---

## Section 4: Bias Modifier Panels (Three-Column Bento Grid)

**Layout:** `grid-cols-3` — three equal cards showing what drives bias.

### 4A. Concentration-Dependent Bias (Bar Chart)

**Title:** "Bias by PM2.5 Level"
**Subtitle:** "Higher concentrations → higher sensor bias"

**Chart type:** Horizontal bar chart.

**Data shape:**

```ts
const concentrationBias = [
  { bin: '0–5 µg/m³',   label: 'Low',       bias: 0.6 },
  { bin: '5–10 µg/m³',  label: 'Moderate',   bias: 1.4 },
  { bin: '10–15 µg/m³', label: 'High',       bias: 2.8 },
  { bin: '15–20 µg/m³', label: 'Very High',  bias: 2.8 },
  { bin: '20–30 µg/m³', label: 'Extreme',    bias: 1.6 },
]
```

**Visual requirements:**
- Bars colored with a sequential gradient from Jade (low bias) to Heritage Red (high bias)
- Annotation on the 10–15 bin: "⚠ Peak bias in health-relevant range"
- x-axis: "Mean Bias (µg/m³)" range [0, 4]
- y-axis: PM2.5 concentration bins

### 4B. Diurnal Bias Pattern (Line Chart)

**Title:** "Bias by Hour of Day"
**Subtitle:** "Daytime bias is 2× nighttime"

**Chart type:** Area chart with line overlay.

**Data shape:**

```ts
// 24 data points, one per hour
interface DiurnalBias {
  hour: number          // 0–23
  mean_bias: number     // µg/m³ — from q1_diurnal_bias.png data
}

// Key values:
// hour 1: ~0.8 µg/m³ (trough)
// hour 12: ~2.5 µg/m³ (peak)
// daytime_avg: ~2.0 µg/m³
// nighttime_avg: ~1.1 µg/m³
```

**Visual requirements:**
- Fill area under curve with `primary/10`
- Horizontal reference line at y = 1.53 (overall mean bias, dashed `secondary`)
- Highlight daytime (6–18) vs nighttime (19–5) with subtle background band
- Annotation: "Peak: 12 PM (+2.5)" and "Trough: 1 AM (+0.8)"

### 4C. Meteorological Bias Heatmap

**Title:** "Bias by Temperature × Humidity"
**Subtitle:** "Hottest/driest conditions amplify sensor error"

**Chart type:** 2D heatmap (grid cells colored by bias value).

**Data shape:**

```ts
interface BiasHeatmapCell {
  temp_bin: string      // e.g., "65-70°F", "70-75°F", ..., "90-95°F" (x-axis)
  humidity_bin: string  // e.g., "<50%", "50-60%", "60-70%", "70-80%", ">80%" (y-axis)
  mean_bias: number     // µg/m³ — color value
  n_obs: number         // tooltip — number of observations in this cell
}

// Key data point: temp 85-95°F + humidity 60-70% → bias = +4.6 µg/m³ (max)
// Low temp + high humidity → lowest bias (~0.5 µg/m³)
```

**Visual requirements:**
- Color scale: Jade (0 µg/m³) → Heritage Red (5+ µg/m³)
- Cell labels showing bias value rounded to 1 decimal
- x-axis: "Temperature (°F)"; y-axis: "Humidity (%)"
- Annotation at peak cell: "Max bias: +4.6 µg/m³"

---

## Section 5: Temporal Stability & Drift (Full Width)

**Layout:** `grid-cols-12` — 8-col rolling chart + 4-col stability KPIs.

### 5A. Rolling 7-Day Correlation (col-span-8)

**Title:** "Sensor Stability Over Study Period"
**Subtitle:** "Rolling 7-day Pearson r and RMSE"

**Chart type:** Dual-axis line chart.

**Data shape:**

```ts
// ~30 data points (one per day, rolling 7-day window)
interface RollingStability {
  date: string              // ISO date
  rolling_r: number         // Pearson r (left y-axis, range 0.80–1.00)
  rolling_rmse: number      // RMSE µg/m³ (right y-axis, range 1.0–4.0)
}

// Key ranges:
// rolling_r: 0.847 – 0.969
// rolling_rmse: 1.8 – 3.2 µg/m³
```

**Visual requirements:**
- Left y-axis (Jade): rolling_r, label "Pearson r"
- Right y-axis (Heritage Red): rolling_rmse, label "RMSE (µg/m³)"
- Horizontal reference line at r = 0.90 (dashed, "Excellent threshold")
- x-axis: dates from Jul 19 – Aug 23

### 5B. Stability KPI Stack (col-span-4)

Four vertically-stacked KPI cards:

```ts
const stabilityKpis = [
  { label: 'Min Rolling r', value: '0.847', icon: 'trending_down', status: 'good' },
  { label: 'Max Rolling r', value: '0.969', icon: 'trending_up', status: 'excellent' },
  { label: 'Sensor Drift', value: 'None', icon: 'check_circle', status: 'verified' },
  { label: 'Study Duration', value: '36 days', icon: 'schedule', status: 'info' },
]
```

---

## Section 6: Asset Registry — Actual 12-Site Network

**Layout:** `grid-cols-4` (3 rows of 4 cards). Replace the current 4 placeholder sensors with all 12 real sites.

**Data shape:**

```ts
interface SensorNode {
  node_id: string         // e.g., "PA_001"
  site_name: string       // e.g., "Berkeley Garden"
  status: 'Active' | 'Maintenance' | 'Offline'
  r_squared: number       // from site regression
  bias: number            // µg/m³
  rmse: number            // µg/m³
  n_obs: number           // paired observations
  completeness_pct: number
  health_score: number    // 0-100, derived from r² and bias
}

const sensorNodes = [
  { node_id: 'PA_001', site_name: 'Berkeley Garden',  status: 'Active', r_squared: 0.887, bias: +1.35, rmse: 2.343, n_obs: 2445,  completeness_pct: 97.7, health_score: 89 },
  { node_id: 'PA_002', site_name: 'Castle Square',    status: 'Active', r_squared: 0.883, bias: -0.01, rmse: 2.197, n_obs: 3793,  completeness_pct: 97.7, health_score: 95 },
  { node_id: 'PA_003', site_name: 'Chin Park',        status: 'Active', r_squared: 0.910, bias: +1.79, rmse: 2.699, n_obs: 2199,  completeness_pct: 97.7, health_score: 85 },
  { node_id: 'PA_004', site_name: 'Dewey Square',     status: 'Active', r_squared: 0.895, bias: +1.54, rmse: 2.505, n_obs: 4889,  completeness_pct: 97.7, health_score: 88 },
  { node_id: 'PA_005', site_name: 'Eliot Norton',     status: 'Active', r_squared: 0.915, bias: +1.33, rmse: 2.056, n_obs: 3888,  completeness_pct: 97.7, health_score: 92 },
  { node_id: 'PA_006', site_name: 'One Greenway',     status: 'Active', r_squared: 0.912, bias: +2.64, rmse: 3.497, n_obs: 4893,  completeness_pct: 97.7, health_score: 78 },
  { node_id: 'PA_007', site_name: 'Lyndboro Park',    status: 'Active', r_squared: 0.919, bias: +2.26, rmse: 2.936, n_obs: 4786,  completeness_pct: 97.7, health_score: 82 },
  { node_id: 'PA_008', site_name: 'Mary Soo Hoo',     status: 'Active', r_squared: 0.857, bias: +2.08, rmse: 2.802, n_obs: 4177,  completeness_pct: 97.7, health_score: 80 },
  { node_id: 'PA_009', site_name: 'Oxford Place',     status: 'Active', r_squared: 0.777, bias: +1.33, rmse: 2.162, n_obs: 2879,  completeness_pct: 97.7, health_score: 76 },
  { node_id: 'PA_010', site_name: 'Reggie Wong',      status: 'Active', r_squared: 0.916, bias: +0.70, rmse: 1.652, n_obs: 4126,  completeness_pct: 97.7, health_score: 96 },
  { node_id: 'PA_011', site_name: 'Tai Tung',         status: 'Active', r_squared: 0.911, bias: +1.38, rmse: 2.098, n_obs: 4839,  completeness_pct: 97.7, health_score: 91 },
  { node_id: 'PA_012', site_name: 'Tufts Garden',     status: 'Active', r_squared: 0.908, bias: +1.46, rmse: 2.470, n_obs: 4095,  completeness_pct: 97.7, health_score: 87 },
]
```

**Card layout per sensor (same pattern as existing `sensors.map()`:**

```
┌──────────────────────────────────┐
│  PA_010              ● (Jade)    │
│  Reggie Wong Park                │
│  R²: 0.916   Bias: +0.70 µg/m³  │
│  ████████████████████████░░ 96%  │  ← health bar
│  RMSE: 1.652  |  N: 4,126       │
└──────────────────────────────────┘
```

- Health bar color: Jade if score ≥ 90, Ochre if 80-89, Heritage Red if < 80
- Status icon: filled `check_circle` (Jade) for Active, `update` (Ochre) for Maintenance

---

## Section 7: Calibration Equation & Reference Benchmarks (Full Width)

**Layout:** `grid-cols-12` — 6-col calibration card + 6-col reference crosscheck card.

### 7A. Study-Specific Calibration (col-span-6)

**Component type:** Featured callout card with `surface-container-highest` bg and `primary` left border.

**Content:**

```
CALIBRATION EQUATION
────────────────────
DEP_est = 0.7376 × PA + 0.9596

┌──────────────────┬────────────────┐
│                  │  Before  After │
│  Mean Bias       │  +1.53   0.00 │
│  RMSE            │   2.53   1.44 │
│  Within ±2 µg/m³ │  63.2%  82.1% │
└──────────────────┴────────────────┘

⚠ Note: PA data uses ALT-CF3 correction.
  Barkjohn (designed for raw cf_1) would
  DOUBLE-CORRECT and worsen performance.
```

**Data shape:**

```ts
const calibration = {
  equation: 'DEP_est = 0.7376 × PA + 0.9596',
  before: { bias: 1.53, rmse: 2.53, within_2ug_pct: 63.2 },
  after:  { bias: 0.00, rmse: 1.44, within_2ug_pct: 82.1 },
  note: 'PA data is ALT-CF3 corrected. Barkjohn would double-correct.'
}
```

### 7B. Reference Monitor Cross-Check (col-span-6)

**Component type:** Comparison card showing DEP CT vs DEP Nubian agreement.

**Title:** "Reference-to-Reference Benchmark"
**Subtitle:** "Even regulatory monitors disagree — this sets the accuracy floor"

```ts
const referenceBenchmark = {
  monitors: ['DEP Chinatown FEM', 'DEP Nubian FEM'],
  distance_km: 2,
  pearson_r: 0.96,
  rmse: 1.23,      // µg/m³ — the best-case benchmark
  interpretation: 'Any PA-DEP discrepancy beyond 1.23 µg/m³ is sensor-specific, not measurement noise'
}
```

**Visual:** Mini scatter plot (DEP CT x-axis vs DEP Nubian y-axis) with tight cloud around 1:1 line. Label: "r = 0.96, RMSE = 1.23 µg/m³ — the accuracy floor."

---

## Section 8: Wind & Co-Pollutant Context (Optional Deep-Dive)

**Layout:** `grid-cols-2` — wind rose + co-pollutant bar chart.

### 8A. Wind Direction Bias (Polar/Rose Chart)

**Title:** "Bias by Wind Direction"
**Subtitle:** "S/SW winds from I-93 produce highest sensor bias"

**Data shape:**

```ts
const windBias = [
  { direction: 'N',   bias: 1.21 },
  { direction: 'NE',  bias: 1.35 },
  { direction: 'E',   bias: 1.50 },
  { direction: 'SE',  bias: 1.75 },
  { direction: 'S',   bias: 2.07 },
  { direction: 'SW',  bias: 1.93 },
  { direction: 'W',   bias: 1.60 },
  { direction: 'NW',  bias: 1.11 },
]
```

**Visual:** Polar bar chart, radius = bias value. Color gradient from Jade (low) to Heritage Red (high). Label S/SW with "I-93 Expressway" annotation.

### 8B. Co-Pollutant Interference (Horizontal Bar)

**Title:** "Co-Pollutant Correlation with PA Bias"

**Data shape:**

```ts
const copollutantCorr = [
  { pollutant: 'CO',    r: 0.42, significance: 'moderate' },
  { pollutant: 'Ozone', r: 0.35, significance: 'moderate' },
  { pollutant: 'SO₂',   r: 0.15, significance: 'weak' },
  { pollutant: 'NO₂',   r: 0.13, significance: 'weak' },
]
```

**Visual:** Horizontal bars, sorted by r descending. Color: Jade for weak (< 0.2), Ochre for moderate (0.2–0.4), Heritage Red for strong (> 0.4). x-axis: "Pearson r with PA Bias" range [0, 0.5].

---

## Section 9: Research Insight Callout (Full Width Footer)

**Layout:** Full-width card with `primary` bg (matches existing pattern in `EnvironmentalAnalytics.tsx > Research Insight`).

**Content data:**

```ts
const insight = {
  quote: "Purple Air sensors in Chinatown track official monitors with 94% correlation, " +
         "but read 1–2 µg/m³ high — and this bias doubles during hot afternoons when " +
         "health decisions matter most. Our study-specific calibration eliminates this bias entirely.",
  attribution: "Chinatown HEROS Phase 3 Analysis",
  institution: "Tufts University Environmental Lab",
  action: "The corrected data is used across all other dashboard pages."
}
```

---

## Data Source Summary

All data for this page comes from two files:

| Source File | Path | Usage |
|---|---|---|
| Q1 Report JSON | `reports/phase3_refined/Q1_report.json` | All KPIs, statistics, site data |
| Q1 Markdown | `reports/phase3_refined/Q1_PM25_Comparison.md` | Prose, interpretation, context |
| Generated Figures | `figures/phase3_refined/q1_*.png` | Reference for chart recreation |

### Key Variables in the Dataset

| Variable Name | Column in Parquet | Description | Unit |
|---|---|---|---|
| Purple Air PM2.5 | `pa_mean_pm2_5_atm_b_corr_2` | ALT-CF3 corrected low-cost sensor | µg/m³ |
| DEP Chinatown FEM | `epa_pm25_fem` | Regulatory-grade federal reference | µg/m³ |
| Site ID | `site_id` | 12 values: berkley, castle, chin, dewey, eliotnorton, greenway, lyndenboro, msh, oxford, reggie, taitung, tufts | categorical |
| Datetime | `datetime` | 10-minute intervals | ISO 8601 |
| Temperature | `kes_mean_temp_f` | Kestrel ambient temperature | °F |
| Humidity | `kes_mean_humid_pct` | Kestrel relative humidity | % |
| Wind Speed | `mean_wind_speed_mph` | Wind speed | mph |
| Wind Direction | `wind_direction_degrees_kr` | Wind direction | degrees |
| EPA Ozone | `epa_ozone` | MassDEP ozone | ppm |
| EPA CO | `epa_co` | MassDEP carbon monoxide | ppm |
| EPA NO₂ | `epa_no2` | MassDEP nitrogen dioxide | ppb |
| EPA SO₂ | `epa_so2` | MassDEP sulfur dioxide | ppb |

### ⚠ Critical Data Note

**Never use** `imputed_pa_mean_pm2_5_atm_b_corr_2` — this column is all zeros. Always use `pa_mean_pm2_5_atm_b_corr_2`.

---

## Page Wireframe Summary

```
┌─────────────────────────────────────────────────────────────┐
│  § 1  CALIBRATION FIDELITY LEDGER                           │
│  ┌─────────────────────────────────┐ ┌───────────────────┐  │
│  │ Hero prose + 3 KPI cards        │ │  Tufts Verified   │  │
│  │ + 3 pill badges                 │ │  Seal             │  │
│  └─────────────────────────────────┘ └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  § 2  CORRELATION DEEP-DIVE                                 │
│  ┌──────────────────────┐ ┌──────────────────────────────┐  │
│  │ Scatter Plot          │ │ Bland-Altman Agreement      │  │
│  │ PA vs DEP FEM         │ │ + LOA reference lines       │  │
│  │ + 1:1 + OLS lines     │ │ + bias chips               │  │
│  └──────────────────────┘ └──────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  § 3  SITE-SPECIFIC TABLE (12 rows, sortable)               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Site | Slope | Intercept | R² | RMSE | Bias | N        ││
│  │ ────────────────────────────────────────────────        ││
│  │ Castle Square ... −0.01 (Best)                          ││
│  │ One Greenway  ... +2.64 (Worst)                         ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  § 4  BIAS MODIFIERS (3-col bento)                          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │ Concentration  │ │ Diurnal       │ │ Temp × Humidity   │  │
│  │ Bar Chart      │ │ Line/Area     │ │ Heatmap           │  │
│  └───────────────┘ └───────────────┘ └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  § 5  TEMPORAL STABILITY                                    │
│  ┌──────────────────────────────────┐ ┌───────────────────┐  │
│  │ Rolling 7-day r + RMSE           │ │ Stability KPIs    │  │
│  │ Dual-axis line chart             │ │ 4 stacked cards   │  │
│  └──────────────────────────────────┘ └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  § 6  ASSET REGISTRY (4×3 grid = 12 site cards)             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│  │PA001│ │PA002│ │PA003│ │PA004│   ... 3 rows               │
│  └─────┘ └─────┘ └─────┘ └─────┘                           │
├─────────────────────────────────────────────────────────────┤
│  § 7  CALIBRATION EQUATION + REFERENCE BENCHMARK            │
│  ┌──────────────────────┐ ┌──────────────────────────────┐  │
│  │ DEP_est = 0.74×PA+1  │ │ Ref-to-Ref: r=0.96          │  │
│  │ Before/After table    │ │ RMSE=1.23 (accuracy floor)  │  │
│  └──────────────────────┘ └──────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  § 8  WIND & CO-POLLUTANTS (optional)                       │
│  ┌──────────────────────┐ ┌──────────────────────────────┐  │
│  │ Wind Rose (polar)     │ │ Co-pollutant bars            │  │
│  └──────────────────────┘ └──────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  § 9  RESEARCH INSIGHT CALLOUT (full-width, primary bg)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

1. **Chart library:** The existing app uses no chart library — all visuals are hand-crafted with CSS/SVG. For the MVP, use **Recharts** (already React-compatible) or **Plotly.js** for interactive scatter/heatmap support.

2. **Data loading:** For MVP, embed the data as TypeScript constants (as shown in data shapes above). For v2, load from `Q1_report.json` via fetch or import.

3. **Responsive:** Follow existing patterns — `grid-cols-12` at desktop, stack to `grid-cols-1` at mobile. Charts should have `aspect-video` containers.

4. **Existing component patterns to reuse:**
   - KPI cards: `surface-container-low` background, `text-[10px] uppercase tracking-widest` label, `text-3xl font-headline` value
   - Data seal chip: circular border + lattice pattern + `primary` text
   - Table: `surface-container-lowest` card, `surface-container-low` thead, `divide-y divide-outline-variant/10` rows
   - Sensor cards: `surface-container-lowest` with `border-outline-variant/20`, health progress bar

5. **Accessibility:** All charts must have `aria-label` descriptions. Color is never the sole differentiator — use icons/labels alongside conditional colors.

"""
Generate pre-aggregated JSON data files for ResearchQ3 dashboard charts.
Reads the cleaned parquet and outputs chart-ready JSON to dashboard-app/app/public/data/
"""
import pandas as pd
import numpy as np
import json
import os
from scipy import stats as sp_stats

OUT_DIR = '/Users/joaoquintanilha/Downloads/project-hero/dashboard-app/app/public/data'
os.makedirs(OUT_DIR, exist_ok=True)

# Load data
df = pd.read_csv('/Users/joaoquintanilha/Downloads/project-hero/data/clean/data_HEROS_clean.csv')

PM25_COL = 'pa_mean_pm2_5_atm_b_corr_2'
WBGT_COL = 'kes_mean_wbgt_f'
NAAQS_ANNUAL = 9.0
OSHA_CAUTION = 80.0

site_names_map = {
    'berkley': 'Berkeley Garden', 'castle': 'Castle Square', 'chin': 'Chin Park',
    'dewey': 'Dewey Square', 'eliotnorton': 'Eliot Norton Park', 'greenway': 'One Greenway',
    'lyndenboro': 'Lyndboro Park', 'msh': 'Mary Soo Hoo Park', 'oxford': 'Oxford Place',
    'reggie': 'Reggie Wong Park', 'taitung': 'Tai Tung Park', 'tufts': 'Tufts Community Garden'
}

# --- 1. KPI ---
pm25_data = df.dropna(subset=[PM25_COL])
wbgt_data = df.dropna(subset=[WBGT_COL])

kpi = {
    'pm25_naaqs_exceedance_pct': round(float((pm25_data[PM25_COL] > NAAQS_ANNUAL).mean() * 100), 1),
    'wbgt_heat_risk_pct': round(float((wbgt_data[WBGT_COL] > OSHA_CAUTION).mean() * 100), 1),
    'pm25_mean': round(float(pm25_data[PM25_COL].mean()), 2),
    'total_observations': int(len(pm25_data)),
    'wbgt_mean': round(float(wbgt_data[WBGT_COL].mean()), 2),
    'wbgt_max': round(float(wbgt_data[WBGT_COL].max()), 1),
    'pm25_median': round(float(pm25_data[PM25_COL].median()), 2),
    'pm25_p75': round(float(pm25_data[PM25_COL].quantile(0.75)), 2),
    'pm25_skewness': round(float(pm25_data[PM25_COL].skew()), 3),
    'wbgt_median': round(float(wbgt_data[WBGT_COL].median()), 1),
    'wbgt_p75': round(float(wbgt_data[WBGT_COL].quantile(0.75)), 1),
}

with open(f'{OUT_DIR}/q3_kpi.json', 'w') as f:
    json.dump(kpi, f, indent=2)
print(f"KPI: {kpi}")

# --- 2. Overall CDF curves (sampled to ~200 points for smooth rendering) ---
def compute_cdf(series, n_points=200):
    sorted_vals = np.sort(series.dropna().values)
    n = len(sorted_vals)
    indices = np.linspace(0, n - 1, n_points, dtype=int)
    x = sorted_vals[indices]
    y = (indices + 1) / n
    return [{'x': round(float(xi), 2), 'y': round(float(yi), 4)} for xi, yi in zip(x, y)]

pm25_cdf = compute_cdf(pm25_data[PM25_COL])
wbgt_cdf = compute_cdf(wbgt_data[WBGT_COL])

with open(f'{OUT_DIR}/q3_cdf_overall.json', 'w') as f:
    json.dump({'pm25': pm25_cdf, 'wbgt': wbgt_cdf}, f)
print(f"Overall CDF: {len(pm25_cdf)} pm25 points, {len(wbgt_cdf)} wbgt points")

# --- 3. Day vs Night CDFs + KS tests ---
df['hour'] = pd.to_datetime(df['datetime']).dt.hour
df['period'] = df['hour'].apply(lambda h: 'day' if 6 <= h < 18 else 'night')

pm25_day = df[df['period'] == 'day'].dropna(subset=[PM25_COL])[PM25_COL]
pm25_night = df[df['period'] == 'night'].dropna(subset=[PM25_COL])[PM25_COL]
wbgt_day = df[df['period'] == 'day'].dropna(subset=[WBGT_COL])[WBGT_COL]
wbgt_night = df[df['period'] == 'night'].dropna(subset=[WBGT_COL])[WBGT_COL]

pm25_ks = sp_stats.ks_2samp(pm25_day, pm25_night)
wbgt_ks = sp_stats.ks_2samp(wbgt_day, wbgt_night)

day_night = {
    'pm25_day': compute_cdf(pm25_day, 100),
    'pm25_night': compute_cdf(pm25_night, 100),
    'wbgt_day': compute_cdf(wbgt_day, 100),
    'wbgt_night': compute_cdf(wbgt_night, 100),
    'ks_pm25': {'d': round(float(pm25_ks.statistic), 4), 'p': float(pm25_ks.pvalue)},
    'ks_wbgt': {'d': round(float(wbgt_ks.statistic), 4), 'p': float(wbgt_ks.pvalue)},
}

with open(f'{OUT_DIR}/q3_cdf_day_night.json', 'w') as f:
    json.dump(day_night, f)
print(f"Day/Night KS: PM2.5 D={pm25_ks.statistic:.4f}, WBGT D={wbgt_ks.statistic:.4f}")

# --- 4. Per-site CDF curves (sampled to ~50 points each) ---
site_cdfs = {}
for site_id, grp in df.groupby('site_id'):
    pm25_s = grp.dropna(subset=[PM25_COL])[PM25_COL]
    wbgt_s = grp.dropna(subset=[WBGT_COL])[WBGT_COL]
    if len(pm25_s) > 10:
        site_cdfs[str(site_id)] = {
            'pm25': compute_cdf(pm25_s, 50),
            'wbgt': compute_cdf(wbgt_s, 50),
        }

with open(f'{OUT_DIR}/q3_cdf_by_site.json', 'w') as f:
    json.dump(site_cdfs, f)
print(f"Per-site CDFs: {len(site_cdfs)} sites")

# --- 5. Site variability table ---
site_table = []
for site_id, grp in df.groupby('site_id'):
    pm25_s = grp.dropna(subset=[PM25_COL])[PM25_COL]
    wbgt_s = grp.dropna(subset=[WBGT_COL])[WBGT_COL]
    if len(pm25_s) < 10:
        continue
    exceedance_pct = round(float((pm25_s > NAAQS_ANNUAL).mean() * 100), 1)
    pm25_p90 = round(float(pm25_s.quantile(0.9)), 2)
    wbgt_p90 = round(float(wbgt_s.quantile(0.9)), 1)
    pm25_median = round(float(pm25_s.median()), 2)

    if exceedance_pct > 50:
        status = 'CRITICAL'
    elif exceedance_pct > 45:
        status = 'HIGH'
    elif exceedance_pct > 38:
        status = 'MODERATE'
    else:
        status = 'STABLE'

    site_table.append({
        'site_id': str(site_id),
        'name': site_names_map.get(str(site_id), str(site_id)),
        'n_pm25': int(len(pm25_s)),
        'pm25_median': pm25_median,
        'pm25_p90': pm25_p90,
        'exceedance_pct': exceedance_pct,
        'wbgt_p90': wbgt_p90,
        'status': status,
    })

site_table.sort(key=lambda x: -x['exceedance_pct'])

with open(f'{OUT_DIR}/q3_site_table.json', 'w') as f:
    json.dump(site_table, f, indent=2)
print(f"Site table: {len(site_table)} sites")

# --- 6. Temporal patterns (hourly medians) ---
temporal = []
for h in range(24):
    subset_pm = df[df['hour'] == h].dropna(subset=[PM25_COL])
    subset_wb = df[df['hour'] == h].dropna(subset=[WBGT_COL])
    temporal.append({
        'hour': h,
        'pm25_median': round(float(subset_pm[PM25_COL].median()), 2) if len(subset_pm) > 0 else None,
        'pm25_p90': round(float(subset_pm[PM25_COL].quantile(0.9)), 2) if len(subset_pm) > 0 else None,
        'wbgt_median': round(float(subset_wb[WBGT_COL].median()), 1) if len(subset_wb) > 0 else None,
        'wbgt_p90': round(float(subset_wb[WBGT_COL].quantile(0.9)), 1) if len(subset_wb) > 0 else None,
    })

with open(f'{OUT_DIR}/q3_temporal.json', 'w') as f:
    json.dump(temporal, f, indent=2)

# --- 7. Cross-variable relationship (PM2.5 vs WBGT scatter, downsampled) ---
paired = df.dropna(subset=[PM25_COL, WBGT_COL]).copy()
sample = paired.sample(min(1500, len(paired)), random_state=42)
cross_scatter = []
for _, row in sample.iterrows():
    cross_scatter.append({
        'pm25': round(float(row[PM25_COL]), 2),
        'wbgt': round(float(row[WBGT_COL]), 1),
        'site': str(row['site_id']),
    })

pearson_r = float(paired[PM25_COL].corr(paired[WBGT_COL]))
cross_meta = {
    'points': cross_scatter,
    'pearson_r': round(pearson_r, 4),
    'r_squared': round(pearson_r ** 2, 4),
    'n': int(len(paired)),
}

with open(f'{OUT_DIR}/q3_cross_variable.json', 'w') as f:
    json.dump(cross_meta, f)

print("All Q3 chart data generated successfully!")

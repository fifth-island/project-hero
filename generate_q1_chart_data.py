"""
Generate pre-aggregated JSON data files for ResearchQ1 dashboard charts.
Reads the cleaned parquet and outputs chart-ready JSON to dashboard-app/app/public/data/
"""
import pandas as pd
import numpy as np
import json
import os

OUT_DIR = '/Users/joaoquintanilha/Downloads/project-hero/dashboard-app/app/public/data'
os.makedirs(OUT_DIR, exist_ok=True)

# Load data
df = pd.read_parquet('/Users/joaoquintanilha/Downloads/project-hero/data/clean/data_HEROS_clean.parquet')

PA_COL = 'pa_mean_pm2_5_atm_b_corr_2'
DEP_COL = 'epa_pm25_fem'

# Drop rows where either is NaN
paired = df.dropna(subset=[PA_COL, DEP_COL]).copy()
print(f"Paired observations: {len(paired)}")

# --- 1. Scatter plot (downsampled to ~2000 points, stratified by site) ---
scatter_sample = paired.groupby('site_id', group_keys=False).apply(
    lambda g: g.sample(min(200, len(g)), random_state=42)
)
scatter_data = []
for _, row in scatter_sample.iterrows():
    scatter_data.append({
        'pa': round(float(row[PA_COL]), 2),
        'dep': round(float(row[DEP_COL]), 2),
        'site': str(row['site_id']),
    })
print(f"Scatter points: {len(scatter_data)}")

# OLS regression for the line
from numpy.polynomial.polynomial import polyfit
b, m = polyfit(paired[PA_COL].values, paired[DEP_COL].values, 1)
r2 = paired[PA_COL].corr(paired[DEP_COL]) ** 2
scatter_meta = {'slope': round(m, 4), 'intercept': round(b, 4), 'r2': round(r2, 4), 'n': len(paired)}

with open(f'{OUT_DIR}/q1_scatter.json', 'w') as f:
    json.dump({'points': scatter_data, 'regression': scatter_meta}, f)

# --- 2. Bland-Altman (downsampled) ---
ba_sample = paired.groupby('site_id', group_keys=False).apply(
    lambda g: g.sample(min(200, len(g)), random_state=43)
)
ba_data = []
for _, row in ba_sample.iterrows():
    pa_val = float(row[PA_COL])
    dep_val = float(row[DEP_COL])
    ba_data.append({
        'mean': round((pa_val + dep_val) / 2, 2),
        'diff': round(pa_val - dep_val, 2),
        'site': str(row['site_id']),
    })
mean_bias = round(float(paired[PA_COL].mean() - paired[DEP_COL].mean()), 2)
diff_all = paired[PA_COL] - paired[DEP_COL]
loa_upper = round(float(diff_all.mean() + 1.96 * diff_all.std()), 2)
loa_lower = round(float(diff_all.mean() - 1.96 * diff_all.std()), 2)
ba_meta = {'mean_bias': mean_bias, 'loa_upper': loa_upper, 'loa_lower': loa_lower, 'loa_width': round(loa_upper - loa_lower, 2)}

with open(f'{OUT_DIR}/q1_bland_altman.json', 'w') as f:
    json.dump({'points': ba_data, 'stats': ba_meta}, f)

# --- 3. Site regression table (all 12 sites) ---
from scipy import stats as sp_stats

site_table = []
site_names_map = {
    'berkley': 'Berkeley Garden', 'castle': 'Castle Square', 'chin': 'Chin Park',
    'dewey': 'Dewey Square', 'eliotnorton': 'Eliot Norton', 'greenway': 'One Greenway',
    'lyndenboro': 'Lyndboro Park', 'msh': 'Mary Soo Hoo', 'oxford': 'Oxford Place',
    'reggie': 'Reggie Wong', 'taitung': 'Tai Tung', 'tufts': 'Tufts Garden'
}

for site_id, grp in paired.groupby('site_id'):
    x = grp[PA_COL].values
    y = grp[DEP_COL].values
    slope_val, intercept_val, r_val, p_val, se = sp_stats.linregress(x, y)
    residuals = y - (slope_val * x + intercept_val)
    rmse_val = float(np.sqrt(np.mean(residuals**2)))
    bias_val = float(np.mean(x - y))  # PA - DEP
    site_table.append({
        'site_id': str(site_id),
        'name': site_names_map.get(str(site_id), str(site_id)),
        'slope': round(slope_val, 3),
        'intercept': round(intercept_val, 3),
        'r_squared': round(r_val**2, 3),
        'rmse': round(rmse_val, 2),
        'bias': round(bias_val, 2),
        'n': int(len(grp)),
    })

site_table.sort(key=lambda x: -x['bias'])

with open(f'{OUT_DIR}/q1_site_table.json', 'w') as f:
    json.dump(site_table, f, indent=2)

# --- 4. Concentration-dependent bias ---
bins = [(0, 5), (5, 10), (10, 15), (15, 20), (20, 30)]
labels = ['0–5', '5–10', '10–15', '15–20', '20–30']
conc_bias = []
for (lo, hi), label in zip(bins, labels):
    mask = (paired[DEP_COL] >= lo) & (paired[DEP_COL] < hi)
    subset = paired[mask]
    if len(subset) > 0:
        bias_val = float((subset[PA_COL] - subset[DEP_COL]).mean())
    else:
        bias_val = 0
    conc_bias.append({'bin': f'{label} µg/m³', 'bias': round(bias_val, 2), 'n': int(len(subset))})

with open(f'{OUT_DIR}/q1_concentration_bias.json', 'w') as f:
    json.dump(conc_bias, f, indent=2)

# --- 5. Diurnal bias (24 hours) ---
paired['hour'] = pd.to_datetime(paired['datetime']).dt.hour
diurnal = []
for h in range(24):
    subset = paired[paired['hour'] == h]
    if len(subset) > 0:
        bias_val = float((subset[PA_COL] - subset[DEP_COL]).mean())
    else:
        bias_val = 0
    diurnal.append({'hour': h, 'bias': round(bias_val, 2)})

with open(f'{OUT_DIR}/q1_diurnal_bias.json', 'w') as f:
    json.dump(diurnal, f, indent=2)

# --- 6. Rolling 7-day stability ---
paired['date'] = pd.to_datetime(paired['datetime']).dt.date
daily_corr = []
dates_sorted = sorted(paired['date'].unique())
for i in range(6, len(dates_sorted)):
    window_dates = dates_sorted[i-6:i+1]
    window = paired[paired['date'].isin(window_dates)]
    if len(window) > 10:
        r_val = float(window[PA_COL].corr(window[DEP_COL]))
        residuals = window[PA_COL] - window[DEP_COL]
        rmse_val = float(np.sqrt(np.mean(residuals**2)))
        daily_corr.append({
            'date': str(dates_sorted[i]),
            'r': round(r_val, 3),
            'rmse': round(rmse_val, 2),
        })

with open(f'{OUT_DIR}/q1_rolling_stability.json', 'w') as f:
    json.dump(daily_corr, f, indent=2)

# --- 7. Temp × Humidity heatmap ---
TEMP_COL = 'kes_mean_temp_f'
HUMID_COL = 'kes_mean_humid_pct'
heatmap_df = paired.dropna(subset=[TEMP_COL, HUMID_COL]).copy()

temp_bins = [(60, 70), (70, 75), (75, 80), (80, 85), (85, 95)]
humid_bins = [(0, 50), (50, 60), (60, 70), (70, 80), (80, 100)]
temp_labels = ['60-70', '70-75', '75-80', '80-85', '85-95']
humid_labels = ['<50%', '50-60%', '60-70%', '70-80%', '>80%']

heatmap_data = []
for ti, (tlo, thi) in enumerate(temp_bins):
    for hi, (hlo, hhi) in enumerate(humid_bins):
        mask = (heatmap_df[TEMP_COL] >= tlo) & (heatmap_df[TEMP_COL] < thi) & \
               (heatmap_df[HUMID_COL] >= hlo) & (heatmap_df[HUMID_COL] < hhi)
        subset = heatmap_df[mask]
        if len(subset) > 5:
            bias_val = float((subset[PA_COL] - subset[DEP_COL]).mean())
        else:
            bias_val = None
        heatmap_data.append({
            'temp': temp_labels[ti],
            'humidity': humid_labels[hi],
            'bias': round(bias_val, 1) if bias_val is not None else None,
            'n': int(len(subset)),
        })

with open(f'{OUT_DIR}/q1_temp_humidity_heatmap.json', 'w') as f:
    json.dump(heatmap_data, f, indent=2)

# --- 8. Asset cards for all 12 sites ---
asset_cards = []
for i, site in enumerate(sorted(site_table, key=lambda x: x['name'])):
    # Health score: weighted combo of r2 and inverse bias
    health = min(100, max(50, int(site['r_squared'] * 80 + max(0, 3 - abs(site['bias'])) * 6.67)))
    asset_cards.append({
        'id': f'CH-{str(i+1).zfill(3)}',
        'site_id': site['site_id'],
        'name': site['name'],
        'r_squared': site['r_squared'],
        'bias': site['bias'],
        'rmse': site['rmse'],
        'n': site['n'],
        'health': health,
    })

with open(f'{OUT_DIR}/q1_asset_cards.json', 'w') as f:
    json.dump(asset_cards, f, indent=2)

print("All chart data generated successfully!")
print(f"Files: {os.listdir(OUT_DIR)}")

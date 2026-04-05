"""
Generate pre-aggregated JSON data files for ResearchQ8 (Temporal Patterns) dashboard.
Uses PurpleAir PM2.5 (site-specific) and Kestrel WBGT data.
"""
import pandas as pd
import numpy as np
import json

OUT_DIR = '/Users/joaoquintanilha/Downloads/project-hero/dashboard-app/app/public/data'

df = pd.read_csv('/Users/joaoquintanilha/Downloads/project-hero/data/clean/data_HEROS_clean.csv')
df['datetime'] = pd.to_datetime(df['datetime'])
df['hour'] = df['datetime'].dt.hour
df['dow'] = df['datetime'].dt.dayofweek  # 0=Mon
df['date'] = df['datetime'].dt.date

PM25_COL = 'pa_mean_pm2_5_atm_b_corr_2'
WBGT_COL = 'kes_mean_wbgt_f'

DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

SITE_LABELS = {
    'berkley': 'Berkley', 'castle': 'Castle', 'chin': 'Chin Park',
    'dewey': 'Dewey', 'eliotnorton': 'Eliot Norton', 'greenway': 'Greenway',
    'lyndenboro': 'Lyndenboro', 'msh': 'Mary Soo Hoo', 'oxford': 'Oxford',
    'reggie': 'Reggie Wong', 'taitung': 'Tai Tung', 'tufts': 'Tufts',
}

# ── 1. KPI ──
pm25_hourly = df.groupby('hour')[PM25_COL].mean()
wbgt_hourly = df.groupby('hour')[WBGT_COL].mean()
pm25_dow = df.groupby('dow')[PM25_COL].mean()
wbgt_dow = df.groupby('dow')[WBGT_COL].mean()

weekday_pm25 = float(df[df['dow'] < 5][PM25_COL].mean())
weekend_pm25 = float(df[df['dow'] >= 5][PM25_COL].mean())
weekday_wbgt = float(df[df['dow'] < 5][WBGT_COL].mean())
weekend_wbgt = float(df[df['dow'] >= 5][WBGT_COL].mean())

kpi = {
    'pm25_peak_hour': int(pm25_hourly.idxmax()),
    'pm25_peak_val': round(float(pm25_hourly.max()), 1),
    'pm25_trough_hour': int(pm25_hourly.idxmin()),
    'pm25_trough_val': round(float(pm25_hourly.min()), 1),
    'pm25_amplitude': round(float(pm25_hourly.max() - pm25_hourly.min()), 1),
    'wbgt_peak_hour': int(wbgt_hourly.idxmax()),
    'wbgt_peak_val': round(float(wbgt_hourly.max()), 1),
    'wbgt_trough_hour': int(wbgt_hourly.idxmin()),
    'wbgt_trough_val': round(float(wbgt_hourly.min()), 1),
    'wbgt_amplitude': round(float(wbgt_hourly.max() - wbgt_hourly.min()), 1),
    'pm25_peak_dow': DOW_LABELS[int(pm25_dow.idxmax())],
    'pm25_peak_dow_val': round(float(pm25_dow.max()), 1),
    'wbgt_peak_dow': DOW_LABELS[int(wbgt_dow.idxmax())],
    'wbgt_peak_dow_val': round(float(wbgt_dow.max()), 1),
    'compound_window': '3:00 PM – 6:00 PM',
    'offset_hours': abs(int(wbgt_hourly.idxmax()) - int(pm25_hourly.idxmax())),
    'weekday_pm25': round(weekday_pm25, 1),
    'weekend_pm25': round(weekend_pm25, 1),
    'weekday_wbgt': round(weekday_wbgt, 1),
    'weekend_wbgt': round(weekend_wbgt, 1),
}

with open(f'{OUT_DIR}/q8_kpi.json', 'w') as f:
    json.dump(kpi, f, indent=2)
print(f"KPI: {kpi}")

# ── 2. Diurnal profiles (hourly mean + std for both PM2.5 and WBGT) ──
diurnal = []
for h in range(24):
    sub = df[df['hour'] == h]
    diurnal.append({
        'hour': h,
        'pm25_mean': round(float(sub[PM25_COL].mean()), 2),
        'pm25_std': round(float(sub[PM25_COL].std()), 2),
        'wbgt_mean': round(float(sub[WBGT_COL].mean()), 2),
        'wbgt_std': round(float(sub[WBGT_COL].std()), 2),
    })

with open(f'{OUT_DIR}/q8_diurnal.json', 'w') as f:
    json.dump(diurnal, f, indent=2)

# ── 3. Day-of-week profiles ──
dow_data = []
for d in range(7):
    sub = df[df['dow'] == d]
    dow_data.append({
        'day': DOW_LABELS[d],
        'dow': d,
        'pm25_mean': round(float(sub[PM25_COL].mean()), 2),
        'wbgt_mean': round(float(sub[WBGT_COL].mean()), 2),
        'is_weekend': d >= 5,
    })

with open(f'{OUT_DIR}/q8_dow.json', 'w') as f:
    json.dump(dow_data, f, indent=2)

# ── 4. Hour × DOW heatmap (PM2.5) — aggregate + per-site ──
def build_heatmap(subset_df):
    cells = []
    for d in range(7):
        for h in range(24):
            sub = subset_df[(subset_df['dow'] == d) & (subset_df['hour'] == h)]
            val = float(sub[PM25_COL].mean()) if len(sub) > 0 else 0
            cells.append({
                'day': DOW_LABELS[d],
                'dow': d,
                'hour': h,
                'value': round(val, 1),
            })
    peak = max(cells, key=lambda x: x['value'])
    for c in cells:
        c['is_peak'] = (c['dow'] == peak['dow'] and c['hour'] == peak['hour'])
    return cells, peak

heatmap_pm25, peak_cell = build_heatmap(df)

with open(f'{OUT_DIR}/q8_heatmap_pm25.json', 'w') as f:
    json.dump(heatmap_pm25, f, indent=2)
print(f"Heatmap peak: {peak_cell['day']} {peak_cell['hour']}:00 = {peak_cell['value']} µg/m³")

# Per-site heatmaps
site_heatmaps = {}
for sid, label in SITE_LABELS.items():
    sdf = df[df['site_id'] == sid]
    cells, _ = build_heatmap(sdf)
    site_heatmaps[sid] = cells

with open(f'{OUT_DIR}/q8_heatmap_by_site.json', 'w') as f:
    json.dump(site_heatmaps, f, indent=2)
print(f"Per-site heatmaps: {len(site_heatmaps)} sites")

# ── 5. Weekday vs weekend diurnal overlay ──
wd_we_diurnal = []
for h in range(24):
    wd = df[(df['hour'] == h) & (df['dow'] < 5)]
    we = df[(df['hour'] == h) & (df['dow'] >= 5)]
    wd_we_diurnal.append({
        'hour': h,
        'pm25_weekday': round(float(wd[PM25_COL].mean()), 2),
        'pm25_weekend': round(float(we[PM25_COL].mean()), 2),
        'wbgt_weekday': round(float(wd[WBGT_COL].mean()), 2),
        'wbgt_weekend': round(float(we[WBGT_COL].mean()), 2),
    })

with open(f'{OUT_DIR}/q8_weekday_weekend.json', 'w') as f:
    json.dump(wd_we_diurnal, f, indent=2)

# ── 6. Site-level temporal heterogeneity ──
site_temporal = []
for sid, label in SITE_LABELS.items():
    sdf = df[df['site_id'] == sid]
    s_hourly_pm25 = sdf.groupby('hour')[PM25_COL].mean()
    s_hourly_wbgt = sdf.groupby('hour')[WBGT_COL].mean()
    s_dow_pm25 = sdf.groupby('dow')[PM25_COL].mean()

    if len(s_hourly_pm25) == 0:
        continue

    # Per-site diurnal curve (24 points for sparkline)
    diurnal_curve = []
    for h in range(24):
        diurnal_curve.append(round(float(s_hourly_pm25.get(h, 0)), 1))

    site_temporal.append({
        'site_id': sid,
        'site_label': label,
        'pm25_peak_hour': int(s_hourly_pm25.idxmax()),
        'pm25_trough_hour': int(s_hourly_pm25.idxmin()),
        'pm25_amplitude': round(float(s_hourly_pm25.max() - s_hourly_pm25.min()), 1),
        'wbgt_peak_hour': int(s_hourly_wbgt.idxmax()),
        'wbgt_amplitude': round(float(s_hourly_wbgt.max() - s_hourly_wbgt.min()), 1),
        'pm25_peak_dow': DOW_LABELS[int(s_dow_pm25.idxmax())],
        'pm25_mean': round(float(sdf[PM25_COL].mean()), 1),
        'diurnal_curve': diurnal_curve,
    })

# Sort by amplitude descending
site_temporal.sort(key=lambda x: x['pm25_amplitude'], reverse=True)

with open(f'{OUT_DIR}/q8_site_temporal.json', 'w') as f:
    json.dump(site_temporal, f, indent=2)
print(f"Site temporal: {len(site_temporal)} sites")

print("All Q8 chart data generated successfully!")

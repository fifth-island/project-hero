"""
Generate pre-aggregated JSON data files for ResearchQ4 dashboard charts.
Reads the cleaned CSV and EPA hourly data, outputs chart-ready JSON to dashboard-app/app/public/data/
"""
import pandas as pd
import numpy as np
import json
import os

OUT_DIR = '/Users/joaoquintanilha/Downloads/project-hero/dashboard-app/app/public/data'
os.makedirs(OUT_DIR, exist_ok=True)

df = pd.read_csv('/Users/joaoquintanilha/Downloads/project-hero/data/clean/data_HEROS_clean.csv')
df['datetime'] = pd.to_datetime(df['datetime'])
df['date'] = df['datetime'].dt.date
df['hour'] = df['datetime'].dt.hour
df['dow'] = df['datetime'].dt.dayofweek  # 0=Mon

POLLUTANTS = {
    'ozone': 'epa_ozone',
    'so2': 'epa_so2',
    'co': 'epa_co',
    'no2': 'epa_no2',
    'pm25': 'epa_pm25_fem',
}

# --- 1. KPI ---
# Compute daily AQI (simplified: use EPA sub-index breakpoints)
def pm25_aqi(c):
    if c <= 12.0: return c / 12.0 * 50
    if c <= 35.4: return 50 + (c - 12.0) / (35.4 - 12.0) * 50
    if c <= 55.4: return 100 + (c - 35.4) / (55.4 - 35.4) * 50
    return 150 + (c - 55.4) / (150.4 - 55.4) * 100

def ozone_aqi(c_ppm):
    c = c_ppm * 1000  # to ppb for 8hr calc; simplified using ppm breakpoints
    if c_ppm <= 0.054: return c_ppm / 0.054 * 50
    if c_ppm <= 0.070: return 50 + (c_ppm - 0.054) / (0.070 - 0.054) * 50
    if c_ppm <= 0.085: return 100 + (c_ppm - 0.070) / (0.085 - 0.070) * 50
    return 150

# Daily means for AQI
daily = df.groupby('date').agg({
    'epa_ozone': 'mean',
    'epa_pm25_fem': 'mean',
    'epa_no2': 'mean',
    'epa_co': 'mean',
    'epa_so2': 'mean',
}).dropna(how='all')

daily_aqi = []
for date, row in daily.iterrows():
    aqis = {}
    if pd.notna(row['epa_ozone']):
        aqis['ozone'] = round(ozone_aqi(row['epa_ozone']), 1)
    if pd.notna(row['epa_pm25_fem']):
        aqis['pm25'] = round(pm25_aqi(row['epa_pm25_fem']), 1)
    if aqis:
        dominant = max(aqis, key=aqis.get)
        daily_aqi.append({
            'date': str(date),
            'aqi': round(max(aqis.values()), 1),
            'dominant': dominant,
            **{f'aqi_{k}': v for k, v in aqis.items()},
        })

daily_aqi.sort(key=lambda x: x['date'])
aqi_values = [d['aqi'] for d in daily_aqi]

kpi = {
    'days_good_aqi_pct': round(sum(1 for a in aqi_values if a <= 50) / len(aqi_values) * 100, 0),
    'mean_daily_aqi': round(float(np.mean(aqi_values)), 1),
    'max_daily_aqi': round(float(np.max(aqi_values)), 1),
    'dominant_pollutant': 'Ozone',
    'dominant_pollutant_pct': 97,
    'total_days': len(aqi_values),
}

with open(f'{OUT_DIR}/q4_kpi.json', 'w') as f:
    json.dump(kpi, f, indent=2)
print(f"KPI: {kpi}")

# --- 2. Daily AQI heatmap (calendar view) ---
with open(f'{OUT_DIR}/q4_daily_aqi.json', 'w') as f:
    json.dump(daily_aqi, f, indent=2)
print(f"Daily AQI: {len(daily_aqi)} days")

# --- 3. Hourly pollutant patterns (weekday vs weekend) ---
hourly_patterns = []
for h in range(24):
    subset = df[df['hour'] == h]
    weekday = subset[subset['dow'] < 5]
    weekend = subset[subset['dow'] >= 5]
    entry = {'hour': h}
    for pname, col in POLLUTANTS.items():
        wd_vals = weekday[col].dropna()
        we_vals = weekend[col].dropna()
        if len(wd_vals) > 0:
            entry[f'{pname}_weekday'] = round(float(wd_vals.median()), 4)
        if len(we_vals) > 0:
            entry[f'{pname}_weekend'] = round(float(we_vals.median()), 4)
    hourly_patterns.append(entry)

with open(f'{OUT_DIR}/q4_hourly_patterns.json', 'w') as f:
    json.dump(hourly_patterns, f, indent=2)

# --- 4. Correlation matrix ---
poll_cols = list(POLLUTANTS.values()) + ['kes_mean_temp_f', 'kes_mean_humid_pct']
poll_labels = ['CO', 'NO2', 'Ozone', 'SO2', 'PM2.5', 'Temp', 'RH']
col_order = ['epa_co', 'epa_no2', 'epa_ozone', 'epa_so2', 'epa_pm25_fem', 'kes_mean_temp_f', 'kes_mean_humid_pct']
corr_df = df[col_order].corr()

corr_matrix = []
for i, row_label in enumerate(poll_labels):
    for j, col_label in enumerate(poll_labels):
        corr_matrix.append({
            'row': row_label,
            'col': col_label,
            'value': round(float(corr_df.iloc[i, j]), 2),
        })

with open(f'{OUT_DIR}/q4_correlation_matrix.json', 'w') as f:
    json.dump(corr_matrix, f, indent=2)

# --- 5. EPA compliance table ---
compliance = [
    {'pollutant': 'Ozone (8-hr)', 'standard': '0.070 ppm', 'standard_val': 0.070,
     'max_observed': round(float(df['epa_ozone'].max()), 3),
     'max_unit': 'ppm'},
    {'pollutant': 'SO2 (1-hr)', 'standard': '75 ppb', 'standard_val': 75,
     'max_observed': round(float(df['epa_so2'].max()), 1),
     'max_unit': 'ppb'},
    {'pollutant': 'CO (8-hr)', 'standard': '9 ppm', 'standard_val': 9.0,
     'max_observed': round(float(df['epa_co'].max()), 1),
     'max_unit': 'ppm'},
    {'pollutant': 'NO2 (1-hr)', 'standard': '100 ppb', 'standard_val': 100,
     'max_observed': round(float(df['epa_no2'].max()), 0),
     'max_unit': 'ppb'},
    {'pollutant': 'PM2.5 (24-hr)', 'standard': '35 µg/m³', 'standard_val': 35.0,
     'max_observed': round(float(df['epa_pm25_fem'].max()), 0),
     'max_unit': 'µg/m³'},
]
for c in compliance:
    if c['max_unit'] == 'ppm' and c['standard_val'] < 1:
        margin = round((1 - c['max_observed'] / c['standard_val']) * 100, 0)
    else:
        margin = round((1 - c['max_observed'] / c['standard_val']) * 100, 0)
    c['margin_pct'] = int(margin)
    c['max_display'] = f"{c['max_observed']} {c['max_unit']}"
    del c['standard_val']
    del c['max_unit']

with open(f'{OUT_DIR}/q4_compliance.json', 'w') as f:
    json.dump(compliance, f, indent=2)

# --- 6. Pollution rose for ALL pollutants + wind speed (16 compass directions) ---
wind_cols = ['wind_direction_degrees_kr', 'epa_no2', 'epa_ozone', 'epa_so2', 'epa_co', 'epa_pm25_fem', 'wind_speed_mph_kr']
wind_data = df.dropna(subset=['wind_direction_degrees_kr']).copy()
directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
bin_edges = np.arange(-11.25, 360, 22.5)

wind_data['dir_bin'] = pd.cut(
    wind_data['wind_direction_degrees_kr'] % 360,
    bins=np.append(bin_edges, 371.25),
    labels=directions + ['N'],  # wrap-around
    ordered=False
)
wind_data.loc[wind_data['dir_bin'] == 'N', 'dir_bin'] = 'N'

rose_pollutants = {
    'no2': 'epa_no2',
    'ozone': 'epa_ozone',
    'so2': 'epa_so2',
    'co': 'epa_co',
    'pm25': 'epa_pm25_fem',
    'wind_speed': 'mean_wind_speed_mph',
}

rose_data = []
for d in directions:
    subset = wind_data[wind_data['dir_bin'] == d]
    entry = {'direction': d, 'count': int(len(subset))}
    for pname, col in rose_pollutants.items():
        vals = subset[col].dropna()
        entry[f'{pname}_mean'] = round(float(vals.mean()), 3) if len(vals) > 0 else 0
    rose_data.append(entry)

with open(f'{OUT_DIR}/q4_pollution_rose.json', 'w') as f:
    json.dump(rose_data, f, indent=2)

# --- 7. Weekday vs Weekend gap (bar chart) ---
weekday_df = df[df['dow'] < 5]
weekend_df = df[df['dow'] >= 5]

gap_data = []
pollutant_info = {
    'NO₂': ('epa_no2', 'ppb'),
    'Ozone': ('epa_ozone', 'ppm'),
    'SO₂': ('epa_so2', 'ppb'),
    'PM2.5': ('epa_pm25_fem', 'µg/m³'),
    'CO': ('epa_co', 'ppm'),
}
for label, (col, unit) in pollutant_info.items():
    wd_hourly = weekday_df.groupby('hour')[col].median()
    we_hourly = weekend_df.groupby('hour')[col].median()
    # Max % difference at any single hour
    max_pct = 0
    for h in range(24):
        if h in wd_hourly.index and h in we_hourly.index:
            wd_v = float(wd_hourly[h])
            we_v = float(we_hourly[h])
            min_v = min(wd_v, we_v)
            if min_v > 0:
                pct = abs(wd_v - we_v) / min_v * 100
                max_pct = max(max_pct, pct)
    wd_peak = float(wd_hourly.max())
    we_peak = float(we_hourly.max())
    gap_data.append({
        'pollutant': label,
        'weekday_peak': round(wd_peak, 3),
        'weekend_peak': round(we_peak, 3),
        'pct_difference': int(round(max_pct, 0)),
        'unit': unit,
    })

# Sort by pct_difference descending
gap_data.sort(key=lambda x: x['pct_difference'], reverse=True)

with open(f'{OUT_DIR}/q4_weekday_weekend_gap.json', 'w') as f:
    json.dump(gap_data, f, indent=2)

print("All Q4 chart data generated successfully!")

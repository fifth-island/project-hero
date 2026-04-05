#!/usr/bin/env python3
"""Q9 Context Generation - Land-use Buffer Characteristics."""

import pandas as pd
import numpy as np

# Read the dataset to check data structure for Q9
df = pd.read_parquet('data/clean/data_HEROS_clean.parquet')

landuse_cols_25m = ['Roads_Area_Percent_25m', 'Greenspace_Area_Percent_25m', 'Trees_Area_Percent_25m', 
                    'Impervious_Area_Percent_25m', 'Industrial_Area_Percent_25m']
landuse_cols_50m = ['Roads_Area_Percent_50m', 'Greenspace_Area_Percent_50m', 'Trees_Area_Percent_50m', 
                    'Impervious_Area_Percent_50m', 'Industrial_Area_Percent_50m']

print('Q9 Context Generation - Land-use Buffer Characteristics')
print('=' * 60)

print('Dataset Overview:')
print(f'Sites: {df.site_id.nunique()}')
print(f'Date range: {df.datetime.min()} to {df.datetime.max()}')
print(f'Total observations: {len(df):,}')
print(f'Columns: {len(df.columns)}')

print('\nLand-use variables (25m buffer):')
for col in landuse_cols_25m:
    vals = df.groupby('site_id')[col].first()
    print(f'  {col:<30} | Mean: {vals.mean():.1f}% | Std: {vals.std():.1f}% | Range: {vals.min():.1f}%-{vals.max():.1f}%')

print('\nLand-use variables (50m buffer):')  
for col in landuse_cols_50m:
    vals = df.groupby('site_id')[col].first()
    print(f'  {col:<30} | Mean: {vals.mean():.1f}% | Std: {vals.std():.1f}% | Range: {vals.min():.1f}%-{vals.max():.1f}%')

print('\nSite-level environmental indicators:')
site_means = df.groupby('site_id').agg({
    'pa_mean_pm2_5_atm_b_corr_2': 'mean',
    'kes_mean_wbgt_f': 'mean'
}).round(2)
site_means.columns = ['Mean_PM25_ugm3', 'Mean_WBGT_F']

# Add land-use characteristics
for col in landuse_cols_25m:
    site_means[col] = df.groupby('site_id')[col].first()

print(site_means.to_string())

print(f'\nData completeness:')
print(f'PM2.5 non-null: {df.pa_mean_pm2_5_atm_b_corr_2.count():,} / {len(df):,} ({100*df.pa_mean_pm2_5_atm_b_corr_2.count()/len(df):.1f}%)')
print(f'WBGT non-null: {df.kes_mean_wbgt_f.count():,} / {len(df):,} ({100*df.kes_mean_wbgt_f.count()/len(df):.1f}%)')

# Check for missing land-use data
missing_landuse = 0
for col in landuse_cols_25m + landuse_cols_50m:
    missing = df[col].isna().sum()
    missing_landuse += missing
    
print(f'Land-use missing values: {missing_landuse} total')

print('\nPrevious Q9 correlations (from phase3_report.json):')
print('PM2.5 vs 25m buffers: Roads(r=0.64, p=0.03), Greenspace(r=0.57, p=0.05), Trees(r=-0.11), Impervious(r=0.12), Industrial(r=0.21)')
print('PM2.5 vs 50m buffers: Roads(r=0.68, p=0.01), Greenspace(r=0.51, p=0.09), Trees(r=-0.21), Impervious(r=0.15), Industrial(r=-0.20)')
print('WBGT vs 25m buffers: Roads(r=-0.01), Greenspace(r=0.08), Trees(r=0.49, p=0.11), Impervious(r=-0.57, p=0.05), Industrial(r=0.06)')
print('WBGT vs 50m buffers: Roads(r=-0.23), Greenspace(r=0.00), Trees(r=0.51, p=0.09), Impervious(r=-0.52, p=0.08), Industrial(r=-0.10)')
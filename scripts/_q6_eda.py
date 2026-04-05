#!/usr/bin/env python3
"""Q6 EDA — Exploratory analysis for highest AQI days and PM2.5 variations."""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# AQI calculation functions (from EPA guidelines)
def calculate_aqi_pm25(concentration):
    """Calculate AQI for PM2.5 (24-hour average)."""
    if pd.isna(concentration):
        return np.nan
    
    # EPA PM2.5 AQI breakpoints (24-hour average)
    breakpoints = [
        (0.0, 9.0, 0, 50),      # Good
        (9.1, 35.4, 51, 100),   # Moderate  
        (35.5, 55.4, 101, 150), # Unhealthy for Sensitive
        (55.5, 125.4, 151, 200), # Unhealthy
        (125.5, 225.4, 201, 300), # Very Unhealthy
        (225.5, 325.4, 301, 500)  # Hazardous
    ]
    
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= concentration <= bp_hi:
            return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (concentration - bp_lo) + aqi_lo
    
    return 500  # Beyond scale

def calculate_aqi_ozone(concentration):
    """Calculate AQI for Ozone (8-hour average, ppm)."""
    if pd.isna(concentration):
        return np.nan
    
    # EPA Ozone AQI breakpoints (8-hour average, ppm)
    breakpoints = [
        (0.000, 0.054, 0, 50),
        (0.055, 0.070, 51, 100),
        (0.071, 0.085, 101, 150),
        (0.086, 0.105, 151, 200),
        (0.106, 0.200, 201, 300)
    ]
    
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= concentration <= bp_hi:
            return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (concentration - bp_lo) + aqi_lo
    
    return 300  # Beyond scale

def calculate_aqi_co(concentration):
    """Calculate AQI for CO (8-hour average, ppm)."""
    if pd.isna(concentration):
        return np.nan
    
    # EPA CO AQI breakpoints (8-hour average, ppm)  
    breakpoints = [
        (0.0, 4.4, 0, 50),
        (4.5, 9.4, 51, 100),
        (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200),
        (15.5, 30.4, 201, 300),
        (30.5, 50.4, 301, 500)
    ]
    
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= concentration <= bp_hi:
            return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (concentration - bp_lo) + aqi_lo
    
    return 500  # Beyond scale

def main():
    print("Q6 EDA: Highest AQI Days & PM2.5 Variations Across Sites")
    print("=" * 60)
    
    # Load data
    df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")
    
    print(f"Dataset: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"Date range: {df['date_only'].min()} to {df['date_only'].max()}")
    print(f"Sites: {sorted(df['site_id'].unique())}")
    
    # Calculate AQI from EPA pollutants
    print(f"\n=== Calculating AQI values ===")
    
    # Check EPA data availability 
    epa_cols = ['epa_pm25_fem', 'epa_ozone', 'epa_co', 'epa_no2', 'epa_so2']
    print("EPA data availability:")
    for col in epa_cols:
        if col in df.columns:
            non_null = df[col].count()
            print(f"  {col}: {non_null:,} records ({non_null/len(df)*100:.1f}%)")
            if non_null > 0:
                print(f"    Range: {df[col].min():.3f} to {df[col].max():.3f}")
        else:
            print(f"  {col}: Not found")
    
    # Calculate individual pollutant AQIs
    if 'epa_pm25_fem' in df.columns:
        df['aqi_pm25'] = df['epa_pm25_fem'].apply(calculate_aqi_pm25)
        print(f"\nPM2.5 AQI calculated: {df['aqi_pm25'].count():,} values")
        print(f"  Range: {df['aqi_pm25'].min():.1f} to {df['aqi_pm25'].max():.1f}")
    
    if 'epa_ozone' in df.columns:
        df['aqi_ozone'] = df['epa_ozone'].apply(calculate_aqi_ozone)
        print(f"Ozone AQI calculated: {df['aqi_ozone'].count():,} values")
        if df['aqi_ozone'].count() > 0:
            print(f"  Range: {df['aqi_ozone'].min():.1f} to {df['aqi_ozone'].max():.1f}")
    
    if 'epa_co' in df.columns:
        df['aqi_co'] = df['epa_co'].apply(calculate_aqi_co)
        print(f"CO AQI calculated: {df['aqi_co'].count():,} values")
        if df['aqi_co'].count() > 0:
            print(f"  Range: {df['aqi_co'].min():.1f} to {df['aqi_co'].max():.1f}")
    
    # Calculate overall AQI (maximum of all pollutants)
    aqi_cols = [col for col in df.columns if col.startswith('aqi_')]
    if aqi_cols:
        df['aqi_overall'] = df[aqi_cols].max(axis=1)
        print(f"\nOverall AQI calculated: {df['aqi_overall'].count():,} values")
        print(f"  Range: {df['aqi_overall'].min():.1f} to {df['aqi_overall'].max():.1f}")
    
    # Daily aggregation for AQI analysis
    print(f"\n=== Daily AQI Analysis ===")
    
    # Group by date and calculate daily AQI (taking the max across all sites and times for each day)
    daily_aqi = df.groupby('date_only').agg({
        'aqi_overall': ['max', 'mean'],
        'aqi_pm25': ['max', 'mean'],  
        'epa_pm25_fem': ['max', 'mean'],
        'pa_mean_pm2_5_atm_b_corr_2': ['max', 'mean'],
        'mean_wind_speed_mph': 'mean',
        'kes_mean_humid_pct': 'mean',
        'mean_temp_out_f': 'mean'
    }).reset_index()
    
    # Flatten column names
    daily_aqi.columns = ['_'.join(col) if col[1] else col[0] for col in daily_aqi.columns]
    daily_aqi = daily_aqi.rename(columns={'date_only_': 'date_only'})
    
    print(f"Daily AQI statistics:")
    print(f"  Number of days: {len(daily_aqi)}")
    print(f"  Max daily AQI range: {daily_aqi['aqi_overall_max'].min():.1f} to {daily_aqi['aqi_overall_max'].max():.1f}")
    print(f"  Mean daily AQI: {daily_aqi['aqi_overall_mean'].mean():.1f}")
    
    # Find highest AQI days
    top_10_aqi = daily_aqi.nlargest(10, 'aqi_overall_max')
    print(f"\nTop 10 highest AQI days:")
    for _, row in top_10_aqi.iterrows():
        date = row['date_only']
        aqi = row['aqi_overall_max']
        weekday = pd.to_datetime(date).strftime('%A')
        print(f"  {date} ({weekday}): AQI = {aqi:.1f}")
    
    # AQI category distribution
    aqi_bins = [0, 50, 100, 150, 200, 300, 500]
    aqi_labels = ['Good\\n(0-50)', 'Moderate\\n(51-100)', 'Unhealthy for\\nSensitive (101-150)', 
                 'Unhealthy\\n(151-200)', 'Very Unhealthy\\n(201-300)', 'Hazardous\\n(301-500)']
    
    daily_aqi['aqi_category'] = pd.cut(daily_aqi['aqi_overall_max'], bins=aqi_bins, labels=aqi_labels)
    aqi_counts = daily_aqi['aqi_category'].value_counts()
    
    print(f"\nDaily AQI category distribution:")
    for category, count in aqi_counts.items():
        pct = count / len(daily_aqi) * 100
        print(f"  {category.replace(chr(10), ' ')}: {count} days ({pct:.1f}%)")
    
    # High AQI days analysis (AQI > 100)
    high_aqi_days = daily_aqi[daily_aqi['aqi_overall_max'] > 100]
    print(f"\nHigh AQI days (>100): {len(high_aqi_days)} days")
    
    if len(high_aqi_days) > 0:
        print("High AQI days details:")
        for _, row in high_aqi_days.iterrows():
            date = row['date_only'] 
            aqi = row['aqi_overall_max']
            pm25_max = row['epa_pm25_fem_max'] if not pd.isna(row['epa_pm25_fem_max']) else 'N/A'
            weekday = pd.to_datetime(date).strftime('%A')
            print(f"  {date} ({weekday}): AQI = {aqi:.1f}, EPA PM2.5 = {pm25_max}")
    
    # Site-level PM2.5 analysis on high AQI days
    if len(high_aqi_days) > 0:
        print(f"\n=== Site-level PM2.5 on High AQI Days ===")
        
        high_aqi_dates = high_aqi_days['date_only'].tolist()
        df_high_aqi = df[df['date_only'].isin(high_aqi_dates)].copy()
        
        print(f"Records on high AQI days: {len(df_high_aqi):,}")
        
        # PM2.5 statistics by site on high AQI days
        site_pm25_stats = df_high_aqi.groupby('site_id')['pa_mean_pm2_5_atm_b_corr_2'].agg([
            'count', 'mean', 'std', 'min', 'max', 'median'
        ]).round(2)
        
        print("PM2.5 statistics by site on high AQI days:")
        print(site_pm25_stats.to_string())
        
        # Check for site differences 
        site_means = df_high_aqi.groupby('site_id')['pa_mean_pm2_5_atm_b_corr_2'].mean()
        print(f"\nSite PM2.5 means on high AQI days:")
        print(f"  Lowest: {site_means.idxmin()} = {site_means.min():.2f} µg/m³")
        print(f"  Highest: {site_means.idxmax()} = {site_means.max():.2f} µg/m³")
        print(f"  Difference: {site_means.max() - site_means.min():.2f} µg/m³")
        
        # Meteorological conditions on high AQI days
        print(f"\n=== Meteorological Conditions on High AQI Days ===")
        meteo_stats = df_high_aqi.groupby('date_only').agg({
            'mean_wind_speed_mph': 'mean',
            'kes_mean_humid_pct': 'mean', 
            'mean_temp_out_f': 'mean',
            'wind_direction_degrees_kr': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else np.nan
        }).round(2)
        
        print("Daily meteorological averages on high AQI days:")
        print(meteo_stats.to_string())
        
    # Save processed data for visualization
    print(f"\n=== Data Summary for Visualization ===")
    print(f"Total records: {len(df):,}")
    print(f"Sites: {df['site_id'].nunique()}")
    print(f"Date range: {df['date_only'].nunique()} days")
    print(f"High AQI days (>100): {len(high_aqi_days)}")
    
    # Key findings summary
    print(f"\n=== Key Findings ===")
    if 'aqi_overall' in df.columns and df['aqi_overall'].count() > 0:
        max_aqi_day = daily_aqi.loc[daily_aqi['aqi_overall_max'].idxmax()]
        print(f"1. Highest AQI day: {max_aqi_day['date_only']} (AQI = {max_aqi_day['aqi_overall_max']:.1f})")
        
        if len(high_aqi_days) > 0:
            high_aqi_dates = high_aqi_days['date_only'].tolist()
            df_high_aqi = df[df['date_only'].isin(high_aqi_dates)]
            site_means = df_high_aqi.groupby('site_id')['pa_mean_pm2_5_atm_b_corr_2'].mean()
            
            print(f"2. PM2.5 variation on high AQI days:")
            print(f"   - Lowest site: {site_means.idxmin()} ({site_means.min():.2f} µg/m³)")
            print(f"   - Highest site: {site_means.idxmax()} ({site_means.max():.2f} µg/m³)")
            print(f"   - Range: {site_means.max() - site_means.min():.2f} µg/m³")
            
        print(f"3. Dataset has {len(aqi_cols)} calculated AQI components")
        print(f"4. {len(daily_aqi)} days of AQI data available for analysis")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""Q6 Context Gathering — Dataset exploration for highest AQI days analysis."""

import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main():
    print("Q6 Context Gathering: Highest AQI days and PM2.5 variations across sites")
    print("=" * 80)
    
    # Load the clean dataset
    df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")
    
    print(f"\nDataset Overview:")
    print(f"• Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"• Date range: {df['datetime'].min()} to {df['datetime'].max()}")
    print(f"• Sites: {df['site_id'].nunique()} unique sites")
    print(f"• Time resolution: {df['datetime'].diff().mode().iloc[0]}")
    
    print(f"\nSites in dataset:")
    sites = df['site_id'].unique()
    for site in sorted(sites):
        n_records = len(df[df['site_id'] == site])
        print(f"  {site}: {n_records:,} records")
    
    print(f"\nDate range and completeness:")
    print(f"• First datetime: {df['datetime'].min()}")
    print(f"• Last datetime: {df['datetime'].max()}")
    print(f"• Total days: {df['date_only'].nunique()}")
    
    # Examine essential columns for Q6 analysis
    print(f"\n=== Essential Columns for Q6 Analysis ===")
    
    # AQI-related columns
    aqi_cols = [col for col in df.columns if 'aqi' in col.lower()]
    print(f"\nAQI columns ({len(aqi_cols)}):")
    for col in aqi_cols:
        non_null = df[col].count()
        print(f"  {col}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
        if non_null > 0:
            print(f"    Range: {df[col].min():.1f} to {df[col].max():.1f}")
            print(f"    Mean: {df[col].mean():.1f}")
    
    # PM2.5 columns 
    pm25_cols = [col for col in df.columns if 'pm2' in col.lower() or 'pm_2' in col.lower()]
    print(f"\nPM2.5 columns ({len(pm25_cols)}):")
    for col in pm25_cols:
        non_null = df[col].count()
        print(f"  {col}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
        if non_null > 0:
            print(f"    Range: {df[col].min():.1f} to {df[col].max():.1f} µg/m³")
            print(f"    Mean: {df[col].mean():.1f} µg/m³")
    
    # EPA pollutant columns
    epa_cols = [col for col in df.columns if any(x in col.lower() for x in ['epa', 'ozone', 'no2', 'so2', 'co'])]
    print(f"\nEPA pollutant columns ({len(epa_cols)}):")
    for col in epa_cols:
        non_null = df[col].count()
        if non_null > 0:
            print(f"  {col}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
    
    # Meteorological columns
    meteo_cols = [col for col in df.columns if any(x in col.lower() for x in 
                 ['wind', 'humid', 'temp', 'pressure', 'precip'])]
    print(f"\nMeteorological columns ({len(meteo_cols)}):")
    for col in meteo_cols[:15]:  # Show first 15 only
        non_null = df[col].count()
        if non_null > 0:
            print(f"  {col}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
    if len(meteo_cols) > 15:
        print(f"  ... and {len(meteo_cols)-15} more")
    
    # Geographic columns
    geo_cols = [col for col in df.columns if any(x in col.lower() for x in 
               ['lat', 'lon', 'buffer', 'green', 'imperv', 'road', 'industrial'])]
    print(f"\nGeographic/Land-use columns ({len(geo_cols)}):")
    for col in geo_cols:
        non_null = df[col].count()
        if non_null > 0:
            print(f"  {col}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
    
    # Temporal columns
    temporal_cols = [col for col in df.columns if any(x in col.lower() for x in 
                    ['hour', 'day', 'week', 'month', 'date', 'time'])]
    print(f"\nTemporal columns ({len(temporal_cols)}):")
    for col in temporal_cols:
        non_null = df[col].count()
        print(f"  {col}: {non_null:,} non-null")
    
    # Calculate daily AQI statistics for context
    if 'aqi_overall' in df.columns:
        daily_aqi = df.groupby('date_only')['aqi_overall'].first()
        print(f"\n=== Daily AQI Analysis ===")
        print(f"• Total days with AQI data: {daily_aqi.count()}")
        print(f"• AQI range: {daily_aqi.min():.1f} to {daily_aqi.max():.1f}")
        print(f"• Mean daily AQI: {daily_aqi.mean():.1f}")
        
        # Show highest AQI days
        top_10_aqi = daily_aqi.nlargest(10)
        print(f"\nTop 10 highest AQI days:")
        for date, aqi in top_10_aqi.items():
            weekday = pd.to_datetime(date).strftime('%A')
            print(f"  {date} ({weekday}): AQI = {aqi:.1f}")
        
        # AQI distribution
        aqi_bins = [0, 50, 100, 150, 200, 300, 500]
        aqi_labels = ['Good (0-50)', 'Moderate (51-100)', 'Unhealthy for Sensitive (101-150)', 
                     'Unhealthy (151-200)', 'Very Unhealthy (201-300)', 'Hazardous (301-500)']
        aqi_counts = pd.cut(daily_aqi, bins=aqi_bins, labels=aqi_labels).value_counts()
        print(f"\nAQI category distribution:")
        for category, count in aqi_counts.items():
            pct = count / len(daily_aqi) * 100
            print(f"  {category}: {count} days ({pct:.1f}%)")
    
    print(f"\n=== Sample rows for inspection ===")
    # Show a few sample rows focusing on high AQI days
    if 'aqi_overall' in df.columns:
        high_aqi_sample = df[df['aqi_overall'] >= 100].head()
        if len(high_aqi_sample) > 0:
            cols_to_show = ['datetime', 'site_id', 'aqi_overall', 'pa_mean_pm2_5_atm_b_corr_2', 
                          'mean_wind_speed_mph', 'kes_mean_humid_pct']
            print("Sample high AQI records:")
            print(high_aqi_sample[cols_to_show].to_string(index=False))
    
    print(f"\n=== Column Summary ===")
    print(f"Total columns: {len(df.columns)}")
    print(f"All column names:")
    for i, col in enumerate(df.columns):
        print(f"  {i+1:2d}. {col}")


if __name__ == "__main__":
    main()
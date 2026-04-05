#!/usr/bin/env python3
"""Q4 Context Gathering - AQI and other pollutants analysis"""

import pandas as pd
import numpy as np

# Load the clean HEROS dataset
print("Loading HEROS clean dataset...")
df = pd.read_parquet("data/clean/data_HEROS_clean.parquet")

print(f"\n=== HEROS Dataset Overview ===")
print(f"Shape: {df.shape}")

print(f"\n=== Column Structure ===")
for i, col in enumerate(df.columns):
    print(f"{i+1:2d}. {col}")

# Find datetime and site columns
datetime_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
site_cols = [col for col in df.columns if 'site' in col.lower()]

print(f"\nDatetime columns: {datetime_cols}")
print(f"Site columns: {site_cols}")

if datetime_cols:
    dt_col = datetime_cols[0]
    print(f"Date range: {df[dt_col].min()} to {df[dt_col].max()}")

if site_cols:
    site_col = site_cols[0]
    print(f"Unique sites: {df[site_col].nunique()}")
    print(f"Sites: {sorted(df[site_col].unique())}")
else:
    print("No site column found")

print(f"\n=== EPA/Pollutant Related Columns ===")
epa_cols = [col for col in df.columns if any(keyword in col.lower() 
           for keyword in ['epa', 'aqi', 'ozone', 'no2', 'co', 'so2', 'pollutant'])]
print("EPA/Pollutant columns found:")
for col in epa_cols:
    non_null = df[col].notna().sum()
    print(f"  {col}: {non_null:,} non-null values ({non_null/len(df)*100:.1f}%)")

print(f"\n=== EPA Data Availability Check ===")
# Load EPA data to see what's available
try:
    epa_df = pd.read_parquet("data/epa/epa_hourly_boston.parquet")
    print(f"EPA dataset shape: {epa_df.shape}")
    
    epa_datetime_cols = [col for col in epa_df.columns if 'date' in col.lower() or 'time' in col.lower()]
    if epa_datetime_cols:
        dt_col = epa_datetime_cols[0]
        print(f"EPA date range: {epa_df[dt_col].min()} to {epa_df[dt_col].max()}")
    
    print(f"EPA sites: {sorted(epa_df['site_code'].unique()) if 'site_code' in epa_df.columns else 'No site_code column'}")
    
    print(f"\nEPA columns:")
    for col in epa_df.columns:
        print(f"  {col}")
        
    # Check for pollutants
    pollutant_cols = [col for col in epa_df.columns if any(p in col.lower() 
                     for p in ['pm25', 'ozone', 'no2', 'co', 'so2', 'aqi'])]
    print(f"\nPollutant columns in EPA data:")
    for col in pollutant_cols:
        non_null = epa_df[col].notna().sum()
        print(f"  {col}: {non_null:,} non-null values")
        if non_null > 0:
            print(f"    Range: {epa_df[col].min():.2f} to {epa_df[col].max():.2f}")
            
except Exception as e:
    print(f"EPA data not found or error: {e}")

print(f"\n=== Time Period Analysis ===")
study_start = pd.Timestamp('2023-07-19')
study_end = pd.Timestamp('2023-08-23')
print(f"Q4 target period: July 19 - August 23, 2023")

if datetime_cols:
    dt_col = datetime_cols[0]
    print(f"HEROS data coverage in target period:")
    target_data = df[(df[dt_col] >= study_start) & (df[dt_col] <= study_end)]
    print(f"  Rows in target period: {len(target_data):,} ({len(target_data)/len(df)*100:.1f}%)")
    print(f"  Date coverage: {target_data[dt_col].min()} to {target_data[dt_col].max()}")
else:
    print("No datetime column found")

print(f"\n=== Existing Q4 Figures Check ===")
import os
q4_figures = [f for f in os.listdir("figures") if "q4_" in f.lower()]
if q4_figures:
    print("Existing Q4 figures found:")
    for fig in q4_figures:
        print(f"  {fig}")
else:
    print("No existing Q4 figures found.")

print("\n=== Missing Data Analysis ===")
if epa_cols:
    for col in epa_cols:
        missing = df[col].isna().sum()
        if missing > 0:
            print(f"{col}: {missing:,} missing values ({missing/len(df)*100:.1f}%)")
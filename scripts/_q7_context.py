#!/usr/bin/env python3
"""Q7 context — What data do we have for PM2.5 vs heat stress (WBGT) analysis?"""

import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main():
    """Check what heat-related and PM2.5 data is available."""
    
    # Load the clean dataset
    df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")
    
    print("=" * 60)
    print("Q7 DATA CONTEXT: PM2.5 vs Heat Stress (WBGT)")
    print("=" * 60)
    
    print(f"Dataset shape: {df.shape}")
    print(f"Date range: {df['datetime'].min()} to {df['datetime'].max()}")
    print(f"Sites: {df['site_id'].nunique()} unique sites")
    
    # Check PM2.5 columns
    pm_cols = [col for col in df.columns if 'pm2' in col.lower() or 'pa_' in col]
    print(f"\n--- PM2.5 COLUMNS ({len(pm_cols)}) ---")
    for col in pm_cols:
        non_null = df[col].notna().sum()
        print(f"  {col:<40}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
        if non_null > 0:
            print(f"    └─ Stats: mean={df[col].mean():.2f}, std={df[col].std():.2f}, min={df[col].min():.2f}, max={df[col].max():.2f}")
    
    # Check heat/WBGT columns  
    heat_cols = [col for col in df.columns if any(term in col.lower() for term in ['wbgt', 'heat', 'temp', 'thi'])]
    print(f"\n--- HEAT/TEMPERATURE COLUMNS ({len(heat_cols)}) ---")
    for col in heat_cols:
        non_null = df[col].notna().sum()
        print(f"  {col:<40}: {non_null:,} non-null ({non_null/len(df)*100:.1f}%)")
        if non_null > 0:
            print(f"    └─ Stats: mean={df[col].mean():.2f}, std={df[col].std():.2f}, min={df[col].min():.2f}, max={df[col].max():.2f}")
    
    # The correct PM2.5 column based on user info
    pa_col = "pa_mean_pm2_5_atm_b_corr_2"
    wbgt_col = None
    
    # Find the WBGT column
    for col in df.columns:
        if 'wbgt' in col.lower():
            wbgt_col = col
            break
    
    if wbgt_col is None:
        print(f"\n⚠️  WARNING: No WBGT column found. Available temperature columns:")
        for col in heat_cols:
            if df[col].notna().sum() > 1000:  # Only show columns with data
                print(f"  - {col}")
        # Default to Kestrel temperature if WBGT not found
        wbgt_col = "kes_mean_temp_f"
        print(f"\n🔄 Using {wbgt_col} as heat indicator instead of WBGT")
    else:
        print(f"\n✅ Found WBGT column: {wbgt_col}")
    
    # Check for complete cases
    complete_cases = df[[pa_col, wbgt_col]].dropna()
    print(f"\n--- COMPLETE CASES ANALYSIS ---")
    print(f"Complete PM2.5 + WBGT pairs: {len(complete_cases):,} ({len(complete_cases)/len(df)*100:.1f}%)")
    
    # Basic correlation
    if len(complete_cases) > 100:
        corr = complete_cases[pa_col].corr(complete_cases[wbgt_col])
        print(f"Overall correlation (PM2.5 vs {wbgt_col}): r = {corr:.3f}")
        
        # Site-level correlations preview
        print(f"\n--- SITE-LEVEL CORRELATIONS ---")
        site_corrs = []
        for site in sorted(df['site_id'].unique()):
            site_data = df[df['site_id'] == site][[pa_col, wbgt_col]].dropna()
            if len(site_data) > 50:
                site_corr = site_data[pa_col].corr(site_data[wbgt_col])
                site_corrs.append(site_corr)
                print(f"  {site:<12}: r = {site_corr:6.3f} (n = {len(site_data):,})")
        
        if site_corrs:
            print(f"\nSite correlation range: {min(site_corrs):.3f} to {max(site_corrs):.3f}")
    
    # Check temporal coverage
    print(f"\n--- TEMPORAL COVERAGE ---")
    df_clean = df[[pa_col, wbgt_col, 'datetime']].dropna()
    if len(df_clean) > 0:
        print(f"Date range with both variables: {df_clean['datetime'].min()} to {df_clean['datetime'].max()}")
        days_with_data = df_clean['datetime'].dt.date.nunique()
        print(f"Days with complete data: {days_with_data}")
        
        # Hourly coverage
        hourly_counts = df_clean.groupby(df_clean['datetime'].dt.hour).size()
        print(f"Hourly coverage range: {hourly_counts.min()} to {hourly_counts.max()} observations per hour")
    
    # Meteorological context columns
    met_cols = [col for col in df.columns if any(term in col.lower() for term in 
                ['wind', 'humid', 'pressure', 'solar', 'radiation'])]
    if met_cols:
        print(f"\n--- METEOROLOGICAL CONTEXT ({len(met_cols)}) ---")
        for col in met_cols[:8]:  # Show first 8
            non_null = df[col].notna().sum()
            if non_null > 1000:
                print(f"  {col:<35}: {non_null:,} non-null")
    
    # Save key info for next scripts
    context = {
        'pm25_col': pa_col,
        'wbgt_col': wbgt_col,
        'total_rows': len(df),
        'complete_cases': len(complete_cases),
        'overall_corr': corr if len(complete_cases) > 100 else None,
        'n_sites': df['site_id'].nunique(),
        'n_days': days_with_data if len(df_clean) > 0 else 0
    }
    
    print(f"\n✅ Context saved for Q7 analysis")
    return context

if __name__ == "__main__":
    context = main()
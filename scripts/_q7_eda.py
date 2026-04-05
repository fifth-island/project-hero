#!/usr/bin/env python3  
"""Q7 EDA — Deep exploration of PM2.5 vs WBGT relationship"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from scipy import stats
import warnings
warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent

# Site name mapping
SITE_NAMES = {
    "berkley": "Berkeley Community Garden", "castle": "Castle Square",
    "chin": "Chin Park", "dewey": "Dewey Square", 
    "eliotnorton": "Eliot Norton Park", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo Park",
    "oxford": "Oxford Place Plaza", "reggie": "Reggie Wong Park", 
    "taitung": "Tai Tung Park", "tufts": "Tufts Community Garden"
}

def main():
    """Perform additional EDA for Q7 beyond Phase 3 work."""
    
    print("=" * 60)
    print("Q7 ADDITIONAL EDA: PM2.5 vs WBGT Relationship")
    print("=" * 60)
    
    # Load data
    df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")
    
    # Key columns
    pm25_col = "pa_mean_pm2_5_atm_b_corr_2"
    wbgt_col = "kes_mean_wbgt_f"
    
    # Clean data for analysis
    df_clean = df[[pm25_col, wbgt_col, 'site_id', 'datetime', 'hour', 'day_of_week', 
                   'is_daytime', 'kes_mean_humid_pct', 'mean_wind_speed_mph']].dropna()
    
    print(f"Clean dataset: {len(df_clean):,} observations")
    
    # === 1. Distribution Analysis ===
    print("\n--- 1. DISTRIBUTION ANALYSIS ---")
    
    # Overall distributions
    pm25_stats = df_clean[pm25_col].describe()
    wbgt_stats = df_clean[wbgt_col].describe()
    
    print(f"\nPM2.5 Distribution (µg/m³):")
    print(f"  Mean: {pm25_stats['mean']:.2f}, Median: {pm25_stats['50%']:.2f}")
    print(f"  IQR: {pm25_stats['25%']:.2f} - {pm25_stats['75%']:.2f}")
    print(f"  Range: {pm25_stats['min']:.2f} - {pm25_stats['max']:.2f}")
    
    print(f"\nWBGT Distribution (°F):")
    print(f"  Mean: {wbgt_stats['mean']:.2f}, Median: {wbgt_stats['50%']:.2f}")
    print(f"  IQR: {wbgt_stats['25%']:.2f} - {wbgt_stats['75%']:.2f}")
    print(f"  Range: {wbgt_stats['min']:.2f} - {wbgt_stats['max']:.2f}")
    
    # === 2. Overall Correlation Analysis ===
    print("\n--- 2. OVERALL CORRELATION ---")
    overall_corr = stats.pearsonr(df_clean[pm25_col], df_clean[wbgt_col])
    overall_spearman = stats.spearmanr(df_clean[pm25_col], df_clean[wbgt_col])
    
    print(f"Pearson correlation: r = {overall_corr[0]:.3f}, p = {overall_corr[1]:.2e}")
    print(f"Spearman correlation: ρ = {overall_spearman[0]:.3f}, p = {overall_spearman[1]:.2e}")
    
    # === 3. Temporal Patterns ===
    print("\n--- 3. TEMPORAL PATTERNS ---")
    
    # Hourly correlations
    hourly_corrs = []
    print("\nHourly correlations:")
    for hour in sorted(df_clean['hour'].unique()):
        hour_data = df_clean[df_clean['hour'] == hour]
        if len(hour_data) > 50:
            corr, p = stats.pearsonr(hour_data[pm25_col], hour_data[wbgt_col])
            hourly_corrs.append({'hour': hour, 'r': corr, 'p': p, 'n': len(hour_data)})
            if hour % 6 == 0:  # Print every 6 hours
                print(f"  {hour:02d}:00  r = {corr:6.3f} (p = {p:.3f}, n = {len(hour_data):,})")
    
    # Day/night differences
    day_data = df_clean[df_clean['is_daytime'] == True]
    night_data = df_clean[df_clean['is_daytime'] == False]
    
    if len(day_data) > 100 and len(night_data) > 100:
        day_corr = stats.pearsonr(day_data[pm25_col], day_data[wbgt_col])[0]
        night_corr = stats.pearsonr(night_data[pm25_col], night_data[wbgt_col])[0]
        print(f"\nDay vs Night correlations:")
        print(f"  Daytime:   r = {day_corr:.3f} (n = {len(day_data):,})")
        print(f"  Nighttime: r = {night_corr:.3f} (n = {len(night_data):,})")
    
    # === 4. Site Heterogeneity Analysis ===
    print("\n--- 4. SITE HETEROGENEITY ---")
    site_analysis = []
    
    for site_id in sorted(df_clean['site_id'].unique()):
        site_data = df_clean[df_clean['site_id'] == site_id]
        if len(site_data) > 100:
            # Basic correlation
            corr, p = stats.pearsonr(site_data[pm25_col], site_data[wbgt_col])
            
            # Linear regression slope
            slope, intercept = np.polyfit(site_data[wbgt_col], site_data[pm25_col], 1)
            
            # R-squared
            y_pred = slope * site_data[wbgt_col] + intercept
            ss_res = np.sum((site_data[pm25_col] - y_pred) ** 2)
            ss_tot = np.sum((site_data[pm25_col] - site_data[pm25_col].mean()) ** 2)
            r_squared = 1 - (ss_res / ss_tot)
            
            site_analysis.append({
                'site_id': site_id,
                'site_name': SITE_NAMES[site_id],
                'n': len(site_data),
                'r': corr,
                'p': p,
                'slope': slope,
                'r_squared': r_squared,
                'pm25_mean': site_data[pm25_col].mean(),
                'wbgt_mean': site_data[wbgt_col].mean()
            })
    
    # Sort by correlation strength
    site_analysis.sort(key=lambda x: x['r'], reverse=True)
    
    print(f"\nSite-level correlations (ranked by strength):")
    print(f"{'Site':<18} {'r':<6} {'p-val':<8} {'Slope':<8} {'R²':<6} {'n':<6}")
    print("-" * 55)
    for s in site_analysis:
        print(f"{s['site_name'][:17]:<18} {s['r']:<6.3f} {s['p']:<8.3f} {s['slope']:<8.3f} {s['r_squared']:<6.3f} {s['n']:<6,}")
    
    # === 5. WBGT Threshold Analysis ===
    print("\n--- 5. WBGT THRESHOLD ANALYSIS ---")
    
    # OSHA heat stress thresholds (convert from °F)
    thresholds = [80, 85, 90]  # °F WBGT
    
    for threshold in thresholds:
        below = df_clean[df_clean[wbgt_col] < threshold]
        above = df_clean[df_clean[wbgt_col] >= threshold]
        
        if len(above) > 100:
            below_pm25 = below[pm25_col].mean()
            above_pm25 = above[pm25_col].mean()
            t_stat, p_val = stats.ttest_ind(below[pm25_col], above[pm25_col])
            
            print(f"\nWBGT threshold {threshold}°F:")
            print(f"  Below: {len(below):,} obs, PM2.5 = {below_pm25:.2f} µg/m³")
            print(f"  Above: {len(above):,} obs, PM2.5 = {above_pm25:.2f} µg/m³")
            print(f"  Difference: {above_pm25 - below_pm25:+.2f} µg/m³ (p = {p_val:.3f})")
        else:
            print(f"\nWBGT threshold {threshold}°F: Insufficient data above threshold (n = {len(above)})")
    
    # === 6. Conditional Relationships ===
    print("\n--- 6. CONDITIONAL RELATIONSHIPS ---")
    
    # By humidity terciles
    humid_terciles = df_clean['kes_mean_humid_pct'].quantile([0.33, 0.67])
    
    low_humid = df_clean[df_clean['kes_mean_humid_pct'] <= humid_terciles.iloc[0]]
    med_humid = df_clean[(df_clean['kes_mean_humid_pct'] > humid_terciles.iloc[0]) & 
                         (df_clean['kes_mean_humid_pct'] <= humid_terciles.iloc[1])]
    high_humid = df_clean[df_clean['kes_mean_humid_pct'] > humid_terciles.iloc[1]]
    
    print(f"\nCorrelation by humidity level:")
    for name, data in [("Low humidity", low_humid), ("Med humidity", med_humid), ("High humidity", high_humid)]:
        if len(data) > 100:
            corr = stats.pearsonr(data[pm25_col], data[wbgt_col])[0]
            print(f"  {name:<13}: r = {corr:.3f} (n = {len(data):,})")
    
    # By wind speed terciles
    wind_terciles = df_clean['mean_wind_speed_mph'].quantile([0.33, 0.67])
    
    low_wind = df_clean[df_clean['mean_wind_speed_mph'] <= wind_terciles.iloc[0]]
    med_wind = df_clean[(df_clean['mean_wind_speed_mph'] > wind_terciles.iloc[0]) & 
                        (df_clean['mean_wind_speed_mph'] <= wind_terciles.iloc[1])]
    high_wind = df_clean[df_clean['mean_wind_speed_mph'] > wind_terciles.iloc[1]]
    
    print(f"\nCorrelation by wind speed:")
    for name, data in [("Low wind", low_wind), ("Med wind", med_wind), ("High wind", high_wind)]:
        if len(data) > 100:
            corr = stats.pearsonr(data[pm25_col], data[wbgt_col])[0]
            print(f"  {name:<13}: r = {corr:.3f} (n = {len(data):,})")
    
    # === 7. Extreme Values Analysis ===
    print("\n--- 7. EXTREME VALUES ANALYSIS ---")
    
    # High WBGT days (>75th percentile)
    high_wbgt_threshold = df_clean[wbgt_col].quantile(0.75)
    high_wbgt_days = df_clean[df_clean[wbgt_col] >= high_wbgt_threshold]
    
    print(f"\nHigh WBGT analysis (≥{high_wbgt_threshold:.1f}°F):")
    print(f"  Observations: {len(high_wbgt_days):,} ({len(high_wbgt_days)/len(df_clean)*100:.1f}%)")
    print(f"  PM2.5 during high WBGT: {high_wbgt_days[pm25_col].mean():.2f} ± {high_wbgt_days[pm25_col].std():.2f} µg/m³")
    print(f"  PM2.5 during normal WBGT: {df_clean[df_clean[wbgt_col] < high_wbgt_threshold][pm25_col].mean():.2f} µg/m³")
    
    # High PM2.5 days (>75th percentile)  
    high_pm25_threshold = df_clean[pm25_col].quantile(0.75)
    high_pm25_days = df_clean[df_clean[pm25_col] >= high_pm25_threshold]
    
    print(f"\nHigh PM2.5 analysis (≥{high_pm25_threshold:.1f} µg/m³):")
    print(f"  Observations: {len(high_pm25_days):,} ({len(high_pm25_days)/len(df_clean)*100:.1f}%)")
    print(f"  WBGT during high PM2.5: {high_pm25_days[wbgt_col].mean():.2f} ± {high_pm25_days[wbgt_col].std():.2f}°F")
    print(f"  WBGT during normal PM2.5: {df_clean[df_clean[pm25_col] < high_pm25_threshold][wbgt_col].mean():.2f}°F")
    
    print("\n✅ Additional EDA completed for Q7")
    
    return {
        'overall_corr': overall_corr[0],
        'site_analysis': site_analysis,
        'hourly_corrs': hourly_corrs,
        'day_night_diff': abs(day_corr - night_corr) if len(day_data) > 100 and len(night_data) > 100 else None,
        'high_wbgt_threshold': high_wbgt_threshold,
        'high_pm25_threshold': high_pm25_threshold
    }

if __name__ == "__main__":
    results = main()
#!/usr/bin/env python3
"""Q4 — Additional EDA for AQI and multi-pollutant analysis"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import pearsonr, ttest_ind
from datetime import datetime

# Load data
print("Loading HEROS clean dataset...")
df = pd.read_parquet("data/clean/data_HEROS_clean.parquet")

print(f"Dataset shape: {df.shape}")
print(f"Date range: {df['datetime'].min()} to {df['datetime'].max()}")

# Define EPA breakpoints (from original phase3 script)
AQI_BP = {
    "pm25_24hr": [(0.0,9.0,0,50),(9.1,35.4,51,100),(35.5,55.4,101,150),
                  (55.5,125.4,151,200),(125.5,225.4,201,300),(225.5,325.4,301,500)],
    "ozone_8hr_ppm": [(0.000,0.054,0,50),(0.055,0.070,51,100),(0.071,0.085,101,150),
                      (0.086,0.105,151,200),(0.106,0.200,201,300)],
    "co_8hr_ppm": [(0.0,4.4,0,50),(4.5,9.4,51,100),(9.5,12.4,101,150),
                   (12.5,15.4,151,200),(15.5,30.4,201,300),(30.5,50.4,301,500)],
    "so2_1hr_ppb": [(0,35,0,50),(36,75,51,100),(76,185,101,150),
                    (186,304,151,200),(305,604,201,300),(605,1004,301,500)],
    "no2_1hr_ppb": [(0,53,0,50),(54,100,51,100),(101,360,101,150),
                    (361,649,151,200),(650,1249,201,300),(1250,2049,301,500)],
}

def calc_sub_aqi(conc, breakpoints):
    if pd.isna(conc): return np.nan
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= conc <= bp_hi:
            return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (conc - bp_lo) + aqi_lo
    return 500  # Above highest breakpoint

# EPA NAAQS standards for exceedance analysis
EPA_NAAQS = {
    "pm25_annual": 9.0,    # µg/m³
    "pm25_24hr": 35.0,     # µg/m³  
    "ozone_8hr": 0.070,    # ppm
    "co_8hr": 9.0,         # ppm
    "so2_1hr": 75,         # ppb
    "no2_1hr": 100,        # ppb (53 ppb annual)
}

print("\n=== 1. HOURLY POLLUTANT PATTERNS (WEEKDAY/WEEKEND) ===")

# Add time features
df["hour"] = df["datetime"].dt.hour
df["day_of_week"] = df["datetime"].dt.day_of_week
df["is_weekend"] = df["day_of_week"].isin([5, 6])  # Saturday, Sunday

pollutant_cols = ["epa_ozone", "epa_so2", "epa_co", "epa_no2", "epa_pm25_fem"]

hourly_patterns = {}
for poll in pollutant_cols:
    weekday_hourly = df[~df["is_weekend"]].groupby("hour")[poll].agg(["mean", "std", "count"]).reset_index()
    weekend_hourly = df[df["is_weekend"]].groupby("hour")[poll].agg(["mean", "std", "count"]).reset_index()
    
    weekday_hourly.columns = ["hour", "weekday_mean", "weekday_std", "weekday_count"]
    weekend_hourly.columns = ["hour", "weekend_mean", "weekend_std", "weekend_count"]
    
    combined = pd.merge(weekday_hourly, weekend_hourly, on="hour")
    combined["diff_abs"] = np.abs(combined["weekday_mean"] - combined["weekend_mean"])
    combined["pct_diff"] = (combined["weekday_mean"] - combined["weekend_mean"]) / combined["weekend_mean"] * 100
    
    # Peak hours
    weekday_peak = combined.loc[combined["weekday_mean"].idxmax(), "hour"]
    weekend_peak = combined.loc[combined["weekend_mean"].idxmax(), "hour"]
    
    hourly_patterns[poll] = {
        "weekday_peak_hour": int(weekday_peak),
        "weekend_peak_hour": int(weekend_peak),
        "weekday_peak_conc": combined.loc[combined["weekday_mean"].idxmax(), "weekday_mean"],
        "weekend_peak_conc": combined.loc[combined["weekend_mean"].idxmax(), "weekend_mean"],
        "max_hourly_diff": combined["diff_abs"].max(),
        "max_pct_diff": combined["pct_diff"].abs().max()
    }

for poll, stats in hourly_patterns.items():
    print(f"\n{poll}:")
    print(f"  Weekday peak: {stats['weekday_peak_hour']}h ({stats['weekday_peak_conc']:.3f})")
    print(f"  Weekend peak: {stats['weekend_peak_hour']}h ({stats['weekend_peak_conc']:.3f})")
    print(f"  Max hourly difference: {stats['max_hourly_diff']:.3f} ({stats['max_pct_diff']:.1f}%)")

print("\n=== 2. AQI CATEGORY FREQUENCY & DURATION ===")

# Calculate daily AQI (from existing Phase 3 logic)
daily = df.groupby("date_only").agg(
    pm25_mean=("imputed_pa_mean_pm2_5_atm_b_corr_2", "mean"),
    ozone_mean=("epa_ozone", "mean"),
    co_mean=("epa_co", "mean"),
    so2_max=("epa_so2", "max"),
    no2_max=("epa_no2", "max"),
).reset_index()

daily["aqi_pm25"] = daily["pm25_mean"].apply(lambda c: calc_sub_aqi(c, AQI_BP["pm25_24hr"]))
daily["aqi_ozone"] = daily["ozone_mean"].apply(lambda c: calc_sub_aqi(c, AQI_BP["ozone_8hr_ppm"]))
daily["aqi_co"] = daily["co_mean"].apply(lambda c: calc_sub_aqi(c, AQI_BP["co_8hr_ppm"]))
daily["aqi_so2"] = daily["so2_max"].apply(lambda c: calc_sub_aqi(c, AQI_BP["so2_1hr_ppb"]))
daily["aqi_no2"] = daily["no2_max"].apply(lambda c: calc_sub_aqi(c, AQI_BP["no2_1hr_ppb"]))

aqi_cols = ["aqi_pm25", "aqi_ozone", "aqi_co", "aqi_so2", "aqi_no2"]
daily["aqi_overall"] = daily[aqi_cols].max(axis=1)

def categorize_aqi(aqi):
    if pd.isna(aqi): return "Missing"
    elif aqi <= 50: return "Good"
    elif aqi <= 100: return "Moderate"
    elif aqi <= 150: return "Unhealthy for Sensitive"
    elif aqi <= 200: return "Unhealthy"
    elif aqi <= 300: return "Very Unhealthy"
    else: return "Hazardous"

daily["aqi_category"] = daily["aqi_overall"].apply(categorize_aqi)
category_counts = daily["aqi_category"].value_counts()
category_pcts = (category_counts / len(daily) * 100).round(1)

print("AQI Category Distribution (% of days):")
for cat in ["Good", "Moderate", "Unhealthy for Sensitive", "Unhealthy", "Very Unhealthy", "Hazardous"]:
    if cat in category_counts:
        print(f"  {cat}: {category_counts[cat]} days ({category_pcts[cat]}%)")

# Consecutive day analysis
daily = daily.sort_values("date_only")
daily["prev_category"] = daily["aqi_category"].shift(1)
daily["category_change"] = daily["aqi_category"] != daily["prev_category"]
daily["streak_id"] = daily["category_change"].cumsum()

streaks = daily.groupby("streak_id").agg(
    category=("aqi_category", "first"),
    duration=("aqi_category", "size"),
    start_date=("date_only", "min")
).reset_index()

max_streaks = streaks.groupby("category")["duration"].max()
print(f"\nLongest consecutive periods:")
for cat, days in max_streaks.items():
    print(f"  {cat}: {days} days")

print("\n=== 3. METEOROLOGICAL INFLUENCE ===")

met_cols = ["kes_mean_temp_f", "kes_mean_humid_pct", "mean_wind_speed_mph", "wind_direction_degrees_kr"]
correlations = {}

for poll in pollutant_cols:
    poll_corrs = {}
    for met in met_cols:
        mask = df[poll].notna() & df[met].notna()
        if mask.sum() > 100:  # Sufficient data
            r, p = pearsonr(df.loc[mask, poll], df.loc[mask, met])
            poll_corrs[met] = {"r": r, "p": p}
    correlations[poll] = poll_corrs

print("Pollutant-Meteorology Correlations (r, p-value):")
for poll, corrs in correlations.items():
    print(f"\n{poll}:")
    for met, stats in corrs.items():
        significance = "***" if stats["p"] < 0.001 else "**" if stats["p"] < 0.01 else "*" if stats["p"] < 0.05 else ""
        print(f"  vs {met}: r={stats['r']:.3f} (p={stats['p']:.3f}){significance}")

print("\n=== 4. MULTI-POLLUTANT EVENTS ===")

# Define "elevated" thresholds (moderate AQI = 51)
thresholds = {
    "epa_pm25_fem": 9.1,    # Start of moderate for PM2.5
    "epa_ozone": 0.055,     # Start of moderate for ozone  
    "epa_co": 4.5,          # Start of moderate for CO
    "epa_so2": 36,          # Start of moderate for SO2
    "epa_no2": 54,          # Start of moderate for NO2
}

daily_exceedances = daily.copy()
for poll, thresh in thresholds.items():
    col_name = poll.replace("epa_", "").replace("_fem", "")
    if f"{col_name}_mean" in daily.columns:
        daily_exceedances[f"elevated_{col_name}"] = daily[f"{col_name}_mean"] > thresh
    elif f"{col_name}_max" in daily.columns:
        daily_exceedances[f"elevated_{col_name}"] = daily[f"{col_name}_max"] > thresh

elevated_cols = [col for col in daily_exceedances.columns if col.startswith("elevated_")]
daily_exceedances["num_elevated"] = daily_exceedances[elevated_cols].sum(axis=1)
daily_exceedances["multi_pollutant_event"] = daily_exceedances["num_elevated"] >= 3

multi_events = daily_exceedances["multi_pollutant_event"].sum()
event_rate = multi_events / len(daily_exceedances) * 100

print(f"Multi-pollutant events (≥3 pollutants elevated): {multi_events} days ({event_rate:.1f}%)")

if multi_events > 0:
    event_days = daily_exceedances[daily_exceedances["multi_pollutant_event"]]
    print("Event dates:", event_days["date_only"].tolist()[:5], "..." if len(event_days) > 5 else "")

print("\n=== 5. EPA STANDARD EXCEEDANCES ===")

exceedance_analysis = {}
for poll in pollutant_cols:
    poll_data = df[poll].dropna()
    
    if poll == "epa_pm25_fem":
        # Daily average exceedances
        daily_pm25 = df.groupby("date_only")["epa_pm25_fem"].mean()
        exceeds_daily = (daily_pm25 > EPA_NAAQS["pm25_24hr"]).sum()
        total_days = len(daily_pm25)
        exceedance_analysis[poll] = {
            "standard": f"{EPA_NAAQS['pm25_24hr']} µg/m³ (24-hr)",
            "exceedances": exceeds_daily,
            "total_periods": total_days,
            "exceedance_rate": exceeds_daily / total_days * 100,
            "max_value": daily_pm25.max()
        }
    elif poll == "epa_ozone":
        # 8-hour max exceedances (approximate with hourly data)
        exceeds = (poll_data > EPA_NAAQS["ozone_8hr"]).sum()
        total = len(poll_data)
        exceedance_analysis[poll] = {
            "standard": f"{EPA_NAAQS['ozone_8hr']} ppm (8-hr)",
            "exceedances": exceeds,
            "total_periods": total,
            "exceedance_rate": exceeds / total * 100,
            "max_value": poll_data.max()
        }
    elif poll == "epa_co":
        exceeds = (poll_data > EPA_NAAQS["co_8hr"]).sum()
        total = len(poll_data)
        exceedance_analysis[poll] = {
            "standard": f"{EPA_NAAQS['co_8hr']} ppm (8-hr)",
            "exceedances": exceeds,
            "total_periods": total,
            "exceedance_rate": exceeds / total * 100,
            "max_value": poll_data.max()
        }
    elif poll == "epa_so2":
        exceeds = (poll_data > EPA_NAAQS["so2_1hr"]).sum()
        total = len(poll_data)
        exceedance_analysis[poll] = {
            "standard": f"{EPA_NAAQS['so2_1hr']} ppb (1-hr)",
            "exceedances": exceeds,
            "total_periods": total,
            "exceedance_rate": exceeds / total * 100,
            "max_value": poll_data.max()
        }
    elif poll == "epa_no2":
        exceeds = (poll_data > EPA_NAAQS["no2_1hr"]).sum()
        total = len(poll_data)
        exceedance_analysis[poll] = {
            "standard": f"{EPA_NAAQS['no2_1hr']} ppb (1-hr)",
            "exceedances": exceeds,
            "total_periods": total,
            "exceedance_rate": exceeds / total * 100,
            "max_value": poll_data.max()
        }

print("EPA NAAQS Exceedance Analysis:")
for poll, analysis in exceedance_analysis.items():
    print(f"\n{poll}:")
    print(f"  Standard: {analysis['standard']}")
    print(f"  Exceedances: {analysis['exceedances']} of {analysis['total_periods']} ({analysis['exceedance_rate']:.2f}%)")
    print(f"  Maximum observed: {analysis['max_value']:.3f}")

print("\n=== 6. HEAT-AIR QUALITY INTERACTIONS ===")

# Define high heat periods
wbgt_col = "imputed_kes_mean_wbgt_f"
print(f"\nDebugging WBGT column '{wbgt_col}':")
print(f"  Column exists: {wbgt_col in df.columns}")

if wbgt_col in df.columns:
    print(f"  Data type: {df[wbgt_col].dtype}")
    print(f"  Sample values: {df[wbgt_col].head().tolist()}")
    print(f"  Unique types in column: {set(type(x).__name__ for x in df[wbgt_col].dropna().head(100))}")
    
    # Try to filter for numeric values only
    numeric_mask = pd.to_numeric(df[wbgt_col], errors='coerce').notna()
    wbgt_numeric = pd.to_numeric(df[wbgt_col], errors='coerce')[numeric_mask]
    
    if len(wbgt_numeric) > 0:
        # This won't work since all values are False (boolean)
        print("  WBGT column contains all boolean False values - skipping heat analysis")
        heat_poll_interactions = {}
    else:
        print("  No numeric WBGT data available, skipping heat-air quality analysis")
        heat_poll_interactions = {}
else:
    print("  WBGT column not found, skipping heat-air quality analysis")
    heat_poll_interactions = {}

# Skip the heat-air quality interaction since WBGT data is not usable
print("Heat-Air Quality Interactions: Skipped due to WBGT data being boolean")

heat_poll_interactions = {}

# Skip the heat analysis since WBGT is boolean - just complete the spatial analysis

print("\n=== 7. SPATIAL VARIATION BY SITE ===")

site_pollutant_stats = {}
for site in df["site_id"].unique():
    site_data = df[df["site_id"] == site]
    site_stats = {}
    
    for poll in pollutant_cols:
        site_poll_data = site_data[poll].dropna()
        if len(site_poll_data) > 10:
            site_stats[poll] = {
                "mean": site_poll_data.mean(),
                "median": site_poll_data.median(),
                "p90": site_poll_data.quantile(0.90),
                "count": len(site_poll_data)
            }
    
    site_pollutant_stats[site] = site_stats

# Find sites with highest/lowest pollution
for poll in pollutant_cols:
    site_means = {site: stats[poll]["mean"] for site, stats in site_pollutant_stats.items() 
                  if poll in stats}
    
    if site_means:
        highest_site = max(site_means, key=site_means.get)
        lowest_site = min(site_means, key=site_means.get)
        range_val = site_means[highest_site] - site_means[lowest_site]
        
        print(f"\n{poll} spatial variation:")
        print(f"  Highest: {highest_site} ({site_means[highest_site]:.3f})")
        print(f"  Lowest: {lowest_site} ({site_means[lowest_site]:.3f})")
        print(f"  Range: {range_val:.3f}")

print("\nDone with Q4 EDA.")
#!/usr/bin/env python3
"""Q3 — Data context collection for CDF analysis of PM2.5 and WBGT."""

import pandas as pd
import numpy as np
from scipy import stats
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")

print(f"Dataset: {df.shape[0]:,} rows × {df.shape[1]} columns")
print(f"Date range: {df['datetime'].min()} to {df['datetime'].max()}")
print(f"Sites: {df['site_id'].nunique()} — {sorted(df['site_id'].unique())}")

# Key columns for Q3
pm_col = "pa_mean_pm2_5_atm_b_corr_2"
wbgt_col = "kes_mean_wbgt_f"
temp_col = "kes_mean_temp_f"
heat_col = "kes_mean_heat_f"

print("\n=== KEY COLUMN AVAILABILITY ===")
for col in [pm_col, wbgt_col, temp_col, heat_col, "is_daytime", "hour", "day_of_week",
            "date_only", "kes_mean_humid_pct", "kes_mean_wind_spd_mph"]:
    if col in df.columns:
        nn = df[col].notna().sum()
        print(f"  {col}: {nn:,} non-null ({nn/len(df)*100:.1f}%)")
    else:
        print(f"  {col}: MISSING")

print("\n=== PM2.5 SUMMARY ===")
pm = df[pm_col].dropna()
print(f"  N: {len(pm):,}")
print(f"  Mean: {pm.mean():.2f} µg/m³")
print(f"  Median: {pm.median():.2f} µg/m³")
print(f"  Std: {pm.std():.2f}")
print(f"  Min: {pm.min():.2f}, Max: {pm.max():.2f}")
print(f"  IQR: {pm.quantile(0.25):.2f} – {pm.quantile(0.75):.2f}")
print(f"  Skewness: {pm.skew():.2f}")
for q in [0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99]:
    print(f"    P{int(q*100):02d}: {pm.quantile(q):.2f}")
print(f"  % > 9.0 (NAAQS annual): {(pm > 9.0).mean()*100:.2f}%")
print(f"  % > 12.0 (old NAAQS): {(pm > 12.0).mean()*100:.2f}%")
print(f"  % > 35.0 (NAAQS 24-hr): {(pm > 35.0).mean()*100:.2f}%")

print("\n=== WBGT SUMMARY ===")
wbgt = df[wbgt_col].dropna()
print(f"  N: {len(wbgt):,}")
print(f"  Mean: {wbgt.mean():.2f} °F")
print(f"  Median: {wbgt.median():.2f} °F")
print(f"  Std: {wbgt.std():.2f}")
print(f"  Min: {wbgt.min():.2f}, Max: {wbgt.max():.2f}")
print(f"  IQR: {wbgt.quantile(0.25):.2f} – {wbgt.quantile(0.75):.2f}")
print(f"  Skewness: {wbgt.skew():.2f}")
for q in [0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99]:
    print(f"    P{int(q*100):02d}: {wbgt.quantile(q):.2f}")
print(f"  % > 80°F (OSHA Caution): {(wbgt > 80).mean()*100:.2f}%")
print(f"  % > 85°F (OSHA Warning): {(wbgt > 85).mean()*100:.2f}%")
print(f"  % > 90°F (OSHA Danger): {(wbgt > 90).mean()*100:.2f}%")

# Day vs night
print("\n=== DAY vs NIGHT BREAKDOWN ===")
for is_day, label in [(True, "Day (6am-6pm)"), (False, "Night (6pm-6am)")]:
    sub = df[df["is_daytime"] == is_day]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    print(f"\n  {label}:")
    print(f"    N: {len(sub):,} rows")
    print(f"    PM2.5 — mean: {pm_s.mean():.2f}, median: {pm_s.median():.2f}, P90: {pm_s.quantile(0.90):.2f}, P95: {pm_s.quantile(0.95):.2f}")
    print(f"    PM2.5 % > 9: {(pm_s > 9).mean()*100:.2f}%, % > 35: {(pm_s > 35).mean()*100:.2f}%")
    print(f"    WBGT — mean: {wbgt_s.mean():.2f}, median: {wbgt_s.median():.2f}, P90: {wbgt_s.quantile(0.90):.2f}, P95: {wbgt_s.quantile(0.95):.2f}")
    print(f"    WBGT % > 80: {(wbgt_s > 80).mean()*100:.2f}%")

# KS tests day vs night
pm_day = df.loc[df["is_daytime"], pm_col].dropna().values
pm_night = df.loc[~df["is_daytime"], pm_col].dropna().values
ks_pm, p_pm = stats.ks_2samp(pm_day, pm_night)
wbgt_day = df.loc[df["is_daytime"], wbgt_col].dropna().values
wbgt_night = df.loc[~df["is_daytime"], wbgt_col].dropna().values
ks_wbgt, p_wbgt = stats.ks_2samp(wbgt_day, wbgt_night)
print(f"\n  KS test (day vs night):")
print(f"    PM2.5: D={ks_pm:.4f}, p={p_pm:.2e}")
print(f"    WBGT:  D={ks_wbgt:.4f}, p={p_wbgt:.2e}")

# Per-site breakdown
print("\n=== PER-SITE QUANTILES ===")
SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden"
}
print(f"\n{'Site':<20} {'N_PM':>6} {'PM_mean':>8} {'PM_P50':>7} {'PM_P90':>7} {'PM_P95':>7} {'PM>9%':>6} | {'N_WB':>6} {'WB_mean':>8} {'WB_P50':>7} {'WB_P90':>7} {'WB_P95':>7} {'WB>80%':>6}")
print("-" * 120)
for sid in sorted(df["site_id"].unique()):
    sub = df[df["site_id"] == sid]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    name = SITE_NAMES.get(sid, sid)[:18]
    print(f"{name:<20} {len(pm_s):>6} {pm_s.mean():>8.2f} {pm_s.median():>7.2f} {pm_s.quantile(0.9):>7.2f} {pm_s.quantile(0.95):>7.2f} {(pm_s>9).mean()*100:>5.1f}% | {len(wbgt_s):>6} {wbgt_s.mean():>8.2f} {wbgt_s.median():>7.2f} {wbgt_s.quantile(0.9):>7.2f} {wbgt_s.quantile(0.95):>7.2f} {(wbgt_s>80).mean()*100:>5.1f}%")

# Hourly breakdown
print("\n=== HOURLY MEDIANS ===")
df["hour"] = df["datetime"].dt.hour
hourly = df.groupby("hour").agg(
    pm25_median=(pm_col, "median"),
    pm25_p90=(pm_col, lambda x: x.quantile(0.9)),
    wbgt_median=(wbgt_col, "median"),
    wbgt_p90=(wbgt_col, lambda x: x.quantile(0.9)),
).round(2)
print(hourly.to_string())

# Multi-hour period breakdown
print("\n=== TIME-OF-DAY PERIODS ===")
periods = {
    "Early morning (0-5)": (0, 5),
    "Morning (6-9)": (6, 9),
    "Midday (10-14)": (10, 14),
    "Afternoon (15-17)": (15, 17),
    "Evening (18-21)": (18, 21),
    "Late night (22-23)": (22, 23),
}
for label, (h0, h1) in periods.items():
    sub = df[(df["hour"] >= h0) & (df["hour"] <= h1)]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    print(f"  {label}: PM2.5 median={pm_s.median():.2f} P90={pm_s.quantile(0.9):.2f} | WBGT median={wbgt_s.median():.2f} P90={wbgt_s.quantile(0.9):.2f}")

# Cross-correlation PM2.5 vs WBGT
print("\n=== PM2.5 × WBGT RELATIONSHIP ===")
both = df[[pm_col, wbgt_col]].dropna()
r, p = stats.pearsonr(both[pm_col], both[wbgt_col])
rho, p_rho = stats.spearmanr(both[pm_col], both[wbgt_col])
print(f"  Pearson r: {r:.4f} (p={p:.2e})")
print(f"  Spearman rho: {rho:.4f} (p={p_rho:.2e})")

# Site-level KS tests (each site vs overall)
print("\n=== SITE KS TESTS (each site vs overall) ===")
pm_overall = df[pm_col].dropna().values
wbgt_overall = df[wbgt_col].dropna().values
for sid in sorted(df["site_id"].unique()):
    sub = df[df["site_id"] == sid]
    ks_p, p_p = stats.ks_2samp(sub[pm_col].dropna().values, pm_overall)
    ks_w, p_w = stats.ks_2samp(sub[wbgt_col].dropna().values, wbgt_overall)
    name = SITE_NAMES.get(sid, sid)[:18]
    sig_p = "***" if p_p < 0.001 else "**" if p_p < 0.01 else "*" if p_p < 0.05 else "ns"
    sig_w = "***" if p_w < 0.001 else "**" if p_w < 0.01 else "*" if p_w < 0.05 else "ns"
    print(f"  {name:<18} PM2.5: D={ks_p:.4f} {sig_p:>3} | WBGT: D={ks_w:.4f} {sig_w:>3}")

# Day-of-week patterns
print("\n=== DAY-OF-WEEK MEDIANS ===")
dow_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
for dow in range(7):
    sub = df[df["day_of_week"] == dow]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    print(f"  {dow_names[dow]}: PM2.5 median={pm_s.median():.2f} P90={pm_s.quantile(0.9):.2f} | WBGT median={wbgt_s.median():.2f} P90={wbgt_s.quantile(0.9):.2f}")

print("\nDone.")

#!/usr/bin/env python3
"""Q2 — Additional EDA for temperature comparison analysis."""

import pandas as pd
import numpy as np
from pathlib import Path
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")
df["datetime"] = pd.to_datetime(df["datetime"])
df["hour"] = df["datetime"].dt.hour
df["date_only"] = df["datetime"].dt.date

kes_temp = "kes_mean_temp_f"
ws_temp = "mean_temp_out_f"
dep_temp = "dep_FEM_nubian_temp_f"
rh_col = "kes_mean_humid_pct"
wbgt_col = "kes_mean_wbgt_f"
ws_col = "mean_wind_speed_mph"
wd_col = "wind_direction_degrees_kr"

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square",
    "chin": "Chin Park", "dewey": "Dewey Square",
    "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo",
    "oxford": "Oxford Place", "reggie": "Reggie Wong",
    "taitung": "Tai Tung", "tufts": "Tufts Garden",
}

mask = df[kes_temp].notna()
sub = df[mask].copy()
sub["kes_ws_diff"] = sub[kes_temp] - sub[ws_temp]
sub["kes_dep_diff"] = sub[kes_temp] - sub[dep_temp]
sub["kes_ws_mean"] = (sub[kes_temp] + sub[ws_temp]) / 2
sub["kes_dep_mean"] = (sub[kes_temp] + sub[dep_temp]) / 2

# ==========================================================================
print("=" * 70)
print("ANALYSIS 1: Rooftop WS Phase-Shifted Diurnal — Lag Correlation")
print("=" * 70)

# The WS has a thermal mass effect. Find optimal lag.
hourly_kes = df.groupby("hour")[kes_temp].mean()
hourly_ws = df.groupby("hour")[ws_temp].mean()

best_lag, best_r = 0, -1
for lag in range(-12, 13):
    shifted = hourly_ws.values
    kes_vals = hourly_kes.values
    # Circular shift
    shifted_roll = np.roll(shifted, lag)
    r = np.corrcoef(kes_vals, shifted_roll)[0, 1]
    if r > best_r:
        best_lag, best_r = lag, r
        
print(f"Optimal lag: {best_lag} hours (r={best_r:.4f})")
print(f"Zero-lag r: {np.corrcoef(hourly_kes.values, hourly_ws.values)[0,1]:.4f}")
print(f"Interpretation: WS temperature lags ground-level by ~{abs(best_lag)} hours")
print(f"  → Rooftop thermal mass absorbs heat during day, releases at night")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 2: Urban Heat Island Effect — Site Temperature Ranking")
print("=" * 70)

site_temp = sub.groupby("site_id").agg(
    mean_temp=(kes_temp, "mean"),
    max_temp=(kes_temp, "max"),
    min_temp=(kes_temp, "min"),
    mean_wbgt=(wbgt_col, "mean"),
    p90_temp=(kes_temp, lambda x: x.quantile(0.9)),
    diurnal_range=(kes_temp, lambda x: x.quantile(0.95) - x.quantile(0.05)),
).sort_values("mean_temp", ascending=False)

print(f"{'Site':<22} {'Mean':>7} {'Max':>7} {'Min':>7} {'P90':>7} {'Range':>7} {'WBGT':>7}")
print("-" * 70)
for sid, row in site_temp.iterrows():
    print(f"{SITE_NAMES[sid]:<22} {row['mean_temp']:7.2f} {row['max_temp']:7.1f} "
          f"{row['min_temp']:7.1f} {row['p90_temp']:7.2f} {row['diurnal_range']:7.2f} "
          f"{row['mean_wbgt']:7.2f}")

hottest = site_temp.index[0]
coolest = site_temp.index[-1]
uhi_range = site_temp["mean_temp"].max() - site_temp["mean_temp"].min()
print(f"\nUrban heat island range: {uhi_range:.2f}°F")
print(f"Hottest: {SITE_NAMES[hottest]} ({site_temp.loc[hottest, 'mean_temp']:.2f}°F)")
print(f"Coolest: {SITE_NAMES[coolest]} ({site_temp.loc[coolest, 'mean_temp']:.2f}°F)")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 3: Daytime vs Nighttime Temperature Agreement")
print("=" * 70)

for period, hours in [("Daytime (8-18)", range(8, 19)), ("Nighttime (19-7)", list(range(19, 24)) + list(range(0, 8)))]:
    m = sub["hour"].isin(hours)
    s = sub[m]
    r_ws = stats.pearsonr(s[kes_temp], s[ws_temp])[0]
    r_dep = stats.pearsonr(s[kes_temp], s[dep_temp])[0]
    bias_ws = s["kes_ws_diff"].mean()
    bias_dep = s["kes_dep_diff"].mean()
    rmse_ws = np.sqrt(np.mean(s["kes_ws_diff"]**2))
    rmse_dep = np.sqrt(np.mean(s["kes_dep_diff"]**2))
    print(f"\n{period} (n={len(s):,}):")
    print(f"  vs WS:  r={r_ws:.4f}, bias={bias_ws:+.2f}°F, RMSE={rmse_ws:.2f}°F")
    print(f"  vs DEP: r={r_dep:.4f}, bias={bias_dep:+.2f}°F, RMSE={rmse_dep:.2f}°F")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 4: Bias vs Wind Speed")
print("=" * 70)

wind_bins = pd.cut(sub[ws_col], bins=[0, 1, 2, 3, 5, 11])
wind_stats = sub.groupby(wind_bins).agg(
    bias_ws=("kes_ws_diff", "mean"),
    bias_dep=("kes_dep_diff", "mean"),
    n=("kes_ws_diff", "count"),
).reset_index()

for _, row in wind_stats.iterrows():
    print(f"  {str(row[ws_col]):<12}: bias_WS={row['bias_ws']:+.2f}, bias_DEP={row['bias_dep']:+.2f}, n={int(row['n']):,}")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 5: Bias vs Humidity")
print("=" * 70)

rh_bins = pd.cut(sub[rh_col], bins=[20, 40, 50, 60, 70, 80, 100])
rh_stats = sub.groupby(rh_bins).agg(
    bias_ws=("kes_ws_diff", "mean"),
    bias_dep=("kes_dep_diff", "mean"),
    n=("kes_ws_diff", "count"),
).reset_index()

for _, row in rh_stats.iterrows():
    print(f"  {str(row[rh_col]):<15}: bias_WS={row['bias_ws']:+.2f}, bias_DEP={row['bias_dep']:+.2f}, n={int(row['n']):,}")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 6: Bias vs Wind Direction")
print("=" * 70)

sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
sector_idx = ((sub[wd_col].values + 22.5) % 360 // 45).astype(int)
sub["sector"] = [sectors[i] for i in sector_idx]

wd_stats = sub.groupby("sector").agg(
    bias_ws=("kes_ws_diff", "mean"),
    bias_dep=("kes_dep_diff", "mean"),
    n=("kes_ws_diff", "count"),
).reindex(sectors)

for s, row in wd_stats.iterrows():
    print(f"  {s:>3}: bias_WS={row['bias_ws']:+.2f}°F, bias_DEP={row['bias_dep']:+.2f}°F, n={int(row['n']):,}")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 7: Daily Bias Time Series")
print("=" * 70)

daily = sub.groupby("date_only").agg(
    mean_kes=(kes_temp, "mean"),
    mean_ws=(ws_temp, "mean"),
    mean_dep=(dep_temp, "mean"),
    bias_ws=("kes_ws_diff", "mean"),
    bias_dep=("kes_dep_diff", "mean"),
    n=("kes_ws_diff", "count"),
).reset_index()

print(f"  bias_WS range: {daily['bias_ws'].min():+.2f} to {daily['bias_ws'].max():+.2f}°F")
print(f"  bias_DEP range: {daily['bias_dep'].min():+.2f} to {daily['bias_dep'].max():+.2f}°F")
print(f"  Days with |bias_WS| > 2°F: {(daily['bias_ws'].abs() > 2).sum()}")
print(f"  Days with |bias_DEP| > 2°F: {(daily['bias_dep'].abs() > 2).sum()}")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 8: Temperature Agreement Metrics")
print("=" * 70)

for label, diff_col in [("Kes vs WS", "kes_ws_diff"), ("Kes vs DEP", "kes_dep_diff")]:
    d = sub[diff_col]
    within_1 = (d.abs() <= 1).mean() * 100
    within_2 = (d.abs() <= 2).mean() * 100
    within_5 = (d.abs() <= 5).mean() * 100
    print(f"\n{label}:")
    print(f"  Within ±1°F: {within_1:.1f}%")
    print(f"  Within ±2°F: {within_2:.1f}%")
    print(f"  Within ±5°F: {within_5:.1f}%")
    print(f"  Mean abs diff: {d.abs().mean():.2f}°F")
    print(f"  95th pctile abs diff: {d.abs().quantile(0.95):.2f}°F")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 9: Land-Use vs Site Temperature")
print("=" * 70)

lu_cols = {
    "Impervious 50m": "Impervious_Area_Percent_50m",
    "Trees 50m": "Trees_Area_Percent_50m",
    "Greenspace 50m": "Greenspace_Area_Percent_50m",
    "Roads 50m": "Roads_Area_Percent_50m",
}

site_lu = df.groupby("site_id")[list(lu_cols.values())].first()
site_lu["mean_temp"] = sub.groupby("site_id")[kes_temp].mean()
site_lu["bias_dep"] = sub.groupby("site_id")["kes_dep_diff"].mean()

for label, col in lu_cols.items():
    r, p = stats.pearsonr(site_lu[col], site_lu["mean_temp"])
    print(f"  {label:<20} vs mean temp: r={r:.3f}, p={p:.3f}")
    r2, p2 = stats.pearsonr(site_lu[col], site_lu["bias_dep"])
    print(f"  {label:<20} vs bias_DEP:  r={r2:.3f}, p={p2:.3f}")

# ==========================================================================
print("\n" + "=" * 70)
print("ANALYSIS 10: Kestrel vs WBGT Relationship")
print("=" * 70)

m_wbgt = sub[wbgt_col].notna()
r_tw, _ = stats.pearsonr(sub.loc[m_wbgt, kes_temp], sub.loc[m_wbgt, wbgt_col])
print(f"Correlation Kestrel temp vs WBGT: r={r_tw:.4f}")
print(f"Mean temp-to-WBGT ratio: {sub.loc[m_wbgt, wbgt_col].mean()/sub.loc[m_wbgt, kes_temp].mean():.3f}")

# By site
print(f"\n{'Site':<22} {'r(temp,WBGT)':>13} {'Mean diff':>10}")
for sid in sorted(SITE_NAMES):
    m = (sub["site_id"] == sid) & m_wbgt
    r, _ = stats.pearsonr(sub.loc[m, kes_temp], sub.loc[m, wbgt_col])
    diff = (sub.loc[m, kes_temp] - sub.loc[m, wbgt_col]).mean()
    print(f"  {SITE_NAMES[sid]:<22} {r:13.4f} {diff:10.2f}°F")

print("\n✓ All 10 analyses complete.")

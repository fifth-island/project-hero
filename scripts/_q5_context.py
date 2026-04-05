#!/usr/bin/env python3
"""Q5 — Data context collection for hottest days WBGT analysis."""

import pandas as pd
import numpy as np
from scipy import stats
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")

wbgt_col = "kes_mean_wbgt_f"
temp_col = "kes_mean_temp_f"
heat_col = "kes_mean_heat_f"
humid_col = "kes_mean_humid_pct"

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden"
}

print(f"Dataset: {df.shape[0]:,} rows × {df.shape[1]} cols")
print(f"Date range: {df['datetime'].min()} – {df['datetime'].max()}")
print(f"Columns: {list(df.columns)}")

# === Daily WBGT === 
daily = df.groupby("date_only").agg(
    wbgt_mean=(wbgt_col, "mean"),
    wbgt_max=(wbgt_col, "max"),
    wbgt_p90=(wbgt_col, lambda x: x.quantile(0.9)),
    temp_mean=(temp_col, "mean"),
    temp_max=(temp_col, "max"),
    humid_mean=(humid_col, "mean"),
    n_obs=(wbgt_col, "count"),
).round(2)

print("\n=== ALL DAILY WBGT (sorted by mean desc) ===")
daily_sorted = daily.sort_values("wbgt_mean", ascending=False)
print(daily_sorted.to_string())

# Top 5 hottest days
top5_dates = daily_sorted.head(5).index.tolist()
print(f"\n=== TOP 5 HOTTEST DAYS (by mean WBGT) ===")
for d in top5_dates:
    row = daily.loc[d]
    print(f"  {d}: WBGT mean={row['wbgt_mean']:.2f}, max={row['wbgt_max']:.2f}, P90={row['wbgt_p90']:.2f}, Temp mean={row['temp_mean']:.2f}, Humid={row['humid_mean']:.1f}%")

# Also check top 5 by max WBGT
top5_max = daily.sort_values("wbgt_max", ascending=False).head(5)
print(f"\n=== TOP 5 by MAX WBGT ===")
print(top5_max[["wbgt_max", "wbgt_mean", "temp_max"]].to_string())

# === Hot days filter ===
hot_days = df[df["date_only"].isin(top5_dates)].copy()
n_hot = len(hot_days)
print(f"\n=== HOT DAYS SUBSET: {n_hot:,} records ===")

# Per-site WBGT on hot days
print("\n=== SITE-LEVEL WBGT ON HOT DAYS ===")
site_hot = hot_days.groupby("site_id").agg(
    wbgt_mean=(wbgt_col, "mean"),
    wbgt_max=(wbgt_col, "max"),
    wbgt_p90=(wbgt_col, lambda x: x.quantile(0.9)),
    wbgt_p50=(wbgt_col, "median"),
    temp_mean=(temp_col, "mean"),
    humid_mean=(humid_col, "mean"),
    n=(wbgt_col, "count"),
).round(2)
site_hot = site_hot.sort_values("wbgt_mean", ascending=False)
for sid in site_hot.index:
    row = site_hot.loc[sid]
    name = SITE_NAMES.get(sid, sid)
    print(f"  {name:<18}: WBGT mean={row['wbgt_mean']:.2f}, max={row['wbgt_max']:.2f}, P90={row['wbgt_p90']:.2f}, Temp={row['temp_mean']:.1f}°F, Humid={row['humid_mean']:.1f}%, N={int(row['n'])}")

# IQR spread on hot days by site
print("\n=== SITE WBGT SPREAD ON HOT DAYS (IQR) ===")
for sid in sorted(df["site_id"].unique()):
    s = hot_days.loc[hot_days["site_id"]==sid, wbgt_col].dropna()
    print(f"  {SITE_NAMES[sid]:<18}: Q25={s.quantile(0.25):.1f}, Q75={s.quantile(0.75):.1f}, IQR={s.quantile(0.75)-s.quantile(0.25):.1f}")

# === Kruskal-Wallis and post-hoc pairwise Dunn's test approximation ===
print("\n=== KRUSKAL-WALLIS (hot days only) ===")
groups = [hot_days.loc[hot_days["site_id"]==s, wbgt_col].dropna().values for s in sorted(df["site_id"].unique())]
H, p = stats.kruskal(*groups)
print(f"  H={H:.2f}, p={p:.2e}")

# Pairwise Mann-Whitney U
print("\n=== PAIRWISE MANN-WHITNEY (hot days) — significant pairs ===")
sites = sorted(df["site_id"].unique())
sig_pairs = []
for i in range(len(sites)):
    for j in range(i+1, len(sites)):
        u, p = stats.mannwhitneyu(
            hot_days.loc[hot_days["site_id"]==sites[i], wbgt_col].dropna(),
            hot_days.loc[hot_days["site_id"]==sites[j], wbgt_col].dropna(),
            alternative="two-sided"
        )
        if p < 0.05:
            sig_pairs.append((SITE_NAMES[sites[i]], SITE_NAMES[sites[j]], u, p))
print(f"  {len(sig_pairs)} of 66 pairs significant at p<0.05")
sig_pairs.sort(key=lambda x: x[3])
for s1, s2, u, p in sig_pairs[:10]:
    print(f"    {s1} vs {s2}: U={u:.0f}, p={p:.4f}")

# === Diurnal profile on hot days ===
print("\n=== DIURNAL WBGT ON HOT DAYS (all-site mean) ===")
hourly = hot_days.groupby("hour")[wbgt_col].agg(["mean","median","max","min"]).round(2)
print(hourly.to_string())

# Peak hour by site
print("\n=== PEAK WBGT HOUR BY SITE (hot days) ===")
for sid in sorted(df["site_id"].unique()):
    s = hot_days[hot_days["site_id"]==sid].groupby("hour")[wbgt_col].mean()
    peak_hr = s.idxmax()
    print(f"  {SITE_NAMES[sid]:<18}: Peak hour={peak_hr}, WBGT={s[peak_hr]:.2f}")

# === Hot vs non-hot comparison ===
print("\n=== HOT DAYS vs ALL OTHER DAYS ===")
non_hot = df[~df["date_only"].isin(top5_dates)]
for var, col in [("WBGT", wbgt_col), ("Temp", temp_col), ("Humidity", humid_col)]:
    hot_v = hot_days[col].dropna()
    non_v = non_hot[col].dropna()
    print(f"  {var}: Hot mean={hot_v.mean():.2f} vs Non-hot mean={non_v.mean():.2f}, diff={hot_v.mean()-non_v.mean():.2f}")

# === Wind patterns on hot days ===
ws_wind = "mean_wind_speed_mph"
ws_dir = "wind_direction_degrees_kr"
if ws_wind in df.columns:
    print("\n=== WIND ON HOT DAYS ===")
    hot_wind = hot_days[ws_wind].dropna()
    non_wind = non_hot[ws_wind].dropna()
    print(f"  Wind speed (hot): mean={hot_wind.mean():.2f} mph")
    print(f"  Wind speed (non-hot): mean={non_wind.mean():.2f} mph")
if ws_dir in df.columns:
    hot_dir = hot_days[ws_dir].dropna()
    print(f"  Wind direction (hot): mean={hot_dir.mean():.1f}°, median={hot_dir.median():.1f}°")

# === Land-use correlations with site-mean WBGT on hot days ===
print("\n=== LAND-USE vs SITE MEAN WBGT (hot days) ===")
lu_cols = [c for c in df.columns if any(x in c for x in ["Impervious","Trees","Greenspace","Roads","Industrial"])]
print(f"  Land-use columns: {lu_cols}")

site_stats = []
for sid in sorted(df["site_id"].unique()):
    sub = hot_days[hot_days["site_id"]==sid]
    row = {"site": sid, "wbgt_mean": sub[wbgt_col].mean(), "wbgt_max": sub[wbgt_col].max()}
    for lc in lu_cols:
        if lc in sub.columns:
            row[lc] = sub[lc].iloc[0] if len(sub) > 0 else np.nan
    site_stats.append(row)
site_df = pd.DataFrame(site_stats)

for lc in lu_cols:
    if site_df[lc].notna().sum() >= 3:
        for metric in ["wbgt_mean", "wbgt_max"]:
            r, p = stats.pearsonr(site_df[lc].dropna(), site_df[metric].dropna())
            if abs(r) > 0.4 or p < 0.1:
                print(f"  {lc} vs {metric}: r={r:.3f} (p={p:.3f})")

# === EPA data during hot days ===
epa_path = ROOT / "data/epa/epa_hourly_boston.parquet"
if epa_path.exists():
    epa = pd.read_parquet(epa_path)
    print(f"\n=== EPA DATA ===")
    print(f"  Shape: {epa.shape}")
    print(f"  Columns: {list(epa.columns)}")
    print(f"  Date range: {epa.iloc[:,0].min()} – {epa.iloc[:,0].max()}")
    # Try to filter to hot days
    for col in epa.columns:
        if "date" in col.lower() or "time" in col.lower():
            print(f"  Date col candidate: {col}, sample: {epa[col].iloc[:3].tolist()}")

# === Heat index vs WBGT relationship on hot days ===
print("\n=== HEAT INDEX vs WBGT (hot days) ===")
hi = hot_days[[heat_col, wbgt_col]].dropna()
r, p = stats.pearsonr(hi[heat_col], hi[wbgt_col])
print(f"  Pearson r: {r:.4f} (p={p:.2e})")
print(f"  Heat Index range: {hi[heat_col].min():.1f} – {hi[heat_col].max():.1f}°F")
print(f"  WBGT range: {hi[wbgt_col].min():.1f} – {hi[wbgt_col].max():.1f}°F")
print(f"  HI-WBGT gap: mean={( hi[heat_col] - hi[wbgt_col]).mean():.1f}°F, max={( hi[heat_col] - hi[wbgt_col]).max():.1f}°F")

# === Per-day per-site WBGT table ===
print("\n=== DAY × SITE WBGT MEANS ===")
pivot = hot_days.pivot_table(values=wbgt_col, index="site_id", columns="date_only", aggfunc="mean").round(2)
pivot.index = [SITE_NAMES.get(s, s) for s in pivot.index]
print(pivot.to_string())

# Range across sites per day
print("\n=== INTER-SITE RANGE PER HOT DAY ===")
for d in top5_dates:
    day_data = hot_days[hot_days["date_only"]==d].groupby("site_id")[wbgt_col].mean()
    print(f"  {d}: range={day_data.max()-day_data.min():.2f}°F, hottest={SITE_NAMES[day_data.idxmax()]}, coolest={SITE_NAMES[day_data.idxmin()]}")

print("\nDone.")

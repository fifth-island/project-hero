#!/usr/bin/env python3
"""Q5 — Additional EDA: deeper hot-day WBGT analysis."""

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
pm_col = "pa_mean_pm2_5_atm_b_corr_2"

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden"
}

daily = df.groupby("date_only")[wbgt_col].mean()
top5_dates = daily.nlargest(5).index.tolist()
hot = df[df["date_only"].isin(top5_dates)].copy()

# ============================================================
# 1. Rate of WBGT rise in the morning on hot days
# ============================================================
print("=== 1. MORNING WBGT RISE RATE ON HOT DAYS ===")
for sid in sorted(df["site_id"].unique()):
    s = hot[(hot["site_id"]==sid) & (hot["hour"].between(6,15))].groupby("hour")[wbgt_col].mean()
    if len(s) >= 5:
        rise = s.max() - s.min()
        peak_hr = s.idxmax()
        rate = rise / (peak_hr - 6) if peak_hr > 6 else 0
        print(f"  {SITE_NAMES[sid]:<18}: rise={rise:.1f}°F over {peak_hr-6}h, rate={rate:.2f}°F/hr, peak@{peak_hr}")

# ============================================================
# 2. Nighttime WBGT retention (urban heat island at night)
# ============================================================
print("\n=== 2. NIGHTTIME WBGT (10pm-5am) ON HOT DAYS ===")
night_hot = hot[hot["hour"].isin([22,23,0,1,2,3,4,5])]
for sid in sorted(df["site_id"].unique()):
    s = night_hot.loc[night_hot["site_id"]==sid, wbgt_col].dropna()
    if len(s) > 0:
        print(f"  {SITE_NAMES[sid]:<18}: mean={s.mean():.2f}, min={s.min():.1f}")

# Compare nighttime WBGT on hot days vs non-hot days
non_hot = df[~df["date_only"].isin(top5_dates)]
night_nonhot = non_hot[non_hot["hour"].isin([22,23,0,1,2,3,4,5])]
print(f"\n  Overall night WBGT: Hot days={night_hot[wbgt_col].mean():.2f}, Non-hot={night_nonhot[wbgt_col].mean():.2f}, diff={night_hot[wbgt_col].mean()-night_nonhot[wbgt_col].mean():.2f}")

# ============================================================
# 3. Humidity decomposition: why WBGT differs from temp
# ============================================================
print("\n=== 3. WBGT DECOMPOSITION ON HOT DAYS ===")
for sid in sorted(df["site_id"].unique()):
    s = hot[hot["site_id"]==sid]
    wbgt_m = s[wbgt_col].mean()
    temp_m = s[temp_col].mean()
    hum_m = s[humid_col].mean()
    gap = temp_m - wbgt_m
    print(f"  {SITE_NAMES[sid]:<18}: WBGT={wbgt_m:.1f}, Temp={temp_m:.1f}, Gap={gap:.1f}, Humid={hum_m:.1f}%")

# Sites with DIFFERENT rankings for temp vs WBGT
print("\n  Rank comparison (WBGT vs Temp on hot days):")
site_data = []
for sid in sorted(df["site_id"].unique()):
    s = hot[hot["site_id"]==sid]
    site_data.append({"site": sid, "wbgt": s[wbgt_col].mean(), "temp": s[temp_col].mean()})
sdf = pd.DataFrame(site_data)
sdf["wbgt_rank"] = sdf["wbgt"].rank(ascending=False).astype(int)
sdf["temp_rank"] = sdf["temp"].rank(ascending=False).astype(int)
sdf["rank_change"] = sdf["temp_rank"] - sdf["wbgt_rank"]
for _, row in sdf.iterrows():
    if abs(row["rank_change"]) >= 2:
        print(f"  {SITE_NAMES[row['site']]}: WBGT rank={row['wbgt_rank']}, Temp rank={row['temp_rank']}, shift={row['rank_change']:+d}")

# ============================================================
# 4. heat wave structure: consecutive hot days
# ============================================================
print("\n=== 4. HEAT WAVE STRUCTURE ===")
all_dates = sorted(df["date_only"].unique())
top10_dates = daily.nlargest(10).index.tolist()
print(f"  Top 10 hottest dates: {sorted(top10_dates)}")
# Check for runs
top10_pd = [pd.Timestamp(d) for d in top10_dates]
top10_set = set(top10_pd)
for d in sorted(top10_pd):
    prev = d - pd.Timedelta(days=1)
    next_d = d + pd.Timedelta(days=1)
    in_run = (prev in top10_set) or (next_d in top10_set)
    daily_mean = daily.get(d.strftime("%Y-%m-%d"), daily.get(d, 0))
    print(f"  {d.date()}: WBGT={daily_mean:.2f}, consecutive={'Yes' if in_run else 'No'}")

# ============================================================
# 5. PM2.5 on hot days (co-exposure)
# ============================================================
print("\n=== 5. PM2.5 ON HOT DAYS (co-exposure) ===")
hot_pm = hot[pm_col].dropna()
nonhot_pm = non_hot[pm_col].dropna()
print(f"  Hot days PM2.5: mean={hot_pm.mean():.2f}, P90={hot_pm.quantile(0.9):.2f}")
print(f"  Non-hot PM2.5:  mean={nonhot_pm.mean():.2f}, P90={nonhot_pm.quantile(0.9):.2f}")
print(f"  Diff: {hot_pm.mean()-nonhot_pm.mean():.2f} µg/m³ ({(hot_pm.mean()-nonhot_pm.mean())/nonhot_pm.mean()*100:.1f}%)")

# Dual exposure on hot days
dual = hot[(hot[pm_col] > 9) & (hot[wbgt_col] > 70)]
print(f"  Dual exposure (PM2.5>9 AND WBGT>70) on hot days: {len(dual):,} records ({len(dual)/len(hot)*100:.1f}%)")

# ============================================================
# 6. Site ranking consistency
# ============================================================
print("\n=== 6. SITE RANKING CONSISTENCY ACROSS HOT DAYS ===")
site_ranks = {}
for d in top5_dates:
    day_means = hot[hot["date_only"]==d].groupby("site_id")[wbgt_col].mean()
    ranks = day_means.rank(ascending=False)
    for sid, r in ranks.items():
        site_ranks.setdefault(sid, []).append(r)

print(f"{'Site':<18} {'Ranks':>30} {'Mean Rank':>10} {'Std':>6}")
for sid in sorted(site_ranks.keys()):
    ranks = site_ranks[sid]
    print(f"  {SITE_NAMES[sid]:<18} {str([int(r) for r in ranks]):>30} {np.mean(ranks):>9.1f} {np.std(ranks):>5.1f}")

# ============================================================
# 7. Threshold analysis: hours above specific WBGT levels
# ============================================================
print("\n=== 7. HOURS ABOVE THRESHOLDS (hot days) ===")
for thresh in [70, 72, 74, 75]:
    n_above = (hot[wbgt_col] > thresh).sum()
    pct = n_above / len(hot) * 100
    print(f"  WBGT > {thresh}°F: {n_above:,} records ({pct:.1f}%), ~{n_above/6:.0f} site-hours")

# By site
print(f"\n  Hours > 74°F by site:")
for sid in sorted(df["site_id"].unique()):
    s = hot.loc[hot["site_id"]==sid, wbgt_col]
    n_above = (s > 74).sum()
    print(f"    {SITE_NAMES[sid]:<18}: {n_above} records ({n_above/len(s)*100:.1f}%)")

# ============================================================
# 8. How do hot days compare to OSHA advisory benchmarks?
# ============================================================
print("\n=== 8. OSHA BENCHMARK CONTEXT ===")
print(f"  Max WBGT in entire study: {df[wbgt_col].max():.1f}°F")
print(f"  Max WBGT on hot days: {hot[wbgt_col].max():.1f}°F")
print(f"  OSHA Caution (80°F): NEVER REACHED")
print(f"  Gap to OSHA Caution: {80 - hot[wbgt_col].max():.1f}°F")
# Heat index comparison
print(f"  Max Heat Index on hot days: {hot[heat_col].max():.1f}°F")
print(f"  Heat Index > 100°F: {(hot[heat_col] > 100).sum()} records ({(hot[heat_col] > 100).sum()/len(hot)*100:.1f}%)")
print(f"  Heat Index > 105°F: {(hot[heat_col] > 105).sum()} records")

# ============================================================
# 9. Spatial clustering (nearby sites similar WBGT?)
# ============================================================
print("\n=== 9. SITE LATITUDE/LONGITUDE ===")
# Check if lat/long available
lat_cols = [c for c in df.columns if "lat" in c.lower() or "lon" in c.lower() or "lng" in c.lower()]
print(f"  Lat/lon columns: {lat_cols}")
# If none, use site-level grouping to check geographic proximity via correlation
print("  Correlation matrix of site WBGT on hot days:")
pivot = hot.pivot_table(values=wbgt_col, index="datetime", columns="site_id", aggfunc="mean")
corr = pivot.corr().round(3)
# Print top and bottom correlations
pairs = []
for i, s1 in enumerate(corr.columns):
    for j, s2 in enumerate(corr.columns):
        if i < j:
            pairs.append((SITE_NAMES.get(s1,s1), SITE_NAMES.get(s2,s2), corr.iloc[i,j]))
pairs.sort(key=lambda x: x[2])
print("  Most different pairs:")
for s1, s2, r in pairs[:5]:
    print(f"    {s1} vs {s2}: r={r:.3f}")
print("  Most similar pairs:")
for s1, s2, r in pairs[-5:]:
    print(f"    {s1} vs {s2}: r={r:.3f}")

# ============================================================
# 10. Effect size: Cohen's d for hottest vs coolest site
# ============================================================
print("\n=== 10. EFFECT SIZES ===")
hottest_site = "tufts"
coolest_site = "msh"
s1 = hot.loc[hot["site_id"]==hottest_site, wbgt_col].dropna()
s2 = hot.loc[hot["site_id"]==coolest_site, wbgt_col].dropna()
pooled_std = np.sqrt((s1.std()**2 + s2.std()**2) / 2)
cohens_d = (s1.mean() - s2.mean()) / pooled_std
print(f"  Tufts vs Mary Soo Hoo: diff={s1.mean()-s2.mean():.2f}°F, Cohen's d={cohens_d:.3f}")
print(f"  Interpretation: {'large' if abs(cohens_d) > 0.8 else 'medium' if abs(cohens_d) > 0.5 else 'small'} effect")

# Overall hottest site vs rest
rest = hot.loc[hot["site_id"]!=hottest_site, wbgt_col].dropna()
d2 = (s1.mean() - rest.mean()) / np.sqrt((s1.std()**2 + rest.std()**2) / 2)
print(f"  Tufts vs all others: diff={s1.mean()-rest.mean():.2f}°F, Cohen's d={d2:.3f}")

print("\nDone.")

#!/usr/bin/env python3
"""Q1 data context collection — temporary diagnostic script."""
import pandas as pd, numpy as np

df = pd.read_parquet("data/clean/data_HEROS_clean.parquet")

print("ALL COLUMNS:")
for i, c in enumerate(df.columns):
    print(f"  {i:2d}. {c} ({df[c].dtype}, {df[c].notna().sum()} non-null)")

print("\nQ1 RELEVANT SUMMARY STATS:")
q1_cols = ["pa_mean_pm2_5_atm_b_corr_2", "dep_FEM_chinatown_pm2_5_ug_m3",
           "dep_FEM_nubian_pm2_5_ug_m3", "epa_pm25_fem", "kes_mean_humid_pct"]
for c in q1_cols:
    s = df[c].describe()
    print(f"  {c}: mean={s['mean']:.2f}, std={s['std']:.2f}, min={s['min']:.2f}, "
          f"max={s['max']:.2f}, n={int(s['count'])}")

print("\nGeographic columns:", [c for c in df.columns if "lat" in c.lower() or "lon" in c.lower()])

print("\nObservations per site:")
print(df["site_id"].value_counts().sort_index().to_string())

print(f"\nDate range: {df['datetime'].min()} to {df['datetime'].max()}")
print(f"Unique dates: {df['date_only'].nunique()}")

pa = "pa_mean_pm2_5_atm_b_corr_2"
dep_ct = "dep_FEM_chinatown_pm2_5_ug_m3"
dep_nub = "dep_FEM_nubian_pm2_5_ug_m3"
epa = "epa_pm25_fem"

print("\nPairwise completeness:")
for ref_name, ref_col in [("DEP CT", dep_ct), ("DEP Nub", dep_nub), ("EPA PM25", epa)]:
    both = df[pa].notna() & df[ref_col].notna()
    print(f"  PA + {ref_name}: {both.sum()} paired obs")

mask = df[pa].notna() & df[dep_ct].notna()
sub = df[mask].copy()
sub["diff"] = sub[pa] - sub[dep_ct]

print("\nPA-DEP CT bias by daytime:")
print(sub.groupby("is_daytime")["diff"].agg(["mean", "std", "count"]).to_string())

print("\nPA-DEP CT bias by hour (mean diff):")
print(sub.groupby("hour")["diff"].mean().to_string())

print("\nPA-DEP CT bias by site:")
for sid in sorted(sub["site_id"].unique()):
    s = sub[sub["site_id"] == sid]["diff"]
    print(f"  {sid:20s}: mean_diff={s.mean():+.3f}, std={s.std():.3f}, n={len(s)}")

# Check for wind/met columns useful for Q1
print("\nMeteorological columns available:")
met_cols = [c for c in df.columns if any(k in c.lower() for k in ["wind", "humid", "temp", "wbgt"])]
for c in met_cols:
    print(f"  {c}: {df[c].notna().sum()} non-null")

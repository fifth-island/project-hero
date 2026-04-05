#!/usr/bin/env python3
"""Q1 — Additional EDA: deeper patterns for PM2.5 sensor comparison."""
import pandas as pd, numpy as np
from scipy import stats

df = pd.read_parquet("data/clean/data_HEROS_clean.parquet")

pa = "pa_mean_pm2_5_atm_b_corr_2"
dep_ct = "dep_FEM_chinatown_pm2_5_ug_m3"
dep_nub = "dep_FEM_nubian_pm2_5_ug_m3"
epa = "epa_pm25_fem"
rh = "kes_mean_humid_pct"

mask = df[pa].notna() & df[dep_ct].notna()
sub = df[mask].copy()
sub["diff"] = sub[pa] - sub[dep_ct]
sub["ratio"] = sub[pa] / sub[dep_ct].replace(0, np.nan)

# 1. Bias as function of concentration (binned)
print("=== BIAS BY PM2.5 CONCENTRATION BIN ===")
bins = [0, 5, 10, 15, 20, 30]
sub["pm_bin"] = pd.cut(sub[dep_ct], bins=bins)
g = sub.groupby("pm_bin")["diff"].agg(["mean", "std", "count"])
print(g.to_string())

# 2. Spearman correlation (robustness check)
print("\n=== SPEARMAN CORRELATIONS ===")
for ref_name, ref_col in [("DEP CT", dep_ct), ("DEP Nub", dep_nub), ("EPA", epa)]:
    m = df[pa].notna() & df[ref_col].notna()
    r_s, p_s = stats.spearmanr(df.loc[m, pa], df.loc[m, ref_col])
    r_p, p_p = stats.pearsonr(df.loc[m, pa], df.loc[m, ref_col])
    print(f"  {ref_name}: Pearson r={r_p:.4f}, Spearman rho={r_s:.4f}")

# 3. Daily bias time series
print("\n=== DAILY BIAS (PA - DEP CT) ===")
daily = sub.groupby("date_only").agg(
    mean_pa=(pa, "mean"), mean_dep=(dep_ct, "mean"),
    mean_diff=("diff", "mean"), std_diff=("diff", "std"), n=("diff", "count")
).reset_index()
daily["ci95"] = 1.96 * daily["std_diff"] / np.sqrt(daily["n"])
print(daily[["date_only", "mean_pa", "mean_dep", "mean_diff", "ci95", "n"]].to_string(index=False))

# 4. Bias vs humidity relationship
print("\n=== BIAS vs HUMIDITY (binned) ===")
sub2 = sub[sub[rh].notna()].copy()
rh_bins = [20, 40, 60, 80, 100]
sub2["rh_bin"] = pd.cut(sub2[rh], bins=rh_bins)
g2 = sub2.groupby("rh_bin")["diff"].agg(["mean", "std", "count"])
print(g2.to_string())

# 5. Bias vs wind speed
print("\n=== BIAS vs WIND SPEED (binned) ===")
ws_bins = [0, 1, 2, 3, 5, 10]
sub["ws_bin"] = pd.cut(sub["mean_wind_speed_mph"], bins=ws_bins)
g3 = sub.groupby("ws_bin")["diff"].agg(["mean", "std", "count"])
print(g3.to_string())

# 6. Bias vs wind direction (8 sectors)
print("\n=== BIAS vs WIND DIRECTION (8 sectors) ===")
wd = sub["wind_direction_degrees_kr"].values
sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
sector_idx = ((wd + 22.5) % 360 // 45).astype(int)
sub["wd_sector"] = [sectors[i] for i in sector_idx]
g4 = sub.groupby("wd_sector")["diff"].agg(["mean", "std", "count"])
print(g4.reindex(sectors).to_string())

# 7. Percentage within ±2 and ±5 ug/m3
within2 = (np.abs(sub["diff"]) <= 2).mean() * 100
within5 = (np.abs(sub["diff"]) <= 5).mean() * 100
print(f"\n=== AGREEMENT METRICS ===")
print(f"  Within ±2 µg/m³: {within2:.1f}%")
print(f"  Within ±5 µg/m³: {within5:.1f}%")

# 8. DEP CT vs DEP Nubian correlation (reference-reference check)
m_dep = df[dep_ct].notna() & df[dep_nub].notna()
r_dep, _ = stats.pearsonr(df.loc[m_dep, dep_ct], df.loc[m_dep, dep_nub])
rmse_dep = np.sqrt(np.mean((df.loc[m_dep, dep_ct] - df.loc[m_dep, dep_nub])**2))
print(f"\n=== DEP CT vs DEP NUBIAN (reference check) ===")
print(f"  Pearson r: {r_dep:.4f}")
print(f"  RMSE: {rmse_dep:.3f}")
print(f"  Mean DEP CT: {df[dep_ct].mean():.2f}, Mean DEP Nub: {df[dep_nub].mean():.2f}")

# 9. Check if imputed PA values affect bias
imp_col = "imputed_pa_mean_pm2_5_atm_b_corr_2"
if imp_col in sub.columns:
    print(f"\n=== BIAS: IMPUTED vs ORIGINAL PA VALUES ===")
    for imp_val in [True, False]:
        s = sub[sub[imp_col] == imp_val]["diff"]
        print(f"  imputed={imp_val}: mean_diff={s.mean():+.3f}, std={s.std():.3f}, n={len(s)}")

# 10. Per-site Bland-Altman LOA
print("\n=== SITE-LEVEL BLAND-ALTMAN LOA ===")
for sid in sorted(sub["site_id"].unique()):
    s = sub[sub["site_id"] == sid]["diff"]
    md, sd = s.mean(), s.std(ddof=1)
    print(f"  {sid:20s}: LOA=[{md-1.96*sd:+.2f}, {md+1.96*sd:+.2f}], width={2*1.96*sd:.2f}")

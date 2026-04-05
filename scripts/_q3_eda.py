#!/usr/bin/env python3
"""Q3 — Additional EDA: deeper CDF analysis of PM2.5 and WBGT."""

import pandas as pd
import numpy as np
from scipy import stats
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")

pm_col = "pa_mean_pm2_5_atm_b_corr_2"
wbgt_col = "kes_mean_wbgt_f"
temp_col = "kes_mean_temp_f"
heat_col = "kes_mean_heat_f"

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden"
}

df["hour"] = df["datetime"].dt.hour

# ============================================================
# 1. Four time-of-day period CDFs (more granular than day/night)
# ============================================================
print("=== 1. FOUR-PERIOD CDF COMPARISON ===")
periods = {
    "Night (0-5)": (0, 5),
    "Morning (6-11)": (6, 11),
    "Afternoon (12-17)": (12, 17),
    "Evening (18-23)": (18, 23),
}
for label, (h0, h1) in periods.items():
    sub = df[(df["hour"] >= h0) & (df["hour"] <= h1)]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    print(f"  {label:<20} PM2.5: N={len(pm_s):>5}, mean={pm_s.mean():.2f}, P50={pm_s.median():.2f}, P90={pm_s.quantile(0.9):.2f}, P95={pm_s.quantile(0.95):.2f}")
    print(f"  {'':20} WBGT:  N={len(wbgt_s):>5}, mean={wbgt_s.mean():.2f}, P50={wbgt_s.median():.2f}, P90={wbgt_s.quantile(0.9):.2f}, P95={wbgt_s.quantile(0.95):.2f}")

# KS between all periods
print("\n  Pairwise KS tests between periods:")
period_data = {}
for label, (h0, h1) in periods.items():
    sub = df[(df["hour"] >= h0) & (df["hour"] <= h1)]
    period_data[label] = {
        "pm": sub[pm_col].dropna().values,
        "wbgt": sub[wbgt_col].dropna().values,
    }
labels = list(periods.keys())
for i in range(len(labels)):
    for j in range(i+1, len(labels)):
        ks_p, p_p = stats.ks_2samp(period_data[labels[i]]["pm"], period_data[labels[j]]["pm"])
        ks_w, p_w = stats.ks_2samp(period_data[labels[i]]["wbgt"], period_data[labels[j]]["wbgt"])
        print(f"    {labels[i]} vs {labels[j]}:")
        print(f"      PM2.5: D={ks_p:.4f} p={p_p:.2e}")
        print(f"      WBGT:  D={ks_w:.4f} p={p_w:.2e}")

# ============================================================
# 2. Site pairwise KS matrix
# ============================================================
print("\n=== 2. SITE PAIRWISE KS — PM2.5 ===")
sites_sorted = sorted(df["site_id"].unique())
n_sites = len(sites_sorted)
ks_matrix_pm = np.zeros((n_sites, n_sites))
ks_matrix_wbgt = np.zeros((n_sites, n_sites))
site_pm = {s: df.loc[df["site_id"]==s, pm_col].dropna().values for s in sites_sorted}
site_wbgt = {s: df.loc[df["site_id"]==s, wbgt_col].dropna().values for s in sites_sorted}

pairs_pm = []
for i, s1 in enumerate(sites_sorted):
    for j, s2 in enumerate(sites_sorted):
        if i < j:
            ks, p = stats.ks_2samp(site_pm[s1], site_pm[s2])
            ks_matrix_pm[i,j] = ks
            ks_matrix_pm[j,i] = ks
            pairs_pm.append((SITE_NAMES[s1], SITE_NAMES[s2], ks, p))
            ks2, p2 = stats.ks_2samp(site_wbgt[s1], site_wbgt[s2])
            ks_matrix_wbgt[i,j] = ks2
            ks_matrix_wbgt[j,i] = ks2

# Top 5 most different and most similar pairs
pairs_pm.sort(key=lambda x: x[2], reverse=True)
print("  Top 5 most different PM2.5 pairs:")
for s1, s2, ks, p in pairs_pm[:5]:
    print(f"    {s1} vs {s2}: D={ks:.4f} (p={p:.2e})")
print("  Top 5 most similar PM2.5 pairs:")
for s1, s2, ks, p in pairs_pm[-5:]:
    print(f"    {s1} vs {s2}: D={ks:.4f} (p={p:.2e})")

# ============================================================
# 3. Weekday vs weekend CDFs
# ============================================================
print("\n=== 3. WEEKDAY vs WEEKEND ===")
df["is_weekend"] = df["day_of_week"].isin([5, 6])
for is_wknd, label in [(False, "Weekday"), (True, "Weekend")]:
    sub = df[df["is_weekend"] == is_wknd]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    print(f"  {label}: PM2.5 mean={pm_s.mean():.2f}, P50={pm_s.median():.2f}, P90={pm_s.quantile(0.9):.2f} | WBGT mean={wbgt_s.mean():.2f}, P50={wbgt_s.median():.2f}, P90={wbgt_s.quantile(0.9):.2f}")

pm_wd = df.loc[~df["is_weekend"], pm_col].dropna().values
pm_we = df.loc[df["is_weekend"], pm_col].dropna().values
ks, p = stats.ks_2samp(pm_wd, pm_we)
print(f"  PM2.5 KS: D={ks:.4f} p={p:.2e}")
wbgt_wd = df.loc[~df["is_weekend"], wbgt_col].dropna().values
wbgt_we = df.loc[df["is_weekend"], wbgt_col].dropna().values
ks, p = stats.ks_2samp(wbgt_wd, wbgt_we)
print(f"  WBGT KS:  D={ks:.4f} p={p:.2e}")

# ============================================================
# 4. Joint PM2.5 + WBGT exceedance (dual exposure analysis)
# ============================================================
print("\n=== 4. DUAL EXPOSURE ANALYSIS ===")
both = df[[pm_col, wbgt_col]].dropna()
n_both = len(both)

pm_thresh = [9.0, 12.0, 15.0]
wbgt_thresh = [65.0, 70.0, 75.0]

print(f"  Joint exceedance rates (N={n_both:,}):")
for pt in pm_thresh:
    for wt in wbgt_thresh:
        n_exceed = ((both[pm_col] > pt) & (both[wbgt_col] > wt)).sum()
        pct = n_exceed / n_both * 100
        print(f"    PM2.5 > {pt:.0f} AND WBGT > {wt:.0f}: {n_exceed:>5} ({pct:.2f}%)")

# When is it both conditions?
dual = df[(df[pm_col] > 9) & (df[wbgt_col] > 70)]
if len(dual) > 0:
    print(f"\n  Dual high exposure (PM2.5>9 AND WBGT>70): {len(dual):,} records ({len(dual)/len(df)*100:.2f}%)")
    print(f"  Hour distribution: {dual['hour'].value_counts().sort_index().to_dict()}")
    print(f"  Site distribution: {dual['site_id'].value_counts().head(5).to_dict()}")

# ============================================================
# 5. Quantile regression: how do tails differ between sites?
# ============================================================
print("\n=== 5. TAIL BEHAVIOR BY SITE ===")
print(f"{'Site':<18} {'PM90/PM50':>9} {'PM95/PM50':>9} {'WB90/WB50':>9} {'WB_range':>9}")
for sid in sites_sorted:
    pm_s = df.loc[df["site_id"]==sid, pm_col].dropna()
    wbgt_s = df.loc[df["site_id"]==sid, wbgt_col].dropna()
    pm_ratio90 = pm_s.quantile(0.9) / pm_s.median()
    pm_ratio95 = pm_s.quantile(0.95) / pm_s.median()
    wb_ratio90 = wbgt_s.quantile(0.9) / wbgt_s.median()
    wb_range = wbgt_s.quantile(0.95) - wbgt_s.quantile(0.05)
    print(f"{SITE_NAMES[sid]:<18} {pm_ratio90:>9.2f} {pm_ratio95:>9.2f} {wb_ratio90:>9.2f} {wb_range:>8.1f}°F")

# ============================================================
# 6. Anderson-Darling test for normality and log-normality
# ============================================================
print("\n=== 6. DISTRIBUTION FIT TESTS ===")
for var_name, col in [("PM2.5", pm_col), ("WBGT", wbgt_col)]:
    vals = df[col].dropna().values
    # Test normality (on a sample to avoid slow AD test)
    np.random.seed(42)
    sample = np.random.choice(vals, min(5000, len(vals)), replace=False)
    ad_stat, crit, sig = stats.anderson(sample, "norm")
    print(f"  {var_name} normality test: A²={ad_stat:.4f} (5% crit={crit[2]:.4f}) — {'REJECT' if ad_stat > crit[2] else 'ACCEPT'}")
    
    if var_name == "PM2.5":
        log_sample = np.log(sample[sample > 0])
        ad_log, crit_log, _ = stats.anderson(log_sample, "norm")
        print(f"  log(PM2.5) normality: A²={ad_log:.4f} (5% crit={crit_log[2]:.4f}) — {'REJECT' if ad_log > crit_log[2] else 'ACCEPT'}")

# ============================================================
# 7. Temporal stability: weekly CDFs
# ============================================================
print("\n=== 7. WEEKLY CDF SHIFT ===")
df["week"] = df["datetime"].dt.isocalendar().week.astype(int)
weeks = sorted(df["week"].unique())
print(f"  Weeks in study: {weeks}")
for w in weeks:
    sub = df[df["week"]==w]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    print(f"  Week {w}: N={len(sub):>5} | PM2.5 P50={pm_s.median():.2f}, P90={pm_s.quantile(0.9):.2f} | WBGT P50={wbgt_s.median():.2f}, P90={wbgt_s.quantile(0.9):.2f}")

# KS week vs overall for PM2.5
print("\n  Weekly KS vs overall:")
pm_all = df[pm_col].dropna().values
for w in weeks:
    pm_w = df.loc[df["week"]==w, pm_col].dropna().values
    ks, p = stats.ks_2samp(pm_w, pm_all)
    sig = "***" if p < 0.001 else "ns"
    print(f"    Week {w}: D={ks:.4f} {sig}")

# ============================================================
# 8. Humidity stratification effect on CDFs
# ============================================================
print("\n=== 8. HUMIDITY STRATIFICATION ===")
hum_col = "kes_mean_humid_pct"
df["humid_cat"] = pd.cut(df[hum_col], bins=[0, 50, 70, 85, 100], labels=["Dry (<50%)", "Moderate (50-70%)", "Humid (70-85%)", "Very Humid (>85%)"])
for cat in ["Dry (<50%)", "Moderate (50-70%)", "Humid (70-85%)", "Very Humid (>85%)"]:
    sub = df[df["humid_cat"]==cat]
    pm_s = sub[pm_col].dropna()
    wbgt_s = sub[wbgt_col].dropna()
    if len(pm_s) > 0:
        print(f"  {cat}: N={len(pm_s):>5} | PM2.5 P50={pm_s.median():.2f}, P90={pm_s.quantile(0.9):.2f} | WBGT P50={wbgt_s.median():.2f}, P90={wbgt_s.quantile(0.9):.2f}")

# ============================================================
# 9. Equity metric: which sites have the worst joint exposure?
# ============================================================
print("\n=== 9. EQUITY METRIC: DUAL EXPOSURE BY SITE ===")
results = []
for sid in sites_sorted:
    sub = df[df["site_id"]==sid][[pm_col, wbgt_col]].dropna()
    n_high = ((sub[pm_col] > 9) & (sub[wbgt_col] > 65)).sum()
    pct_high = n_high / len(sub) * 100 if len(sub) > 0 else 0
    pm_p90 = sub[pm_col].quantile(0.9)
    wbgt_p90 = sub[wbgt_col].quantile(0.9)
    # Composite exposure score: normalized PM2.5 P90 + normalized WBGT P90
    results.append((sid, SITE_NAMES[sid], n_high, pct_high, pm_p90, wbgt_p90))

results.sort(key=lambda x: x[3], reverse=True)
print(f"{'Site':<18} {'N_dual':>7} {'%_dual':>7} {'PM_P90':>7} {'WB_P90':>7}")
for sid, name, n, pct, pm90, wb90 in results:
    print(f"{name:<18} {n:>7} {pct:>6.1f}% {pm90:>7.2f} {wb90:>7.2f}")

# ============================================================
# 10. Land-use correlation with CDF percentiles
# ============================================================
print("\n=== 10. LAND-USE vs SITE PERCENTILES ===")
lu_cols = [c for c in df.columns if "Impervious" in c or "Trees" in c or "Greenspace" in c or "Roads" in c or "Industrial" in c]
print(f"  Land-use columns: {lu_cols}")

site_stats = []
for sid in sites_sorted:
    sub = df[df["site_id"]==sid]
    row = {"site": sid}
    row["pm_p90"] = sub[pm_col].quantile(0.9)
    row["pm_p50"] = sub[pm_col].median()
    row["wbgt_p90"] = sub[wbgt_col].quantile(0.9)
    row["wbgt_p50"] = sub[wbgt_col].median()
    for lc in lu_cols:
        row[lc] = sub[lc].iloc[0] if lc in sub.columns else np.nan
    site_stats.append(row)

site_df = pd.DataFrame(site_stats)
for lc in lu_cols:
    if site_df[lc].notna().sum() >= 3:
        for metric in ["pm_p90", "pm_p50", "wbgt_p90", "wbgt_p50"]:
            r, p = stats.pearsonr(site_df[lc].values, site_df[metric].values)
            if abs(r) > 0.5 or p < 0.05:
                print(f"  {lc} vs {metric}: r={r:.3f} (p={p:.3f}) {'***' if p<0.001 else '**' if p<0.01 else '*' if p<0.05 else ''}")

print("\nDone.")

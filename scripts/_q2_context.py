#!/usr/bin/env python3
"""Q2 — Data context collection for temperature comparison analysis."""

import pandas as pd
import numpy as np
from pathlib import Path
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
df = pd.read_parquet(ROOT / "data/clean/data_HEROS_clean.parquet")
df["datetime"] = pd.to_datetime(df["datetime"])
df["hour"] = df["datetime"].dt.hour
df["date_only"] = df["datetime"].dt.date

# Key columns
kes_temp = "kes_mean_temp_f"
ws_temp = "mean_temp_out_f"
dep_temp = "dep_FEM_nubian_temp_f"
rh_col = "kes_mean_humid_pct"
wbgt_col = "kes_mean_wbgt_f"
ws_col = "mean_wind_speed_mph"
wd_col = "wind_direction_degrees_kr"

temp_cols = [kes_temp, ws_temp, dep_temp, rh_col, wbgt_col, ws_col, wd_col]

print("=" * 70)
print("Q2 DATA CONTEXT — Temperature Columns")
print("=" * 70)

# Summary stats
for col in temp_cols:
    s = df[col].dropna()
    print(f"\n{col}:")
    print(f"  N={len(s):,}, mean={s.mean():.2f}, std={s.std():.2f}, "
          f"min={s.min():.2f}, p25={s.quantile(0.25):.2f}, "
          f"median={s.median():.2f}, p75={s.quantile(0.75):.2f}, max={s.max():.2f}")
    print(f"  Missing: {df[col].isna().sum():,} ({df[col].isna().mean()*100:.1f}%)")

# Land-use columns
lu_cols = [c for c in df.columns if "Area_Percent" in c]
print(f"\nLand-use columns: {lu_cols}")

# Site-level temperature summary
print("\n" + "=" * 70)
print("SITE-LEVEL TEMPERATURE SUMMARY")
print("=" * 70)

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square",
    "chin": "Chin Park", "dewey": "Dewey Square",
    "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo",
    "oxford": "Oxford Place", "reggie": "Reggie Wong",
    "taitung": "Tai Tung", "tufts": "Tufts Garden",
}

print(f"\n{'Site':<22} {'N':>6} {'Mean Kes':>9} {'Mean WS':>9} {'Mean DEP':>9} "
      f"{'Bias WS':>8} {'Bias DEP':>9} {'r WS':>7} {'r DEP':>7}")
print("-" * 95)

for sid in sorted(SITE_NAMES):
    m = (df["site_id"] == sid) & df[kes_temp].notna()
    m_ws = m & df[ws_temp].notna()
    m_dep = m & df[dep_temp].notna()
    
    kes = df.loc[m, kes_temp]
    
    bias_ws = (df.loc[m_ws, kes_temp] - df.loc[m_ws, ws_temp]).mean() if m_ws.sum() > 30 else float('nan')
    bias_dep = (df.loc[m_dep, kes_temp] - df.loc[m_dep, dep_temp]).mean() if m_dep.sum() > 30 else float('nan')
    
    r_ws = stats.pearsonr(df.loc[m_ws, kes_temp], df.loc[m_ws, ws_temp])[0] if m_ws.sum() > 30 else float('nan')
    r_dep = stats.pearsonr(df.loc[m_dep, kes_temp], df.loc[m_dep, dep_temp])[0] if m_dep.sum() > 30 else float('nan')
    
    ws_mean = df.loc[m_ws, ws_temp].mean() if m_ws.sum() > 0 else float('nan')
    dep_mean = df.loc[m_dep, dep_temp].mean() if m_dep.sum() > 0 else float('nan')
    
    print(f"{SITE_NAMES[sid]:<22} {m.sum():6d} {kes.mean():9.2f} {ws_mean:9.2f} {dep_mean:9.2f} "
          f"{bias_ws:+8.2f} {bias_dep:+9.2f} {r_ws:7.4f} {r_dep:7.4f}")

# Overall correlations
print("\n" + "=" * 70)
print("OVERALL CORRELATIONS")
print("=" * 70)

m_ws = df[kes_temp].notna() & df[ws_temp].notna()
m_dep = df[kes_temp].notna() & df[dep_temp].notna()

r_ws, p_ws = stats.pearsonr(df.loc[m_ws, kes_temp], df.loc[m_ws, ws_temp])
r_dep, p_dep = stats.pearsonr(df.loc[m_dep, kes_temp], df.loc[m_dep, dep_temp])
rho_ws, _ = stats.spearmanr(df.loc[m_ws, kes_temp], df.loc[m_ws, ws_temp])
rho_dep, _ = stats.spearmanr(df.loc[m_dep, kes_temp], df.loc[m_dep, dep_temp])

bias_ws_all = (df.loc[m_ws, kes_temp] - df.loc[m_ws, ws_temp]).mean()
bias_dep_all = (df.loc[m_dep, kes_temp] - df.loc[m_dep, dep_temp]).mean()
rmse_ws = np.sqrt(np.mean((df.loc[m_ws, kes_temp] - df.loc[m_ws, ws_temp])**2))
rmse_dep = np.sqrt(np.mean((df.loc[m_dep, kes_temp] - df.loc[m_dep, dep_temp])**2))

print(f"Kestrel vs Weather Station: r={r_ws:.4f}, ρ={rho_ws:.4f}, bias={bias_ws_all:+.3f}°F, RMSE={rmse_ws:.3f}°F, n={m_ws.sum():,}")
print(f"Kestrel vs DEP Nubian:     r={r_dep:.4f}, ρ={rho_dep:.4f}, bias={bias_dep_all:+.3f}°F, RMSE={rmse_dep:.3f}°F, n={m_dep.sum():,}")

# WS vs DEP reference cross-check
m_refs = df[ws_temp].notna() & df[dep_temp].notna()
r_refs, _ = stats.pearsonr(df.loc[m_refs, ws_temp], df.loc[m_refs, dep_temp])
bias_refs = (df.loc[m_refs, ws_temp] - df.loc[m_refs, dep_temp]).mean()
rmse_refs = np.sqrt(np.mean((df.loc[m_refs, ws_temp] - df.loc[m_refs, dep_temp])**2))
print(f"WS vs DEP Nubian (refs):   r={r_refs:.4f}, bias={bias_refs:+.3f}°F, RMSE={rmse_refs:.3f}°F, n={m_refs.sum():,}")

# Diurnal pattern
print("\n" + "=" * 70)
print("DIURNAL TEMPERATURE PATTERN (hourly means)")
print("=" * 70)
hourly = df.groupby("hour").agg({
    kes_temp: "mean", ws_temp: "mean", dep_temp: "mean"
}).round(2)
print(hourly.to_string())

# Diurnal bias pattern
print("\nDiurnal bias (Kes - WS):")
for h in range(24):
    m = (df["hour"] == h) & df[kes_temp].notna() & df[ws_temp].notna()
    if m.sum() > 0:
        bias = (df.loc[m, kes_temp] - df.loc[m, ws_temp]).mean()
        print(f"  Hour {h:2d}: {bias:+.2f}°F (n={m.sum():,})")

# Daily range
print("\n" + "=" * 70)
print("DAILY TEMPERATURE RANGE")
print("=" * 70)
daily = df.groupby("date_only").agg({
    kes_temp: ["mean", "min", "max"],
    ws_temp: ["mean", "min", "max"],
    dep_temp: ["mean", "min", "max"],
})
daily.columns = ["_".join(c) for c in daily.columns]
print(f"Kes daily mean range: {daily[f'{kes_temp}_mean'].min():.1f} – {daily[f'{kes_temp}_mean'].max():.1f}°F")
print(f"WS daily mean range:  {daily[f'{ws_temp}_mean'].min():.1f} – {daily[f'{ws_temp}_mean'].max():.1f}°F")
print(f"DEP daily mean range: {daily[f'{dep_temp}_mean'].min():.1f} – {daily[f'{dep_temp}_mean'].max():.1f}°F")

# Heat stress context
print("\n" + "=" * 70)
print("HEAT STRESS CONTEXT")
print("=" * 70)
wbgt = df[wbgt_col].dropna()
print(f"WBGT: mean={wbgt.mean():.1f}, max={wbgt.max():.1f}")
print(f"Hours above 80°F WBGT (caution): {(wbgt >= 80).sum():,} ({(wbgt >= 80).mean()*100:.1f}%)")
print(f"Hours above 85°F WBGT (warning): {(wbgt >= 85).sum():,} ({(wbgt >= 85).mean()*100:.1f}%)")
print(f"Hours above 90°F WBGT (danger):  {(wbgt >= 90).sum():,} ({(wbgt >= 90).mean()*100:.1f}%)")

kes_t = df[kes_temp].dropna()
print(f"\nKestrel temp: mean={kes_t.mean():.1f}°F, max={kes_t.max():.1f}°F")
print(f"Hours above 85°F: {(kes_t >= 85).sum():,} ({(kes_t >= 85).mean()*100:.1f}%)")
print(f"Hours above 90°F: {(kes_t >= 90).sum():,} ({(kes_t >= 90).mean()*100:.1f}%)")
print(f"Hours above 95°F: {(kes_t >= 95).sum():,} ({(kes_t >= 95).mean()*100:.1f}%)")

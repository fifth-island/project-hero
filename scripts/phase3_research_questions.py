#!/usr/bin/env python3
"""
Phase 3 — Research Questions Q1–Q9
Chinatown HEROS Project

Generates publication-quality figures and saves results to JSON.
Run from the project root: python scripts/phase3_research_questions.py
"""
from __future__ import annotations

import json
import pathlib
import warnings

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd
import seaborn as sns
from scipy import stats
import statsmodels.api as sm
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# ── paths ────────────────────────────────────────────────────────────
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "clean" / "data_HEROS_clean.parquet"
FIG  = ROOT / "figures"
RPT  = ROOT / "reports" / "phase3"
FIG.mkdir(parents=True, exist_ok=True)
RPT.mkdir(parents=True, exist_ok=True)

# ── style ────────────────────────────────────────────────────────────
plt.rcParams.update({
    "figure.dpi": 150, "savefig.dpi": 300, "savefig.bbox": "tight",
    "font.size": 10, "axes.titlesize": 12, "axes.labelsize": 10,
})
PM_COLOR   = "#4C72B0"
TEMP_COLOR = "#DD8452"
WBGT_COLOR = "#C44E52"

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square",
    "chin": "Chin Park", "dewey": "Dewey Square",
    "eliotnorton": "Eliot Norton Park", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo Park",
    "oxford": "Oxford Place", "reggie": "Reggie Wong",
    "taitung": "Tai Tung", "tufts": "Tufts Community Garden",
}

SITE_COORDS = {
    "berkley": (42.34483, -71.06857), "castle": (42.3440, -71.0663),
    "chin": (42.3512, -71.0595), "dewey": (42.3534, -71.0551),
    "eliotnorton": (42.3509, -71.0644), "greenway": (42.35012, -71.06012),
    "lyndenboro": (42.35001, -71.06614), "msh": (42.35129, -71.05997),
    "oxford": (42.35252, -71.06107), "reggie": (42.3497, -71.0609),
    "taitung": (42.34901, -71.06192), "tufts": (42.3474, -71.0656),
}

# ── EPA AQI breakpoints (for sub-index calculation) ─────────────────
AQI_BP = {
    "pm25_24hr": [
        (0.0, 9.0, 0, 50), (9.1, 35.4, 51, 100), (35.5, 55.4, 101, 150),
        (55.5, 125.4, 151, 200), (125.5, 225.4, 201, 300), (225.5, 325.4, 301, 500),
    ],
    "ozone_8hr_ppm": [
        (0.000, 0.054, 0, 50), (0.055, 0.070, 51, 100), (0.071, 0.085, 101, 150),
        (0.086, 0.105, 151, 200), (0.106, 0.200, 201, 300),
    ],
    "co_8hr_ppm": [
        (0.0, 4.4, 0, 50), (4.5, 9.4, 51, 100), (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200), (15.5, 30.4, 201, 300), (30.5, 50.4, 301, 500),
    ],
    "so2_1hr_ppb": [
        (0, 35, 0, 50), (36, 75, 51, 100), (76, 185, 101, 150),
        (186, 304, 151, 200), (305, 604, 201, 300), (605, 1004, 301, 500),
    ],
    "no2_1hr_ppb": [
        (0, 53, 0, 50), (54, 100, 51, 100), (101, 360, 101, 150),
        (361, 649, 151, 200), (650, 1249, 201, 300), (1250, 2049, 301, 500),
    ],
}


def calc_sub_aqi(conc, breakpoints):
    """Return integer AQI sub-index for a single concentration value."""
    if pd.isna(conc):
        return np.nan
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= conc <= bp_hi:
            return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (conc - bp_lo) + aqi_lo
    return np.nan


def savefig(fig, name):
    fig.savefig(FIG / name)
    plt.close(fig)
    print(f"  Saved figures/{name}")


# ── load data ────────────────────────────────────────────────────────
print("Loading data …")
df = pd.read_parquet(DATA)
df["datetime"] = pd.to_datetime(df["datetime"])
df["site_name"] = df["site_id"].map(SITE_NAMES)
if "date_only" not in df.columns or df["date_only"].dtype == object:
    df["date_only"] = df["datetime"].dt.date
print(f"  {len(df):,} rows × {df.shape[1]} columns\n")

report: dict = {}  # accumulate results for JSON export

# ═════════════════════════════════════════════════════════════════════
# Q1 — PM2.5 sensor comparison (Purple Air vs MassDEP FEM)
# ═════════════════════════════════════════════════════════════════════
print("=" * 60)
print("Q1: PM2.5 — Purple Air vs MassDEP FEM")
print("=" * 60)

q1 = {}

# --- 1a. Overall scatter + regression (PA vs DEP Chinatown) ---
pa_col = "pa_mean_pm2_5_atm_b_corr_2"
dep_ct = "dep_FEM_chinatown_pm2_5_ug_m3"
dep_nub = "dep_FEM_nubian_pm2_5_ug_m3"
epa_pm = "epa_pm25_fem"

refs = {
    "DEP Chinatown": dep_ct,
    "DEP Nubian": dep_nub,
    "EPA PM2.5 FEM": epa_pm,
}

fig, axes = plt.subplots(1, 3, figsize=(16, 5))
for ax, (ref_label, ref_col) in zip(axes, refs.items()):
    mask = df[pa_col].notna() & df[ref_col].notna()
    x, y = df.loc[mask, ref_col].values, df.loc[mask, pa_col].values
    r, p = stats.pearsonr(x, y)
    slope, intercept = np.polyfit(x, y, 1)
    rmse = np.sqrt(np.mean((y - x) ** 2))
    bias = np.mean(y - x)

    ax.scatter(x, y, s=1, alpha=0.15, color=PM_COLOR)
    xlim = [min(x.min(), y.min()) - 1, max(x.max(), y.max()) + 1]
    ax.plot(xlim, xlim, "k--", lw=0.8, label="1:1")
    ax.plot(xlim, [slope * v + intercept for v in xlim], "r-", lw=1,
            label=f"OLS: y={slope:.2f}x+{intercept:.2f}")
    ax.set(xlabel=f"{ref_label} (µg/m³)", ylabel="Purple Air PM2.5 (µg/m³)",
           title=f"PA vs {ref_label}")
    ax.legend(fontsize=8)
    ax.text(0.05, 0.95, f"r = {r:.3f}\nRMSE = {rmse:.2f}\nbias = {bias:+.2f}",
            transform=ax.transAxes, va="top", fontsize=8,
            bbox=dict(boxstyle="round", fc="white", alpha=0.8))
    q1[ref_label] = {"r": round(r, 4), "slope": round(slope, 4),
                      "intercept": round(intercept, 4), "rmse": round(rmse, 3),
                      "bias": round(bias, 3), "n": int(mask.sum())}

fig.suptitle("Q1 — Purple Air PM2.5 vs Reference Monitors", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q1_pm25_scatter.png")

# --- 1b. Bland-Altman plot (PA vs DEP Chinatown) ---
mask = df[pa_col].notna() & df[dep_ct].notna()
pa_v = df.loc[mask, pa_col].values
dep_v = df.loc[mask, dep_ct].values
mean_vals = (pa_v + dep_v) / 2
diff_vals = pa_v - dep_v
md = np.mean(diff_vals)
sd = np.std(diff_vals, ddof=1)

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(mean_vals, diff_vals, s=1, alpha=0.15, color=PM_COLOR)
ax.axhline(md, color="red", lw=1, label=f"Mean diff = {md:+.2f}")
ax.axhline(md + 1.96 * sd, color="gray", ls="--", lw=0.8, label=f"+1.96 SD = {md + 1.96*sd:.2f}")
ax.axhline(md - 1.96 * sd, color="gray", ls="--", lw=0.8, label=f"−1.96 SD = {md - 1.96*sd:.2f}")
ax.set(xlabel="Mean of PA & DEP CT (µg/m³)", ylabel="Difference (PA − DEP CT) (µg/m³)",
       title="Q1 — Bland-Altman: Purple Air vs DEP Chinatown PM2.5")
ax.legend(fontsize=9)
fig.tight_layout()
savefig(fig, "q1_bland_altman_pm25.png")
q1["bland_altman"] = {"mean_diff": round(md, 3), "sd_diff": round(sd, 3),
                       "loa_upper": round(md + 1.96 * sd, 3),
                       "loa_lower": round(md - 1.96 * sd, 3)}

# --- 1c. Site-specific regression table ---
site_reg = []
for sid in sorted(df["site_id"].unique()):
    sub = df[(df["site_id"] == sid) & df[pa_col].notna() & df[dep_ct].notna()]
    if len(sub) < 30:
        continue
    x, y = sub[dep_ct].values, sub[pa_col].values
    r, _ = stats.pearsonr(x, y)
    sl, ic = np.polyfit(x, y, 1)
    rmse = np.sqrt(np.mean((y - x) ** 2))
    site_reg.append({"site": SITE_NAMES.get(sid, sid), "n": len(sub),
                      "r": round(r, 3), "slope": round(sl, 3),
                      "intercept": round(ic, 3), "rmse": round(rmse, 2)})
q1["site_regression"] = site_reg
print("  Site-level PA vs DEP CT regressions:")
for s in site_reg:
    print(f"    {s['site']:25s}  r={s['r']:.3f}  slope={s['slope']:.3f}  RMSE={s['rmse']:.2f}")

# --- 1d. Barkjohn correction benchmark ---
# National correction: PA_corr = 0.524*PA_raw − 0.0862*RH + 5.75
# Our data already has corrected PA values, so we compare the effective
# relationship with the reference.
rh_col = "kes_mean_humid_pct"
mask3 = df[pa_col].notna() & df[dep_ct].notna() & df[rh_col].notna()
X_bj = np.column_stack([df.loc[mask3, pa_col].values, df.loc[mask3, rh_col].values])
X_bj_c = sm.add_constant(X_bj)
y_bj = df.loc[mask3, dep_ct].values
ols_bj = sm.OLS(y_bj, X_bj_c).fit()
q1["barkjohn_style_ols"] = {
    "const": round(ols_bj.params[0], 4),
    "coef_PA": round(ols_bj.params[1], 4),
    "coef_RH": round(ols_bj.params[2], 4),
    "r_squared": round(ols_bj.rsquared, 4),
}
print(f"\n  Barkjohn-style OLS: DEP = {ols_bj.params[1]:.3f}·PA + {ols_bj.params[2]:.4f}·RH + {ols_bj.params[0]:.3f}")
print(f"  R² = {ols_bj.rsquared:.4f}")

report["Q1"] = q1

# ═════════════════════════════════════════════════════════════════════
# Q2 — Temperature comparison (Kestrel vs Weather Station & DEP)
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q2: Temperature — Kestrel vs Weather Station & DEP Nubian")
print("=" * 60)

q2 = {}
kes_temp = "kes_mean_temp_f"
ws_temp = "mean_temp_out_f"
dep_temp = "dep_FEM_nubian_temp_f"

temp_refs = {
    "Weather Station (35 Kneeland)": ws_temp,
    "DEP Nubian": dep_temp,
}

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
for ax, (ref_label, ref_col) in zip(axes, temp_refs.items()):
    mask = df[kes_temp].notna() & df[ref_col].notna()
    x, y = df.loc[mask, ref_col].values, df.loc[mask, kes_temp].values
    r, p = stats.pearsonr(x, y)
    slope, intercept = np.polyfit(x, y, 1)
    rmse = np.sqrt(np.mean((y - x) ** 2))
    bias = np.mean(y - x)

    ax.scatter(x, y, s=1, alpha=0.15, color=TEMP_COLOR)
    xlim = [min(x.min(), y.min()) - 1, max(x.max(), y.max()) + 1]
    ax.plot(xlim, xlim, "k--", lw=0.8, label="1:1")
    ax.plot(xlim, [slope * v + intercept for v in xlim], "r-", lw=1,
            label=f"OLS: y={slope:.2f}x+{intercept:.2f}")
    ax.set(xlabel=f"{ref_label} Temp (°F)", ylabel="Kestrel Temp (°F)",
           title=f"Kestrel vs {ref_label}")
    ax.legend(fontsize=8)
    ax.text(0.05, 0.95, f"r = {r:.3f}\nRMSE = {rmse:.2f}\nbias = {bias:+.2f}",
            transform=ax.transAxes, va="top", fontsize=8,
            bbox=dict(boxstyle="round", fc="white", alpha=0.8))
    q2[ref_label] = {"r": round(r, 4), "slope": round(slope, 4),
                      "intercept": round(intercept, 4), "rmse": round(rmse, 3),
                      "bias": round(bias, 3), "n": int(mask.sum())}

fig.suptitle("Q2 — Kestrel Temperature vs Reference Sensors", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q2_temp_scatter.png")

# Bland-Altman for temperature (Kestrel vs Weather Station)
mask = df[kes_temp].notna() & df[ws_temp].notna()
k_v = df.loc[mask, kes_temp].values
w_v = df.loc[mask, ws_temp].values
mean_t = (k_v + w_v) / 2
diff_t = k_v - w_v
md_t = np.mean(diff_t)
sd_t = np.std(diff_t, ddof=1)

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(mean_t, diff_t, s=1, alpha=0.15, color=TEMP_COLOR)
ax.axhline(md_t, color="red", lw=1, label=f"Mean diff = {md_t:+.2f} °F")
ax.axhline(md_t + 1.96 * sd_t, color="gray", ls="--", lw=0.8)
ax.axhline(md_t - 1.96 * sd_t, color="gray", ls="--", lw=0.8)
ax.set(xlabel="Mean of Kestrel & WS (°F)", ylabel="Difference (Kestrel − WS) (°F)",
       title="Q2 — Bland-Altman: Kestrel vs Weather Station (35 Kneeland)")
ax.legend(fontsize=9)
fig.tight_layout()
savefig(fig, "q2_bland_altman_temp.png")
q2["bland_altman_ws"] = {"mean_diff": round(md_t, 3), "sd_diff": round(sd_t, 3)}

# Site-specific temperature correlations
site_temp = []
for sid in sorted(df["site_id"].unique()):
    sub = df[(df["site_id"] == sid) & df[kes_temp].notna() & df[ws_temp].notna()]
    if len(sub) < 30:
        continue
    r_ws, _ = stats.pearsonr(sub[ws_temp], sub[kes_temp])
    r_dep, _ = stats.pearsonr(sub[dep_temp], sub[kes_temp])
    bias_ws = (sub[kes_temp] - sub[ws_temp]).mean()
    bias_dep = (sub[kes_temp] - sub[dep_temp]).mean()
    site_temp.append({"site": SITE_NAMES.get(sid, sid),
                       "r_ws": round(r_ws, 3), "bias_ws": round(bias_ws, 2),
                       "r_dep": round(r_dep, 3), "bias_dep": round(bias_dep, 2)})
q2["site_correlations"] = site_temp

for s in site_temp:
    print(f"  {s['site']:25s}  r_WS={s['r_ws']:.3f} bias_WS={s['bias_ws']:+.2f}  r_DEP={s['r_dep']:.3f} bias_DEP={s['bias_dep']:+.2f}")

report["Q2"] = q2

# ═════════════════════════════════════════════════════════════════════
# Q3 — CDF plots (PM2.5 & WBGT)
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q3: Empirical CDFs — PM2.5 and WBGT")
print("=" * 60)

q3 = {}
wbgt_col = "kes_mean_wbgt_f"

# --- 3a. Overall CDFs with thresholds ---
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# PM2.5 CDF
vals = df[pa_col].dropna().values
sorted_v = np.sort(vals)
cdf = np.arange(1, len(sorted_v) + 1) / len(sorted_v)
axes[0].plot(sorted_v, cdf, color=PM_COLOR, lw=1.5, label="All observations")
axes[0].axvline(9.0, color="orange", ls="--", lw=1, label="NAAQS annual (9 µg/m³)")
axes[0].axvline(35.0, color="red", ls="--", lw=1, label="NAAQS 24-hr (35 µg/m³)")
axes[0].set(xlabel="PM2.5 (µg/m³)", ylabel="Cumulative Probability",
            title="Empirical CDF — PM2.5")
axes[0].legend(fontsize=8)
pct_above_9 = (vals > 9.0).mean() * 100
pct_above_35 = (vals > 35.0).mean() * 100
q3["pm25_pct_above_naaqs_annual"] = round(pct_above_9, 2)
q3["pm25_pct_above_naaqs_24hr"] = round(pct_above_35, 2)
axes[0].text(0.95, 0.3, f"{pct_above_9:.1f}% > 9 µg/m³\n{pct_above_35:.1f}% > 35 µg/m³",
             transform=axes[0].transAxes, ha="right", fontsize=9,
             bbox=dict(boxstyle="round", fc="lightyellow", alpha=0.9))

# WBGT CDF
vals_w = df[wbgt_col].dropna().values
sorted_w = np.sort(vals_w)
cdf_w = np.arange(1, len(sorted_w) + 1) / len(sorted_w)
axes[1].plot(sorted_w, cdf_w, color=WBGT_COLOR, lw=1.5, label="All observations")
for thresh, lbl in [(80, "OSHA Caution (80°F)"), (85, "OSHA Warning (85°F)"), (90, "OSHA Danger (90°F)")]:
    axes[1].axvline(thresh, ls="--", lw=1, label=lbl)
axes[1].set(xlabel="WBGT (°F)", ylabel="Cumulative Probability",
            title="Empirical CDF — WBGT")
axes[1].legend(fontsize=8)
pct_above_80 = (vals_w > 80).mean() * 100
q3["wbgt_pct_above_80F"] = round(pct_above_80, 2)

fig.suptitle("Q3 — Empirical Cumulative Distribution Functions", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q3_cdf_overall.png")

# --- 3b. CDFs by time of day (day vs night) ---
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
for is_day, lbl, ls in [(True, "Day (6am–6pm)", "-"), (False, "Night (6pm–6am)", "--")]:
    sub = df[df["is_daytime"] == is_day]
    # PM2.5
    v = np.sort(sub[pa_col].dropna().values)
    axes[0].plot(v, np.arange(1, len(v)+1)/len(v), ls=ls, lw=1.2, label=lbl)
    # WBGT
    v = np.sort(sub[wbgt_col].dropna().values)
    axes[1].plot(v, np.arange(1, len(v)+1)/len(v), ls=ls, lw=1.2, label=lbl)

axes[0].axvline(9.0, color="orange", ls=":", lw=1)
axes[0].axvline(35.0, color="red", ls=":", lw=1)
axes[0].set(xlabel="PM2.5 (µg/m³)", ylabel="CDF", title="PM2.5 — Day vs Night")
axes[0].legend(fontsize=9)

axes[1].axvline(80, color="orange", ls=":", lw=1)
axes[1].set(xlabel="WBGT (°F)", ylabel="CDF", title="WBGT — Day vs Night")
axes[1].legend(fontsize=9)

fig.suptitle("Q3 — CDFs by Time of Day", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q3_cdf_day_night.png")

# KS test: day vs night
pm_day = df.loc[df["is_daytime"], pa_col].dropna().values
pm_night = df.loc[~df["is_daytime"], pa_col].dropna().values
ks_pm, p_pm = stats.ks_2samp(pm_day, pm_night)
wbgt_day = df.loc[df["is_daytime"], wbgt_col].dropna().values
wbgt_night = df.loc[~df["is_daytime"], wbgt_col].dropna().values
ks_wbgt, p_wbgt = stats.ks_2samp(wbgt_day, wbgt_night)
q3["ks_test_day_night"] = {
    "pm25": {"statistic": round(ks_pm, 4), "p_value": f"{p_pm:.2e}"},
    "wbgt": {"statistic": round(ks_wbgt, 4), "p_value": f"{p_wbgt:.2e}"},
}
print(f"  KS test (day vs night): PM2.5 D={ks_pm:.4f} p={p_pm:.2e} | WBGT D={ks_wbgt:.4f} p={p_wbgt:.2e}")

# --- 3c. CDFs per site ---
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
sites_sorted = sorted(df["site_id"].unique())
colors = plt.cm.tab20(np.linspace(0, 1, 12))
for i, sid in enumerate(sites_sorted):
    sub = df[df["site_id"] == sid]
    v = np.sort(sub[pa_col].dropna().values)
    axes[0].plot(v, np.arange(1, len(v)+1)/len(v), color=colors[i], lw=1, label=SITE_NAMES[sid])
    v = np.sort(sub[wbgt_col].dropna().values)
    axes[1].plot(v, np.arange(1, len(v)+1)/len(v), color=colors[i], lw=1, label=SITE_NAMES[sid])

axes[0].axvline(9.0, color="orange", ls=":", lw=1)
axes[0].set(xlabel="PM2.5 (µg/m³)", ylabel="CDF", title="PM2.5 CDF by Site")
axes[0].legend(fontsize=6, ncol=2, loc="lower right")
axes[1].set(xlabel="WBGT (°F)", ylabel="CDF", title="WBGT CDF by Site")
axes[1].legend(fontsize=6, ncol=2, loc="lower right")
fig.suptitle("Q3 — Per-Site CDFs", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q3_cdf_by_site.png")

report["Q3"] = q3

# ═════════════════════════════════════════════════════════════════════
# Q4 — AQI & other pollutants
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q4: AQI & Multi-Pollutant Analysis")
print("=" * 60)

q4 = {}

# Compute daily averages for AQI sub-index calculations
daily = df.groupby("date_only").agg(
    pm25_mean=(pa_col, "mean"),
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

# Dominant pollutant
daily["dominant"] = daily[aqi_cols].idxmax(axis=1).str.replace("aqi_", "")

q4["daily_aqi_mean"] = round(daily["aqi_overall"].mean(), 1)
q4["daily_aqi_max"] = round(daily["aqi_overall"].max(), 1)
q4["dominant_pollutant_counts"] = daily["dominant"].value_counts().to_dict()
print(f"  Mean daily AQI: {q4['daily_aqi_mean']}")
print(f"  Max daily AQI: {q4['daily_aqi_max']}")
print(f"  Dominant pollutant counts: {q4['dominant_pollutant_counts']}")

# --- 4a. Stacked AQI component chart ---
fig, ax = plt.subplots(figsize=(14, 6))
dates = pd.to_datetime(daily["date_only"])
bottom = np.zeros(len(daily))
pollutant_colors = {"pm25": PM_COLOR, "ozone": "#55A868", "co": "#8C8C8C",
                    "so2": "#C4AD66", "no2": "#B07AA1"}
pollutant_labels = {"pm25": "PM2.5", "ozone": "Ozone", "co": "CO",
                    "so2": "SO₂", "no2": "NO₂"}

for pcol in aqi_cols:
    pname = pcol.replace("aqi_", "")
    vals = daily[pcol].fillna(0).values
    ax.bar(dates, vals, bottom=bottom, label=pollutant_labels[pname],
           color=pollutant_colors[pname], width=0.8)
    bottom += vals

ax.axhline(50, color="green", ls="--", lw=0.8, label="Good (50)")
ax.axhline(100, color="orange", ls="--", lw=0.8, label="Moderate (100)")
ax.set(xlabel="Date", ylabel="AQI Sub-Index (stacked)",
       title="Q4 — Daily AQI Component Breakdown")
ax.legend(fontsize=8, ncol=4)
ax.tick_params(axis="x", rotation=45)
fig.tight_layout()
savefig(fig, "q4_aqi_stacked.png")

# --- 4b. Multi-pollutant correlation matrix ---
poll_cols = ["epa_ozone", "epa_so2", "epa_co", "epa_no2", "epa_pm25_fem",
             pa_col, kes_temp, wbgt_col, "kes_mean_humid_pct", "mean_wind_speed_mph"]
poll_labels = ["Ozone", "SO₂", "CO", "NO₂", "EPA PM2.5",
               "PA PM2.5", "Temp", "WBGT", "Humidity", "Wind Spd"]
corr_df = df[poll_cols].dropna().corr()
corr_df.index = poll_labels
corr_df.columns = poll_labels

fig, ax = plt.subplots(figsize=(10, 8))
mask_tri = np.triu(np.ones_like(corr_df, dtype=bool), k=1)
sns.heatmap(corr_df, mask=mask_tri, annot=True, fmt=".2f", cmap="RdBu_r",
            center=0, vmin=-1, vmax=1, ax=ax, square=True, linewidths=0.5)
ax.set_title("Q4 — Multi-Pollutant Correlation Matrix", fontsize=13)
fig.tight_layout()
savefig(fig, "q4_pollutant_correlation.png")

# --- 4c. Pollutant rose (PM2.5 by wind direction) ---
wind_dir = "wind_direction_degrees_kr"
mask = df[pa_col].notna() & df[wind_dir].notna()
wd = df.loc[mask, wind_dir].values
pm = df.loc[mask, pa_col].values

# Bin into 16 sectors
n_sectors = 16
bin_edges = np.linspace(0, 360, n_sectors + 1)
sector_means = []
sector_angles = []
for i in range(n_sectors):
    in_sector = (wd >= bin_edges[i]) & (wd < bin_edges[i+1])
    if in_sector.sum() > 0:
        sector_means.append(np.mean(pm[in_sector]))
    else:
        sector_means.append(0)
    sector_angles.append(np.radians((bin_edges[i] + bin_edges[i+1]) / 2))

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={"projection": "polar"})
bars = ax.bar(sector_angles, sector_means, width=np.radians(360/n_sectors),
              color=PM_COLOR, alpha=0.7, edgecolor="white")
ax.set_theta_zero_location("N")
ax.set_theta_direction(-1)
ax.set_title("Q4 — PM2.5 Concentration by Wind Direction\n(Pollutant Rose)", pad=20)
ax.set_rlabel_position(45)
fig.tight_layout()
savefig(fig, "q4_pollutant_rose.png")

q4["pm25_by_wind_sector"] = {f"{int(bin_edges[i])}-{int(bin_edges[i+1])}°": round(sector_means[i], 2)
                              for i in range(n_sectors)}

report["Q4"] = q4

# ═════════════════════════════════════════════════════════════════════
# Q5 — Hottest days × WBGT
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q5: Top-5 Hottest Days — WBGT Across Sites")
print("=" * 60)

q5 = {}

daily_wbgt = df.groupby("date_only")[wbgt_col].mean().reset_index()
daily_wbgt.columns = ["date", "mean_wbgt"]
top5_hot = daily_wbgt.nlargest(5, "mean_wbgt")
q5["top5_hottest_days"] = [{"date": str(r["date"]), "mean_wbgt": round(r["mean_wbgt"], 2)}
                            for _, r in top5_hot.iterrows()]
print("  Top-5 hottest days by mean WBGT:")
for d in q5["top5_hottest_days"]:
    print(f"    {d['date']}  WBGT = {d['mean_wbgt']} °F")

hot_dates = top5_hot["date"].tolist()
df_hot = df[df["date_only"].isin(hot_dates)]

# --- 5a. Heatmap (site × hour) on hottest days ---
pivot = df_hot.pivot_table(values=wbgt_col, index="site_id", columns="hour", aggfunc="mean")
pivot.index = pivot.index.map(SITE_NAMES)

fig, ax = plt.subplots(figsize=(14, 6))
sns.heatmap(pivot, cmap="YlOrRd", annot=True, fmt=".1f", ax=ax, linewidths=0.5)
ax.set(xlabel="Hour of Day", ylabel="", title="Q5 — WBGT (°F) by Site × Hour — Top-5 Hottest Days")
fig.tight_layout()
savefig(fig, "q5_wbgt_heatmap_hot_days.png")

# --- 5b. Lollipop chart: site WBGT on hottest days ---
site_wbgt_hot = df_hot.groupby("site_id")[wbgt_col].mean().sort_values()
site_wbgt_hot.index = site_wbgt_hot.index.map(SITE_NAMES)

fig, ax = plt.subplots(figsize=(10, 6))
ax.hlines(y=site_wbgt_hot.index, xmin=site_wbgt_hot.min() - 0.5,
          xmax=site_wbgt_hot.values, color=WBGT_COLOR, lw=2)
ax.scatter(site_wbgt_hot.values, site_wbgt_hot.index, color=WBGT_COLOR, s=80, zorder=3)
ax.axvline(80, color="orange", ls="--", lw=1, label="OSHA Caution (80°F)")
ax.set(xlabel="Mean WBGT (°F)", title="Q5 — Site-Level WBGT on Top-5 Hottest Days (Lollipop)")
ax.legend(fontsize=9)
fig.tight_layout()
savefig(fig, "q5_wbgt_lollipop.png")

# --- 5c. Kruskal-Wallis test for inter-site differences ---
groups = [g[wbgt_col].dropna().values for _, g in df_hot.groupby("site_id")]
kw_stat, kw_p = stats.kruskal(*groups)
q5["kruskal_wallis"] = {"statistic": round(kw_stat, 2), "p_value": f"{kw_p:.2e}"}
print(f"  Kruskal-Wallis (WBGT across sites on hot days): H={kw_stat:.2f}, p={kw_p:.2e}")

# --- 5d. Impervious surface vs WBGT on hot days ---
site_env = df_hot.groupby("site_id").agg(
    mean_wbgt=(wbgt_col, "mean"),
    imperv_50m=("Impervious_Area_Percent_50m", "first"),
).reset_index()

r_imp, p_imp = stats.pearsonr(site_env["imperv_50m"], site_env["mean_wbgt"])
q5["impervious_vs_wbgt"] = {"r": round(r_imp, 3), "p": round(p_imp, 4)}
print(f"  Impervious vs WBGT on hot days: r={r_imp:.3f}, p={p_imp:.4f}")

report["Q5"] = q5

# ═════════════════════════════════════════════════════════════════════
# Q6 — Highest AQI days × PM2.5
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q6: Top-5 AQI Days — PM2.5 Variation & Meteorology")
print("=" * 60)

q6 = {}
top5_aqi = daily.nlargest(5, "aqi_overall")
q6["top5_aqi_days"] = [{"date": str(r["date_only"]), "aqi": round(r["aqi_overall"], 1),
                         "dominant": r["dominant"]}
                        for _, r in top5_aqi.iterrows()]
print("  Top-5 highest AQI days:")
for d in q6["top5_aqi_days"]:
    print(f"    {d['date']}  AQI = {d['aqi']}  dominant = {d['dominant']}")

aqi_dates = top5_aqi["date_only"].tolist()
df_aqi = df[df["date_only"].isin(aqi_dates)]

# --- 6a. PM2.5 boxplots by site on high-AQI days ---
fig, ax = plt.subplots(figsize=(12, 6))
order = df_aqi.groupby("site_name")[pa_col].median().sort_values().index
sns.boxplot(data=df_aqi, x="site_name", y=pa_col, palette="Blues_d", order=order, ax=ax)
ax.axhline(9.0, color="orange", ls="--", lw=1, label="NAAQS annual (9)")
ax.axhline(35.0, color="red", ls="--", lw=1, label="NAAQS 24-hr (35)")
ax.set(xlabel="", ylabel="PM2.5 (µg/m³)", title="Q6 — PM2.5 by Site on Top-5 AQI Days")
ax.tick_params(axis="x", rotation=45)
ax.legend(fontsize=9)
fig.tight_layout()
savefig(fig, "q6_pm25_boxplot_aqi_days.png")

# --- 6b. Wind rose colored by PM2.5 bins on high-AQI days ---
mask = df_aqi[pa_col].notna() & df_aqi[wind_dir].notna()
wd_a = df_aqi.loc[mask, wind_dir].values
pm_a = df_aqi.loc[mask, pa_col].values

pm_bins = [0, 5, 10, 15, 20, 50]
pm_labels = ["0–5", "5–10", "10–15", "15–20", "20+"]
pm_colors = ["#2ca02c", "#ffdd57", "#ff9800", "#f44336", "#9c27b0"]

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw={"projection": "polar"})
ax.set_theta_zero_location("N")
ax.set_theta_direction(-1)

for j in range(len(pm_bins) - 1):
    in_bin = (pm_a >= pm_bins[j]) & (pm_a < pm_bins[j + 1])
    if in_bin.sum() == 0:
        continue
    sector_counts = []
    for i in range(n_sectors):
        in_sect = (wd_a >= bin_edges[i]) & (wd_a < bin_edges[i + 1]) & in_bin
        sector_counts.append(in_sect.sum())
    ax.bar(sector_angles, sector_counts, width=np.radians(360 / n_sectors),
           alpha=0.7, label=f"{pm_labels[j]} µg/m³", color=pm_colors[j],
           bottom=0)

ax.set_title("Q6 — Wind Rose (PM2.5 bins) on High-AQI Days", pad=20)
ax.legend(fontsize=8, loc="lower right", bbox_to_anchor=(1.3, 0))
fig.tight_layout()
savefig(fig, "q6_wind_rose_aqi_days.png")

# --- 6c. Meteorological context on high-AQI days ---
meteo_aqi = df_aqi.groupby("date_only").agg(
    pm25_mean=(pa_col, "mean"),
    wind_mean=("mean_wind_speed_mph", "mean"),
    humid_mean=("kes_mean_humid_pct", "mean"),
    wind_dir_mode=(wind_dir, lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else np.nan),
).reset_index()
q6["meteo_high_aqi"] = meteo_aqi.to_dict(orient="records")

report["Q6"] = q6

# ═════════════════════════════════════════════════════════════════════
# Q7 — PM2.5 vs heat regression
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q7: Multivariate Regression — PM2.5 Predictors")
print("=" * 60)

q7 = {}

# Prepare regression data
reg_cols = [pa_col, kes_temp, "kes_mean_humid_pct", "mean_wind_speed_mph",
            wind_dir, "hour", "day_of_week"]
df_reg = df[reg_cols].dropna().copy()
# Add sin/cos for wind direction and hour (cyclical)
df_reg["wind_sin"] = np.sin(np.radians(df_reg[wind_dir]))
df_reg["wind_cos"] = np.cos(np.radians(df_reg[wind_dir]))
df_reg["hour_sin"] = np.sin(2 * np.pi * df_reg["hour"] / 24)
df_reg["hour_cos"] = np.cos(2 * np.pi * df_reg["hour"] / 24)

predictors = [kes_temp, "kes_mean_humid_pct", "mean_wind_speed_mph",
              "wind_sin", "wind_cos", "hour_sin", "hour_cos", "day_of_week"]
X = df_reg[predictors].values
y = df_reg[pa_col].values
X_c = sm.add_constant(X)

ols_model = sm.OLS(y, X_c).fit()
print(ols_model.summary().tables[1])

# VIF
from statsmodels.stats.outliers_influence import variance_inflation_factor
vif_data = []
for i, col in enumerate(["const"] + predictors):
    vif_data.append({"variable": col, "VIF": round(variance_inflation_factor(X_c, i), 2)})
q7["vif"] = vif_data

q7["ols_r_squared"] = round(ols_model.rsquared, 4)
q7["ols_adj_r_squared"] = round(ols_model.rsquared_adj, 4)
q7["ols_coefficients"] = {
    name: {"coef": round(float(ols_model.params[i]), 4),
           "pvalue": f"{float(ols_model.pvalues[i]):.2e}",
           "ci_lower": round(float(ols_model.conf_int()[i][0]), 4),
           "ci_upper": round(float(ols_model.conf_int()[i][1]), 4)}
    for i, name in enumerate(["const"] + predictors)
}
print(f"\n  R² = {ols_model.rsquared:.4f}, Adj R² = {ols_model.rsquared_adj:.4f}")

# --- 7a. Coefficient plot ---
coef_names = predictors
coef_vals = ols_model.params[1:]  # skip constant
ci = ols_model.conf_int()[1:]
ci_lower = ci[:, 0]
ci_upper = ci[:, 1]

# Standardize for comparison
X_std = (X - X.mean(axis=0)) / X.std(axis=0)
X_std_c = sm.add_constant(X_std)
ols_std = sm.OLS(y, X_std_c).fit()
std_coefs = ols_std.params[1:]
std_ci = ols_std.conf_int()[1:]

display_names = ["Temperature", "Humidity", "Wind Speed",
                 "Wind Dir (sin)", "Wind Dir (cos)",
                 "Hour (sin)", "Hour (cos)", "Day of Week"]

fig, ax = plt.subplots(figsize=(10, 6))
y_pos = np.arange(len(display_names))
ax.barh(y_pos, std_coefs, xerr=[std_coefs - std_ci[:, 0], std_ci[:, 1] - std_coefs],
        color=PM_COLOR, alpha=0.7, capsize=3)
ax.axvline(0, color="black", lw=0.8)
ax.set_yticks(y_pos)
ax.set_yticklabels(display_names)
ax.set(xlabel="Standardized Coefficient", title="Q7 — OLS Regression Coefficients (PM2.5)")
fig.tight_layout()
savefig(fig, "q7_regression_coefficients.png")

# --- 7b. Partial dependence: Temperature vs PM2.5 ---
fig, axes = plt.subplots(1, 3, figsize=(16, 5))
for ax, (col, label) in zip(axes, [(kes_temp, "Temperature (°F)"),
                                     ("kes_mean_humid_pct", "Humidity (%)"),
                                     ("mean_wind_speed_mph", "Wind Speed (mph)")]):
    # Bin and compute mean PM2.5
    bins = pd.qcut(df_reg[col], 20, duplicates="drop")
    grouped = df_reg.groupby(bins)[pa_col].agg(["mean", "sem"]).reset_index()
    grouped["mid"] = grouped[col].apply(lambda x: x.mid)
    ax.plot(grouped["mid"], grouped["mean"], color=PM_COLOR, lw=1.5)
    ax.fill_between(grouped["mid"], grouped["mean"] - 1.96*grouped["sem"],
                    grouped["mean"] + 1.96*grouped["sem"], alpha=0.2, color=PM_COLOR)
    ax.set(xlabel=label, ylabel="Mean PM2.5 (µg/m³)")
    ax.set_title(f"PM2.5 vs {label}")

fig.suptitle("Q7 — Partial Dependence Plots", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q7_partial_dependence.png")

# --- 7c. Site heterogeneity (site-specific slopes) ---
site_slopes = []
for sid in sorted(df["site_id"].unique()):
    sub = df[(df["site_id"] == sid)][reg_cols].dropna()
    if len(sub) < 100:
        continue
    r_temp, _ = stats.pearsonr(sub[kes_temp], sub[pa_col])
    slope_temp, _ = np.polyfit(sub[kes_temp], sub[pa_col], 1)
    site_slopes.append({"site": SITE_NAMES[sid], "r_temp_pm25": round(r_temp, 3),
                         "slope_temp_pm25": round(slope_temp, 3)})
q7["site_heterogeneity"] = site_slopes

report["Q7"] = q7

# ═════════════════════════════════════════════════════════════════════
# Q8 — Temporal peaks (hour-of-day × day-of-week)
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q8: Temporal Peaks — Hour × Day-of-Week Heatmaps")
print("=" * 60)

q8 = {}
dow_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# --- 8a. Overall hour × DOW heatmaps (PM2.5 and WBGT) ---
fig, axes = plt.subplots(1, 2, figsize=(16, 6))
for ax, (col, label, cmap) in zip(axes, [
    (pa_col, "PM2.5 (µg/m³)", "Blues"),
    (wbgt_col, "WBGT (°F)", "YlOrRd"),
]):
    pivot = df.pivot_table(values=col, index="day_of_week", columns="hour", aggfunc="mean")
    pivot.index = [dow_labels[i] for i in pivot.index]
    sns.heatmap(pivot, cmap=cmap, annot=True, fmt=".1f", ax=ax, linewidths=0.5)
    ax.set(xlabel="Hour", ylabel="", title=label)

fig.suptitle("Q8 — Hour × Day-of-Week Heatmaps (Overall)", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q8_hour_dow_heatmap.png")

# --- 8b. Per-site small multiples (PM2.5) ---
fig, axes = plt.subplots(3, 4, figsize=(20, 12))
for ax, sid in zip(axes.flat, sites_sorted):
    sub = df[df["site_id"] == sid]
    pivot = sub.pivot_table(values=pa_col, index="day_of_week", columns="hour", aggfunc="mean")
    if not pivot.empty:
        pivot.index = [dow_labels[i] for i in pivot.index]
        sns.heatmap(pivot, cmap="Blues", ax=ax, cbar=False, linewidths=0.3,
                    xticklabels=4, yticklabels=True)
    ax.set_title(SITE_NAMES[sid], fontsize=9)
    ax.set(xlabel="", ylabel="")

fig.suptitle("Q8 — PM2.5 Hour×DOW Heatmaps by Site", fontsize=14, y=1.01)
fig.tight_layout()
savefig(fig, "q8_pm25_heatmaps_by_site.png")

# --- 8c. Diurnal overlay (all sites, mean ± SE) ---
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
for ax, (col, label, color) in zip(axes, [
    (pa_col, "PM2.5 (µg/m³)", PM_COLOR),
    (wbgt_col, "WBGT (°F)", WBGT_COLOR),
]):
    for i, sid in enumerate(sites_sorted):
        sub = df[df["site_id"] == sid].groupby("hour")[col].agg(["mean", "sem"])
        ax.plot(sub.index, sub["mean"], color=colors[i], lw=1, alpha=0.7,
                label=SITE_NAMES[sid])
    ax.set(xlabel="Hour of Day", ylabel=label, title=f"Diurnal Cycle — {label}")
    ax.legend(fontsize=6, ncol=3, loc="upper left")
    ax.set_xticks(range(0, 24, 3))

fig.suptitle("Q8 — Diurnal Cycle Overlays (All Sites)", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q8_diurnal_overlay.png")

# Weekday vs weekend analysis
df["is_weekend"] = df["day_of_week"].isin([5, 6])
weekday_pm = df[~df["is_weekend"]][pa_col].mean()
weekend_pm = df[df["is_weekend"]][pa_col].mean()
q8["weekday_vs_weekend_pm25"] = {
    "weekday_mean": round(weekday_pm, 2),
    "weekend_mean": round(weekend_pm, 2),
    "diff": round(weekday_pm - weekend_pm, 2),
}
print(f"  Weekday PM2.5: {weekday_pm:.2f} vs Weekend: {weekend_pm:.2f}")

# Peak identification
overall_diurnal = df.groupby("hour")[pa_col].mean()
q8["pm25_peak_hour"] = int(overall_diurnal.idxmax())
q8["pm25_trough_hour"] = int(overall_diurnal.idxmin())
overall_diurnal_wbgt = df.groupby("hour")[wbgt_col].mean()
q8["wbgt_peak_hour"] = int(overall_diurnal_wbgt.idxmax())

print(f"  PM2.5 peak hour: {q8['pm25_peak_hour']}, trough: {q8['pm25_trough_hour']}")
print(f"  WBGT peak hour: {q8['wbgt_peak_hour']}")

report["Q8"] = q8

# ═════════════════════════════════════════════════════════════════════
# Q9 — Land-use regression
# ═════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("Q9: Land-Use Regression")
print("=" * 60)

q9 = {}

# Site-level summaries
site_summary = df.groupby("site_id").agg(
    pm25_mean=(pa_col, "mean"),
    wbgt_mean=(wbgt_col, "mean"),
    temp_mean=(kes_temp, "mean"),
    roads_25m=("Roads_Area_Percent_25m", "first"),
    green_25m=("Greenspace_Area_Percent_25m", "first"),
    trees_25m=("Trees_Area_Percent_25m", "first"),
    imperv_25m=("Impervious_Area_Percent_25m", "first"),
    indust_25m=("Industrial_Area_Percent_25m", "first"),
    roads_50m=("Roads_Area_Percent_50m", "first"),
    green_50m=("Greenspace_Area_Percent_50m", "first"),
    trees_50m=("Trees_Area_Percent_50m", "first"),
    imperv_50m=("Impervious_Area_Percent_50m", "first"),
    indust_50m=("Industrial_Area_Percent_50m", "first"),
).reset_index()
site_summary["site_name"] = site_summary["site_id"].map(SITE_NAMES)

# --- 9a. Scatter: land-use vs outcomes (50m) ---
lu_predictors = [
    ("imperv_50m", "Impervious (50m, %)"),
    ("green_50m", "Greenspace (50m, %)"),
    ("trees_50m", "Trees (50m, %)"),
    ("roads_50m", "Roads (50m, %)"),
]

fig, axes = plt.subplots(2, 4, figsize=(18, 8))
for j, (outcome, outcome_label, color) in enumerate([
    ("pm25_mean", "Mean PM2.5 (µg/m³)", PM_COLOR),
    ("wbgt_mean", "Mean WBGT (°F)", WBGT_COLOR),
]):
    for i, (lu_col, lu_label) in enumerate(lu_predictors):
        ax = axes[j, i]
        x, y = site_summary[lu_col].values, site_summary[outcome].values
        ax.scatter(x, y, color=color, s=60, zorder=3)
        # Add site labels
        for _, row in site_summary.iterrows():
            ax.annotate(row["site_name"], (row[lu_col], row[outcome]),
                        fontsize=6, ha="center", va="bottom")
        # Regression line
        if len(x) > 2:
            r, p = stats.pearsonr(x, y)
            slope, intercept = np.polyfit(x, y, 1)
            x_line = np.linspace(x.min(), x.max(), 50)
            ax.plot(x_line, slope * x_line + intercept, "--", color="gray", lw=1)
            ax.set_title(f"r = {r:.2f}, p = {p:.3f}", fontsize=9)
        ax.set(xlabel=lu_label if j == 1 else "", ylabel=outcome_label if i == 0 else "")

fig.suptitle("Q9 — Land-Use vs Environmental Outcomes (50m Buffer)", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q9_landuse_scatter.png")

# --- 9b. Coefficient plot: 25m vs 50m buffer comparison ---
lu_25m = ["roads_25m", "green_25m", "trees_25m", "imperv_25m", "indust_25m"]
lu_50m = ["roads_50m", "green_50m", "trees_50m", "imperv_50m", "indust_50m"]
lu_display = ["Roads", "Greenspace", "Trees", "Impervious", "Industrial"]

coef_results = {"pm25": {"25m": [], "50m": []}, "wbgt": {"25m": [], "50m": []}}
for outcome, outcome_col in [("pm25", "pm25_mean"), ("wbgt", "wbgt_mean")]:
    for buffer, lu_cols in [("25m", lu_25m), ("50m", lu_50m)]:
        for lu_col in lu_cols:
            x = site_summary[lu_col].values.reshape(-1, 1)
            y_out = site_summary[outcome_col].values
            if np.std(x) < 1e-10:
                coef_results[outcome][buffer].append({"coef": 0, "r": 0, "p": 1})
                continue
            r, p = stats.pearsonr(x.ravel(), y_out)
            coef_results[outcome][buffer].append({"coef": round(r, 3), "r": round(r, 3),
                                                   "p": round(p, 4)})

q9["correlation_results"] = coef_results

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
x_pos = np.arange(len(lu_display))
width = 0.35
for ax, (outcome, label) in zip(axes, [("pm25", "PM2.5"), ("wbgt", "WBGT")]):
    r_25 = [c["r"] for c in coef_results[outcome]["25m"]]
    r_50 = [c["r"] for c in coef_results[outcome]["50m"]]
    ax.bar(x_pos - width/2, r_25, width, label="25m buffer", alpha=0.8)
    ax.bar(x_pos + width/2, r_50, width, label="50m buffer", alpha=0.8)
    ax.set_xticks(x_pos)
    ax.set_xticklabels(lu_display, rotation=30)
    ax.set(ylabel="Pearson r", title=f"Land-Use vs {label}")
    ax.axhline(0, color="black", lw=0.5)
    ax.legend(fontsize=9)

fig.suptitle("Q9 — Land-Use Correlations: 25m vs 50m Buffer", fontsize=13, y=1.02)
fig.tight_layout()
savefig(fig, "q9_landuse_coef_comparison.png")

# --- 9c. Radar / spider chart per site ---
categories = lu_display
n_cats = len(categories)
angles = np.linspace(0, 2 * np.pi, n_cats, endpoint=False).tolist()
angles += angles[:1]  # close polygon

fig, axes = plt.subplots(3, 4, figsize=(16, 12), subplot_kw={"projection": "polar"})
for ax, sid in zip(axes.flat, sites_sorted):
    row = site_summary[site_summary["site_id"] == sid].iloc[0]
    vals_50 = [row[c] for c in lu_50m]
    vals_50 += vals_50[:1]  # close polygon
    ax.fill(angles, vals_50, alpha=0.25, color=PM_COLOR)
    ax.plot(angles, vals_50, color=PM_COLOR, lw=1.5)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=7)
    ax.set_title(SITE_NAMES[sid], fontsize=9, pad=15)
    ax.set_ylim(0, max(100, max(vals_50) * 1.1))

fig.suptitle("Q9 — Site Land-Use Profiles (50m Buffer, Radar Charts)", fontsize=14, y=1.01)
fig.tight_layout()
savefig(fig, "q9_radar_charts.png")

report["Q9"] = q9
print("  Land-use regression complete.")

# ═════════════════════════════════════════════════════════════════════
# Save report JSON
# ═════════════════════════════════════════════════════════════════════
# Convert non-serializable types
def make_serializable(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return str(obj)
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serializable(v) for v in obj]
    return obj

report_clean = make_serializable(report)
json_path = RPT / "phase3_report.json"
with open(json_path, "w") as f:
    json.dump(report_clean, f, indent=2, default=str)
print(f"\n✅ Phase 3 report saved to {json_path}")
print("✅ All Q1–Q9 figures saved to figures/")

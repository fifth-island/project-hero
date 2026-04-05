#!/usr/bin/env python3
"""
Project HERO — Chinatown Air Quality & Temperature Analysis
Generates statistics and figures for Questions 1 and 2.
"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path
import json
import warnings
warnings.filterwarnings('ignore')

OUT = Path("figures")
OUT.mkdir(exist_ok=True)

# ── Load data ──────────────────────────────────────────────────────────
df = pd.read_excel("data_HEROS.xlsx", sheet_name="Sheet 1")
df["date"] = pd.to_datetime(df["date"])

sites = sorted(df["siteID"].unique())
print(f"Sites ({len(sites)}): {sites}")
print(f"Date range: {df['date'].min()} — {df['date'].max()}")
print(f"Total rows: {len(df):,}")

# Identify 12 open-space sites (exclude DEP sensor if present)
open_sites = [s for s in sites if "dep" not in s.lower()]
print(f"\nOpen-space sites ({len(open_sites)}): {open_sites}")

# ── Helper: pretty site names ──────────────────────────────────────────
PRETTY = {
    "berkley": "Berkley Community Garden",
    "castle": "Castle Square",
    "chin": "Chin Park",
    "dewey": "Dewey Square",
    "eliotnorton": "Eliot Norton Park",
    "greenway": "One Greenway",
    "lyndenboro": "Lyndenboro",
    "msh": "Mary Soo Hoo",
    "oxford": "Oxford Place Plaza",
    "reggie": "Reggie Wong Park",
    "taitung": "Tai Tung Park",
    "tufts": "Tufts Community Garden",
}

def pretty(s):
    return PRETTY.get(s, s)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# QUESTION 1 — PM2.5 comparison
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("\n" + "="*70)
print("QUESTION 1: PM2.5 — Purple Air vs DEP FEM (Chinatown & Nubian)")
print("="*70)

pm_cols = {
    "Purple Air (site)": "pa_mean_pm2_5_atm_b_corr_2",
    "DEP FEM Chinatown": "dep_FEM_chinatown_pm2_5_ug_m3",
    "DEP FEM Nubian":    "dep_FEM_nubian_pm2_5_ug_m3",
}

# Per-site summary stats (Purple Air)
pm_stats_rows = []
for site in open_sites:
    sd = df[df["siteID"] == site]
    pa = sd["pa_mean_pm2_5_atm_b_corr_2"].dropna()
    ct = sd["dep_FEM_chinatown_pm2_5_ug_m3"].dropna()
    nu = sd["dep_FEM_nubian_pm2_5_ug_m3"].dropna()
    pm_stats_rows.append({
        "Site": pretty(site),
        "N (PA)": len(pa),
        "PA Mean": round(pa.mean(), 2) if len(pa) else np.nan,
        "PA Median": round(pa.median(), 2) if len(pa) else np.nan,
        "PA Std": round(pa.std(), 2) if len(pa) else np.nan,
        "PA Min": round(pa.min(), 2) if len(pa) else np.nan,
        "PA Max": round(pa.max(), 2) if len(pa) else np.nan,
        "DEP CT Mean": round(ct.mean(), 2) if len(ct) else np.nan,
        "DEP Nub Mean": round(nu.mean(), 2) if len(nu) else np.nan,
        "PA − CT": round(pa.mean() - ct.mean(), 2) if len(pa) and len(ct) else np.nan,
        "PA − Nub": round(pa.mean() - nu.mean(), 2) if len(pa) and len(nu) else np.nan,
    })

pm_df = pd.DataFrame(pm_stats_rows)
print("\n--- PM2.5 Summary Statistics by Site ---")
print(pm_df.to_string(index=False))

# Overall DEP stats
for label, col in [("DEP FEM Chinatown", "dep_FEM_chinatown_pm2_5_ug_m3"),
                    ("DEP FEM Nubian", "dep_FEM_nubian_pm2_5_ug_m3")]:
    vals = df[col].dropna()
    print(f"\n{label}: mean={vals.mean():.2f}, median={vals.median():.2f}, "
          f"std={vals.std():.2f}, min={vals.min():.2f}, max={vals.max():.2f}, N={len(vals)}")

# ── Figure 1: Boxplot PM2.5 all sites + DEP ──────────────────────────
fig, ax = plt.subplots(figsize=(14, 6))
box_data = []
labels = []
for site in open_sites:
    vals = df.loc[df["siteID"] == site, "pa_mean_pm2_5_atm_b_corr_2"].dropna()
    box_data.append(vals.values)
    labels.append(pretty(site))

# Add DEP references
dep_ct = df["dep_FEM_chinatown_pm2_5_ug_m3"].dropna().values
dep_nu = df["dep_FEM_nubian_pm2_5_ug_m3"].dropna().values
box_data += [dep_ct, dep_nu]
labels += ["DEP Chinatown", "DEP Nubian Sq."]

bp = ax.boxplot(box_data, patch_artist=True, showfliers=False, medianprops=dict(color="black", linewidth=1.5))
colors = plt.cm.tab20(np.linspace(0, 1, len(open_sites)))
for i, patch in enumerate(bp["boxes"]):
    if i < len(open_sites):
        patch.set_facecolor(colors[i])
        patch.set_alpha(0.7)
    elif i == len(open_sites):
        patch.set_facecolor("#d62728")
        patch.set_alpha(0.8)
    else:
        patch.set_facecolor("#ff7f0e")
        patch.set_alpha(0.8)
ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=8)
ax.set_ylabel("PM2.5 (µg/m³)")
ax.set_title("PM2.5 Distribution: Purple Air Sites vs. DEP FEM Monitors", fontsize=13, fontweight="bold")
ax.grid(axis="y", alpha=0.3)
fig.tight_layout()
fig.savefig(OUT / "pm25_boxplot.png", dpi=150)
plt.close(fig)
print("\n✓ Saved figures/pm25_boxplot.png")

# ── Figure 2: Time-series mean PM2.5 (all sites aggregated + DEP) ────
hourly = df.set_index("date").groupby(pd.Grouper(freq="1h")).agg(
    pa_all=("pa_mean_pm2_5_atm_b_corr_2", "mean"),
    dep_ct=("dep_FEM_chinatown_pm2_5_ug_m3", "mean"),
    dep_nu=("dep_FEM_nubian_pm2_5_ug_m3", "mean"),
).dropna(how="all")

fig, ax = plt.subplots(figsize=(14, 5))
ax.plot(hourly.index, hourly["pa_all"], label="Purple Air (12-site avg)", linewidth=0.8, alpha=0.85, color="#1f77b4")
ax.plot(hourly.index, hourly["dep_ct"], label="DEP FEM Chinatown", linewidth=0.8, alpha=0.85, color="#d62728")
ax.plot(hourly.index, hourly["dep_nu"], label="DEP FEM Nubian Sq.", linewidth=0.8, alpha=0.85, color="#ff7f0e")
ax.set_ylabel("PM2.5 (µg/m³)")
ax.set_title("Hourly Mean PM2.5: Purple Air (aggregated) vs. DEP FEM Monitors", fontsize=13, fontweight="bold")
ax.legend(fontsize=9)
ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
ax.xaxis.set_major_locator(mdates.DayLocator(interval=2))
ax.grid(alpha=0.3)
fig.autofmt_xdate()
fig.tight_layout()
fig.savefig(OUT / "pm25_timeseries.png", dpi=150)
plt.close(fig)
print("✓ Saved figures/pm25_timeseries.png")

# ── Figure 3: Bar chart mean PM2.5 per site vs DEP ──────────────────
fig, ax = plt.subplots(figsize=(14, 5))
x = np.arange(len(open_sites) + 2)
means = [df.loc[df["siteID"] == s, "pa_mean_pm2_5_atm_b_corr_2"].mean() for s in open_sites]
means += [df["dep_FEM_chinatown_pm2_5_ug_m3"].mean(), df["dep_FEM_nubian_pm2_5_ug_m3"].mean()]
bar_labels = [pretty(s) for s in open_sites] + ["DEP Chinatown", "DEP Nubian Sq."]
bar_colors = list(colors) + ["#d62728", "#ff7f0e"]
# Convert numpy colors to list
bar_colors_final = [c for c in bar_colors]

bars = ax.bar(x, means, color=bar_colors_final, alpha=0.8, edgecolor="white")
# Add DEP Chinatown mean line
dep_ct_mean = df["dep_FEM_chinatown_pm2_5_ug_m3"].mean()
dep_nu_mean = df["dep_FEM_nubian_pm2_5_ug_m3"].mean()
ax.axhline(dep_ct_mean, color="#d62728", linestyle="--", linewidth=1, label=f"DEP Chinatown avg ({dep_ct_mean:.1f})")
ax.axhline(dep_nu_mean, color="#ff7f0e", linestyle="--", linewidth=1, label=f"DEP Nubian avg ({dep_nu_mean:.1f})")
ax.set_xticks(x)
ax.set_xticklabels(bar_labels, rotation=45, ha="right", fontsize=8)
ax.set_ylabel("Mean PM2.5 (µg/m³)")
ax.set_title("Mean PM2.5 by Site vs. DEP FEM Reference Monitors", fontsize=13, fontweight="bold")
ax.legend(fontsize=9)
ax.grid(axis="y", alpha=0.3)
fig.tight_layout()
fig.savefig(OUT / "pm25_bar_comparison.png", dpi=150)
plt.close(fig)
print("✓ Saved figures/pm25_bar_comparison.png")

# ── Figure 4: Correlation scatter per site (PA vs DEP CT) ────────────
fig, axes = plt.subplots(3, 4, figsize=(16, 10), sharex=True, sharey=True)
axes_flat = axes.flatten()
for i, site in enumerate(open_sites):
    ax = axes_flat[i]
    sd = df[df["siteID"] == site][["pa_mean_pm2_5_atm_b_corr_2", "dep_FEM_chinatown_pm2_5_ug_m3"]].dropna()
    if len(sd) > 1:
        ax.scatter(sd["dep_FEM_chinatown_pm2_5_ug_m3"], sd["pa_mean_pm2_5_atm_b_corr_2"],
                   alpha=0.15, s=8, color=colors[i])
        corr = sd["pa_mean_pm2_5_atm_b_corr_2"].corr(sd["dep_FEM_chinatown_pm2_5_ug_m3"])
        ax.set_title(f"{pretty(site)}\nr = {corr:.2f}", fontsize=8)
        # 1:1 line
        lims = [0, max(sd["dep_FEM_chinatown_pm2_5_ug_m3"].max(), sd["pa_mean_pm2_5_atm_b_corr_2"].max())]
        ax.plot(lims, lims, "k--", linewidth=0.5, alpha=0.5)
    else:
        ax.set_title(pretty(site), fontsize=8)
    ax.tick_params(labelsize=7)

fig.supxlabel("DEP FEM Chinatown PM2.5 (µg/m³)", fontsize=11)
fig.supylabel("Purple Air PM2.5 (µg/m³)", fontsize=11)
fig.suptitle("Purple Air vs. DEP FEM Chinatown PM2.5 — Site-Level Scatter", fontsize=13, fontweight="bold", y=1.01)
fig.tight_layout()
fig.savefig(OUT / "pm25_scatter_vs_dep.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("✓ Saved figures/pm25_scatter_vs_dep.png")

# Compute correlations
corr_rows = []
for site in open_sites:
    sd = df[df["siteID"] == site][["pa_mean_pm2_5_atm_b_corr_2", "dep_FEM_chinatown_pm2_5_ug_m3", "dep_FEM_nubian_pm2_5_ug_m3"]].dropna()
    if len(sd) > 1:
        corr_rows.append({
            "Site": pretty(site),
            "r (vs DEP CT)": round(sd["pa_mean_pm2_5_atm_b_corr_2"].corr(sd["dep_FEM_chinatown_pm2_5_ug_m3"]), 3),
            "r (vs DEP Nub)": round(sd["pa_mean_pm2_5_atm_b_corr_2"].corr(sd["dep_FEM_nubian_pm2_5_ug_m3"]), 3),
        })
corr_df = pd.DataFrame(corr_rows)
print("\n--- Correlation: Purple Air PM2.5 vs DEP FEM ---")
print(corr_df.to_string(index=False))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# QUESTION 2 — Temperature comparison
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("\n" + "="*70)
print("QUESTION 2: Temperature — Kestrel vs Weather Stn (35 Kneeland) & DEP Nubian")
print("="*70)

temp_stats_rows = []
for site in open_sites:
    sd = df[df["siteID"] == site]
    kes = sd["kes_mean_temp_f"].dropna()
    ws = sd["mean_temp_out_f"].dropna()
    nu = sd["dep_FEM_nubian_temp_f"].dropna()
    temp_stats_rows.append({
        "Site": pretty(site),
        "N (Kes)": len(kes),
        "Kestrel Mean": round(kes.mean(), 2) if len(kes) else np.nan,
        "Kestrel Median": round(kes.median(), 2) if len(kes) else np.nan,
        "Kestrel Std": round(kes.std(), 2) if len(kes) else np.nan,
        "WS 35Kn Mean": round(ws.mean(), 2) if len(ws) else np.nan,
        "DEP Nub Mean": round(nu.mean(), 2) if len(nu) else np.nan,
        "Kes − WS": round(kes.mean() - ws.mean(), 2) if len(kes) and len(ws) else np.nan,
        "Kes − Nub": round(kes.mean() - nu.mean(), 2) if len(kes) and len(nu) else np.nan,
    })

temp_df = pd.DataFrame(temp_stats_rows)
print("\n--- Temperature Summary Statistics by Site ---")
print(temp_df.to_string(index=False))

# Overall reference stats
for label, col in [("Weather Stn 35 Kneeland", "mean_temp_out_f"),
                    ("DEP FEM Nubian", "dep_FEM_nubian_temp_f")]:
    vals = df[col].dropna()
    print(f"\n{label}: mean={vals.mean():.2f}°F, median={vals.median():.2f}°F, "
          f"std={vals.std():.2f}, min={vals.min():.2f}, max={vals.max():.2f}, N={len(vals)}")

# ── Figure 5: Boxplot Temperature ─────────────────────────────────────
fig, ax = plt.subplots(figsize=(14, 6))
box_data_t = []
labels_t = []
for site in open_sites:
    vals = df.loc[df["siteID"] == site, "kes_mean_temp_f"].dropna()
    box_data_t.append(vals.values)
    labels_t.append(pretty(site))

ws_vals = df["mean_temp_out_f"].dropna().values
nu_vals = df["dep_FEM_nubian_temp_f"].dropna().values
box_data_t += [ws_vals, nu_vals]
labels_t += ["WS 35 Kneeland St", "DEP Nubian Sq."]

bp2 = ax.boxplot(box_data_t, patch_artist=True, showfliers=False, medianprops=dict(color="black", linewidth=1.5))
for i, patch in enumerate(bp2["boxes"]):
    if i < len(open_sites):
        patch.set_facecolor(colors[i])
        patch.set_alpha(0.7)
    elif i == len(open_sites):
        patch.set_facecolor("#d62728")
        patch.set_alpha(0.8)
    else:
        patch.set_facecolor("#ff7f0e")
        patch.set_alpha(0.8)
ax.set_xticklabels(labels_t, rotation=45, ha="right", fontsize=8)
ax.set_ylabel("Temperature (°F)")
ax.set_title("Ambient Temperature Distribution: Kestrel Sites vs. Reference Monitors", fontsize=13, fontweight="bold")
ax.grid(axis="y", alpha=0.3)
fig.tight_layout()
fig.savefig(OUT / "temp_boxplot.png", dpi=150)
plt.close(fig)
print("\n✓ Saved figures/temp_boxplot.png")

# ── Figure 6: Time-series mean temperature ────────────────────────────
hourly_t = df.set_index("date").groupby(pd.Grouper(freq="1h")).agg(
    kes_all=("kes_mean_temp_f", "mean"),
    ws=("mean_temp_out_f", "mean"),
    dep_nu=("dep_FEM_nubian_temp_f", "mean"),
).dropna(how="all")

fig, ax = plt.subplots(figsize=(14, 5))
ax.plot(hourly_t.index, hourly_t["kes_all"], label="Kestrel (12-site avg)", linewidth=0.8, alpha=0.85, color="#1f77b4")
ax.plot(hourly_t.index, hourly_t["ws"], label="WS 35 Kneeland St", linewidth=0.8, alpha=0.85, color="#d62728")
ax.plot(hourly_t.index, hourly_t["dep_nu"], label="DEP Nubian Sq.", linewidth=0.8, alpha=0.85, color="#ff7f0e")
ax.set_ylabel("Temperature (°F)")
ax.set_title("Hourly Mean Temperature: Kestrel (aggregated) vs. Reference Monitors", fontsize=13, fontweight="bold")
ax.legend(fontsize=9)
ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
ax.xaxis.set_major_locator(mdates.DayLocator(interval=2))
ax.grid(alpha=0.3)
fig.autofmt_xdate()
fig.tight_layout()
fig.savefig(OUT / "temp_timeseries.png", dpi=150)
plt.close(fig)
print("✓ Saved figures/temp_timeseries.png")

# ── Figure 7: Bar chart mean temperature per site vs references ───────
fig, ax = plt.subplots(figsize=(14, 5))
x = np.arange(len(open_sites) + 2)
t_means = [df.loc[df["siteID"] == s, "kes_mean_temp_f"].mean() for s in open_sites]
t_means += [df["mean_temp_out_f"].mean(), df["dep_FEM_nubian_temp_f"].mean()]
bar_labels_t = [pretty(s) for s in open_sites] + ["WS 35 Kneeland St", "DEP Nubian Sq."]
bar_colors_t = list(colors) + ["#d62728", "#ff7f0e"]

ax.bar(x, t_means, color=bar_colors_t, alpha=0.8, edgecolor="white")
ws_mean = df["mean_temp_out_f"].mean()
nu_mean = df["dep_FEM_nubian_temp_f"].mean()
ax.axhline(ws_mean, color="#d62728", linestyle="--", linewidth=1, label=f"WS 35 Kneeland avg ({ws_mean:.1f}°F)")
ax.axhline(nu_mean, color="#ff7f0e", linestyle="--", linewidth=1, label=f"DEP Nubian avg ({nu_mean:.1f}°F)")
ax.set_xticks(x)
ax.set_xticklabels(bar_labels_t, rotation=45, ha="right", fontsize=8)
ax.set_ylabel("Mean Temperature (°F)")
ax.set_title("Mean Ambient Temperature by Site vs. Reference Monitors", fontsize=13, fontweight="bold")
ax.legend(fontsize=9)
ax.grid(axis="y", alpha=0.3)
fig.tight_layout()
fig.savefig(OUT / "temp_bar_comparison.png", dpi=150)
plt.close(fig)
print("✓ Saved figures/temp_bar_comparison.png")

# ── Figure 8: Scatter Kestrel vs Weather Station (per site) ──────────
fig, axes = plt.subplots(3, 4, figsize=(16, 10), sharex=True, sharey=True)
axes_flat = axes.flatten()
temp_corr_rows = []
for i, site in enumerate(open_sites):
    ax = axes_flat[i]
    sd = df[df["siteID"] == site][["kes_mean_temp_f", "mean_temp_out_f", "dep_FEM_nubian_temp_f"]].dropna()
    if len(sd) > 1:
        ax.scatter(sd["mean_temp_out_f"], sd["kes_mean_temp_f"],
                   alpha=0.15, s=8, color=colors[i])
        corr_ws = sd["kes_mean_temp_f"].corr(sd["mean_temp_out_f"])
        corr_nu = sd["kes_mean_temp_f"].corr(sd["dep_FEM_nubian_temp_f"])
        ax.set_title(f"{pretty(site)}\nr = {corr_ws:.2f}", fontsize=8)
        lims = [min(sd["mean_temp_out_f"].min(), sd["kes_mean_temp_f"].min()),
                max(sd["mean_temp_out_f"].max(), sd["kes_mean_temp_f"].max())]
        ax.plot(lims, lims, "k--", linewidth=0.5, alpha=0.5)
        temp_corr_rows.append({
            "Site": pretty(site),
            "r (vs WS 35Kn)": round(corr_ws, 3),
            "r (vs DEP Nub)": round(corr_nu, 3),
        })
    else:
        ax.set_title(pretty(site), fontsize=8)
    ax.tick_params(labelsize=7)

fig.supxlabel("Weather Station 35 Kneeland St (°F)", fontsize=11)
fig.supylabel("Kestrel Temperature (°F)", fontsize=11)
fig.suptitle("Kestrel vs. Weather Station Temperature — Site-Level Scatter", fontsize=13, fontweight="bold", y=1.01)
fig.tight_layout()
fig.savefig(OUT / "temp_scatter_vs_ws.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("✓ Saved figures/temp_scatter_vs_ws.png")

temp_corr_df = pd.DataFrame(temp_corr_rows)
print("\n--- Correlation: Kestrel Temp vs References ---")
print(temp_corr_df.to_string(index=False))

# ── Diurnal patterns ──────────────────────────────────────────────────
df["hour"] = df["date"].dt.hour

# Figure 9: Diurnal PM2.5
diurnal_pm = df.groupby(["hour"]).agg(
    pa=("pa_mean_pm2_5_atm_b_corr_2", "mean"),
    dep_ct=("dep_FEM_chinatown_pm2_5_ug_m3", "mean"),
    dep_nu=("dep_FEM_nubian_pm2_5_ug_m3", "mean"),
)
fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(diurnal_pm.index, diurnal_pm["pa"], "o-", label="Purple Air (all sites)", color="#1f77b4")
ax.plot(diurnal_pm.index, diurnal_pm["dep_ct"], "s-", label="DEP Chinatown", color="#d62728")
ax.plot(diurnal_pm.index, diurnal_pm["dep_nu"], "^-", label="DEP Nubian Sq.", color="#ff7f0e")
ax.set_xlabel("Hour of Day")
ax.set_ylabel("Mean PM2.5 (µg/m³)")
ax.set_title("Diurnal PM2.5 Pattern: Purple Air vs. DEP FEM Monitors", fontsize=13, fontweight="bold")
ax.legend()
ax.set_xticks(range(0, 24))
ax.grid(alpha=0.3)
fig.tight_layout()
fig.savefig(OUT / "pm25_diurnal.png", dpi=150)
plt.close(fig)
print("✓ Saved figures/pm25_diurnal.png")

# Figure 10: Diurnal Temperature
diurnal_temp = df.groupby(["hour"]).agg(
    kes=("kes_mean_temp_f", "mean"),
    ws=("mean_temp_out_f", "mean"),
    dep_nu=("dep_FEM_nubian_temp_f", "mean"),
)
fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(diurnal_temp.index, diurnal_temp["kes"], "o-", label="Kestrel (all sites)", color="#1f77b4")
ax.plot(diurnal_temp.index, diurnal_temp["ws"], "s-", label="WS 35 Kneeland St", color="#d62728")
ax.plot(diurnal_temp.index, diurnal_temp["dep_nu"], "^-", label="DEP Nubian Sq.", color="#ff7f0e")
ax.set_xlabel("Hour of Day")
ax.set_ylabel("Mean Temperature (°F)")
ax.set_title("Diurnal Temperature Pattern: Kestrel vs. Reference Monitors", fontsize=13, fontweight="bold")
ax.legend()
ax.set_xticks(range(0, 24))
ax.grid(alpha=0.3)
fig.tight_layout()
fig.savefig(OUT / "temp_diurnal.png", dpi=150)
plt.close(fig)
print("✓ Saved figures/temp_diurnal.png")

# ── Save tables as JSON for report generation ─────────────────────────
pm_df.to_json(OUT / "pm25_stats.json", orient="records")
temp_df.to_json(OUT / "temp_stats.json", orient="records")
corr_df.to_json(OUT / "pm25_corr.json", orient="records")
temp_corr_df.to_json(OUT / "temp_corr.json", orient="records")

print("\n✅ All figures and data saved to figures/")

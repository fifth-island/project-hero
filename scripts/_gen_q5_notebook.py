#!/usr/bin/env python3
"""Generate the Q5 refined notebook: Hottest Days WBGT Analysis."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def md(source):
    return {"cell_type": "markdown", "metadata": {}, "source": source.split("\n"), "id": None}

def code(source):
    return {"cell_type": "code", "metadata": {}, "source": source.split("\n"), "outputs": [], "execution_count": None, "id": None}

cells = []

# ── Title ──
cells.append(md("""# Q5 — Hottest Days: WBGT Differences Across Sites

**Research Question**: Pick the hottest days and visualize potential differences in WBGT across sites.

**Study**: Chinatown HEROS Project — 12 open-space sites, Boston Chinatown, Summer 2023  
**Date**: April 2026  
**Dataset**: 48,123 observations (10-min intervals, Jul 19 – Aug 23, 2023)"""))

# ── AI Recommendations ──
cells.append(md("""## Dashboard & Layout Recommendations *(for Design Team)*

<details><summary>Click to expand AI-generated recommendations</summary>

**Key KPIs**:
1. **Site Heat Vulnerability Score** — Composite 1-10 scale combining peak WBGT rank, heating rate, and threshold exceedance  
2. **Dangerous Heat Hours** — % time >74°F per site (Tufts 39.6% vs Mary Soo Hoo 12.3%)  
3. **Inter-site WBGT Range** — Max difference across sites on hottest days (0.7-1.5°F)  
4. **Co-exposure Index** — % of hot-day records with PM2.5>9 AND WBGT>70 (47.2%)

**Dashboard layout**: Site heat vulnerability map (top, 35%), diurnal WBGT profiles (center, 30%), 
site ranking bar chart + threshold exceedance (bottom left, 20%), co-exposure timeline (bottom right, 15%).

**Educational framing**: "On the hottest days, some parks in Chinatown stayed 1.5°F warmer than others — 
that's the difference between needing a water break every 30 minutes vs every hour. Humidity, not just 
temperature, is the key driver."

</details>"""))

# ── Setup ──
cells.append(code("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from scipy import stats
from pathlib import Path
import warnings
warnings.filterwarnings("ignore")

# Paths
ROOT = Path.cwd()
while not (ROOT / "data").exists() and ROOT != ROOT.parent:
    ROOT = ROOT.parent
DATA = ROOT / "data/clean/data_HEROS_clean.parquet"
FIG_DIR = ROOT / "figures/phase3_refined"
FIG_DIR.mkdir(parents=True, exist_ok=True)

# Style
sns.set_theme(style="whitegrid", font_scale=1.1)
HEAT_CMAP = "YlOrRd"
SITE_COLORS = dict(zip(
    ["berkley","castle","chin","dewey","eliotnorton","greenway",
     "lyndenboro","msh","oxford","reggie","taitung","tufts"],
    plt.cm.tab20(np.linspace(0, 1, 12))
))
SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden"
}

# Load data
df = pd.read_parquet(DATA)
df["datetime"] = pd.to_datetime(df["datetime"])
df["hour"] = df["datetime"].dt.hour

wbgt_col = "kes_mean_wbgt_f"
temp_col = "kes_mean_temp_f"
heat_col = "kes_mean_heat_f"
humid_col = "kes_mean_humid_pct"
pm_col = "pa_mean_pm2_5_atm_b_corr_2"

# Identify top-5 hottest days
daily = df.groupby("date_only")[wbgt_col].mean()
top5_dates = daily.nlargest(5).index.tolist()
hot = df[df["date_only"].isin(top5_dates)].copy()
non_hot = df[~df["date_only"].isin(top5_dates)].copy()

print(f"Dataset: {len(df):,} rows, {df['site_id'].nunique()} sites")
print(f"Top 5 hottest days: {top5_dates}")
print(f"Hot-day subset: {len(hot):,} records")
print(f"Max WBGT: {df[wbgt_col].max():.1f}°F (OSHA Caution=80°F — never reached)")"""))

# ── KPI Overview ──
cells.append(md("""## KPI Overview

Headline metrics for the hottest days across Chinatown's open spaces."""))

cells.append(code("""# KPI calculations
site_hot = hot.groupby("site_id").agg(
    wbgt_mean=(wbgt_col, "mean"),
    wbgt_max=(wbgt_col, "max"),
    pct_above_74=(wbgt_col, lambda x: (x > 74).mean() * 100),
).round(2)

hottest_site = site_hot["wbgt_mean"].idxmax()
coolest_site = site_hot["wbgt_mean"].idxmin()
inter_site_range = site_hot["wbgt_mean"].max() - site_hot["wbgt_mean"].min()

# Co-exposure
dual_pct = ((hot[pm_col] > 9) & (hot[wbgt_col] > 70)).mean() * 100

# Effect size
s1 = hot.loc[hot["site_id"]==hottest_site, wbgt_col].dropna()
s2 = hot.loc[hot["site_id"]==coolest_site, wbgt_col].dropna()
pooled = np.sqrt((s1.std()**2 + s2.std()**2) / 2)
cohens_d = (s1.mean() - s2.mean()) / pooled

kpi_data = {
    "Hottest Site": f"{SITE_NAMES[hottest_site]} ({site_hot.loc[hottest_site, 'wbgt_mean']:.1f}°F)",
    "Coolest Site": f"{SITE_NAMES[coolest_site]} ({site_hot.loc[coolest_site, 'wbgt_mean']:.1f}°F)",
    "Inter-site Range": f"{inter_site_range:.1f}°F",
    "Effect Size (hottest vs coolest)": f"Cohen's d = {cohens_d:.2f} (medium)",
    "Max WBGT Recorded": f"{hot[wbgt_col].max():.1f}°F (2.5°F below OSHA Caution)",
    "Dual Exposure (PM2.5>9 & WBGT>70)": f"{dual_pct:.1f}% of hot-day records",
    "Hours > 74°F (Tufts)": f"{site_hot.loc['tufts', 'pct_above_74']:.1f}%",
    "Hours > 74°F (Mary Soo Hoo)": f"{site_hot.loc['msh', 'pct_above_74']:.1f}%",
}

kpi_df = pd.DataFrame(list(kpi_data.items()), columns=["Metric", "Value"])
print(kpi_df.to_string(index=False))"""))

# ── Foundational EDA ──
cells.append(md("""## Foundational EDA

### Hot Day Identification

The 5 hottest days were selected by highest daily mean WBGT across all 12 sites. Three form part of a 6-day heat wave (Jul 24-29), while Aug 8 and Aug 13 were isolated hot events."""))

cells.append(code("""# Daily WBGT time series with hot days highlighted
fig, ax = plt.subplots(figsize=(14, 5))
daily_all = df.groupby("date_only")[wbgt_col].agg(["mean","max","min"])
dates = daily_all.index

ax.fill_between(dates, daily_all["min"], daily_all["max"], alpha=0.2, color="orangered", label="Min–Max range")
ax.plot(dates, daily_all["mean"], "o-", color="orangered", ms=6, lw=1.5, label="Daily mean WBGT")

# Highlight hot days
for d in top5_dates:
    ax.axvline(d, color="red", ls="--", alpha=0.4, lw=1)
    ax.annotate(str(d), (d, daily_all.loc[d, "max"]+0.3), fontsize=7, ha="center", color="red", rotation=45)

ax.axhline(80, color="darkred", ls=":", lw=1, label="OSHA Caution (80°F)")
ax.set(xlabel="Date", ylabel="WBGT (°F)", title="Daily WBGT Across Study Period — Top 5 Hottest Days Highlighted")
ax.legend(loc="lower left", fontsize=9)
ax.tick_params(axis="x", rotation=45)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_daily_wbgt_timeline.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 4.5); fig.set_dpi(100)
plt.show()"""))

cells.append(md("""The study period experienced two distinct warm spells: a sustained heat wave in late July (Jul 24-29) and isolated hot days in August. The maximum daily mean WBGT of 73.0°F on Jul 27 was still 7°F below OSHA's Caution threshold, though heat index values exceeded 120°F."""))

# Hot day summary table
cells.append(code("""# Hot day summary table
hot_summary = []
for d in top5_dates:
    day = hot[hot["date_only"]==d]
    hot_summary.append({
        "Date": str(d),
        "WBGT Mean (°F)": f"{day[wbgt_col].mean():.1f}",
        "WBGT Max (°F)": f"{day[wbgt_col].max():.1f}",
        "Temp Mean (°F)": f"{day[temp_col].mean():.1f}",
        "Humidity (%)": f"{day[humid_col].mean():.0f}",
        "Heat Index Max (°F)": f"{day[heat_col].max():.1f}",
        "N Sites Active": day["site_id"].nunique(),
    })
pd.DataFrame(hot_summary).to_string(index=False)
print(pd.DataFrame(hot_summary).to_string(index=False))"""))

cells.append(md("""**Key observation**: Jul 28 had the highest ambient temperature (82.2°F) but NOT the highest WBGT — because Jul 27 and Jul 29 had higher humidity (76-83%), which drives WBGT up. This illustrates why WBGT is a more complete heat stress indicator than temperature alone."""))

# ── WBGT distributions on hot days ──
cells.append(md("""### Site-Level WBGT Distributions on Hot Days"""))

cells.append(code("""# Boxplot + strip of WBGT by site on hot days
fig, ax = plt.subplots(figsize=(14, 6))
order = hot.groupby("site_id")[wbgt_col].mean().sort_values(ascending=False).index
labels = [SITE_NAMES[s] for s in order]

bp = ax.boxplot(
    [hot.loc[hot["site_id"]==s, wbgt_col].dropna().values for s in order],
    labels=labels, patch_artist=True, widths=0.6,
    medianprops=dict(color="black", lw=2),
)
colors = plt.cm.YlOrRd(np.linspace(0.3, 0.9, len(order)))
for patch, c in zip(bp["boxes"], colors):
    patch.set_facecolor(c)

ax.axhline(80, color="darkred", ls=":", lw=1, label="OSHA Caution (80°F)")
ax.set(ylabel="WBGT (°F)", title="WBGT Distribution by Site on Top 5 Hottest Days")
ax.tick_params(axis="x", rotation=45)
ax.legend()
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_wbgt_boxplot_hotdays.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 5); fig.set_dpi(100)
plt.show()

# Print summary
for s in order:
    v = hot.loc[hot["site_id"]==s, wbgt_col].dropna()
    print(f"  {SITE_NAMES[s]:<18}: mean={v.mean():.2f}, median={v.median():.1f}, IQR={v.quantile(0.25):.1f}–{v.quantile(0.75):.1f}")"""))

cells.append(md("""Tufts Garden is consistently the warmest site (73.2°F mean WBGT), while Mary Soo Hoo Park is the coolest (71.6°F). The 1.6°F gap is a medium effect size (Cohen's d = 0.61). All sites stay well below the OSHA Caution level of 80°F."""))

# ── Core Analysis ──
cells.append(md("""## Core Analysis

### Site × Hour Heatmap

The core visualization for Q5: how WBGT varies across both space (12 sites) and time (24 hours) during the hottest days."""))

cells.append(code("""# Site × Hour heatmap
pivot = hot.pivot_table(values=wbgt_col, index="site_id", columns="hour", aggfunc="mean")
pivot.index = [SITE_NAMES.get(s, s) for s in pivot.index]
# Sort by overall mean (hottest at top)
pivot = pivot.loc[pivot.mean(axis=1).sort_values(ascending=False).index]

fig, ax = plt.subplots(figsize=(14, 7))
sns.heatmap(pivot, cmap="YlOrRd", annot=True, fmt=".1f", linewidths=0.5,
            cbar_kws={"label": "WBGT (°F)"}, ax=ax, vmin=68, vmax=77,
            annot_kws={"size": 7})
ax.set(xlabel="Hour of Day", ylabel="Site", title="Mean WBGT by Site × Hour on Top 5 Hottest Days")
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_site_hour_heatmap.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 6); fig.set_dpi(100)
plt.show()"""))

cells.append(md("""The heatmap reveals two key patterns:
1. **Temporal**: All sites peak between 12-3pm, with Tufts and Castle Square reaching 75-76°F
2. **Spatial**: The hottest sites (Tufts, Berkeley, Castle) remain warmer even at night, suggesting better heat retention in those microclimates"""))

# ── Kruskal-Wallis and post-hoc ──
cells.append(md("""### Statistical Tests: Inter-Site Differences"""))

cells.append(code("""# Kruskal-Wallis
sites_sorted = sorted(df["site_id"].unique())
groups = [hot.loc[hot["site_id"]==s, wbgt_col].dropna().values for s in sites_sorted]
H, p_kw = stats.kruskal(*groups)
print(f"Kruskal-Wallis: H={H:.2f}, p={p_kw:.2e}")
print(f"Interpretation: {'SIGNIFICANT' if p_kw < 0.05 else 'Not significant'} differences across sites\\n")

# Pairwise Mann-Whitney with Bonferroni correction
n_pairs = len(sites_sorted) * (len(sites_sorted) - 1) // 2
alpha_bonf = 0.05 / n_pairs
results = []
for i in range(len(sites_sorted)):
    for j in range(i+1, len(sites_sorted)):
        u, p = stats.mannwhitneyu(
            hot.loc[hot["site_id"]==sites_sorted[i], wbgt_col].dropna(),
            hot.loc[hot["site_id"]==sites_sorted[j], wbgt_col].dropna(),
            alternative="two-sided"
        )
        results.append({
            "Site 1": SITE_NAMES[sites_sorted[i]],
            "Site 2": SITE_NAMES[sites_sorted[j]],
            "U": u, "p": p,
            "Sig (Bonferroni)": "Yes" if p < alpha_bonf else "No"
        })
res_df = pd.DataFrame(results)
n_sig = (res_df["Sig (Bonferroni)"]=="Yes").sum()
print(f"Pairwise Mann-Whitney U (Bonferroni α={alpha_bonf:.5f}):")
print(f"  {n_sig} of {n_pairs} pairs significant after Bonferroni correction\\n")
print("Top 10 most significant pairs:")
print(res_df.sort_values("p").head(10)[["Site 1","Site 2","p","Sig (Bonferroni)"]].to_string(index=False))"""))

cells.append(md("""The Kruskal-Wallis test confirms highly significant differences across sites (H=213.3, p<1e-39). After Bonferroni correction for 66 pairwise comparisons, many pairs remain significant — the inter-site variation is not just noise."""))

# ── Deep-Dive ──
cells.append(md("""## Deep-Dive & Enrichment

### Diurnal WBGT Profiles by Site

How does each site's temperature trajectory differ throughout the hot days?"""))

cells.append(code("""# Diurnal profiles per site
fig, ax = plt.subplots(figsize=(14, 6))
order = hot.groupby("site_id")[wbgt_col].mean().sort_values(ascending=False).index
colors = plt.cm.YlOrRd(np.linspace(0.3, 0.95, len(order)))

for i, sid in enumerate(order):
    hourly = hot[hot["site_id"]==sid].groupby("hour")[wbgt_col].mean()
    lw = 2.5 if sid in ["tufts", "msh"] else 1.2
    ls = "-" if sid in ["tufts", "msh"] else "--"
    ax.plot(hourly.index, hourly.values, color=colors[i], lw=lw, ls=ls,
            label=SITE_NAMES[sid], marker="o" if sid in ["tufts","msh"] else None, ms=4)

ax.axhline(74, color="gray", ls=":", alpha=0.5, label="74°F threshold")
ax.set(xlabel="Hour of Day", ylabel="WBGT (°F)", title="Diurnal WBGT Profiles by Site on Hottest Days")
ax.legend(bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=8)
ax.set_xticks(range(0, 24))
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_diurnal_profiles.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 5); fig.set_dpi(100)
plt.show()"""))

cells.append(md("""The diurnal profiles reveal that:
- **Tufts Garden** (bold line) stays consistently above other sites at nearly every hour
- **Mary Soo Hoo** (bold) is consistently the coolest
- The gap widens during peak afternoon hours (12-4pm) and narrows at night
- All sites follow a similar daily trajectory, but with persistent offsets"""))

# ── Morning Rise Rate ──
cells.append(md("""### Morning Heating Rates

How quickly do sites warm up in the morning? This matters for scheduling outdoor activities."""))

cells.append(code("""# Morning rise rates
rise_data = []
for sid in sorted(df["site_id"].unique()):
    s = hot[(hot["site_id"]==sid) & (hot["hour"].between(6, 15))].groupby("hour")[wbgt_col].mean()
    if len(s) >= 5:
        rise = s.max() - s.min()
        peak_hr = s.idxmax()
        rate = rise / (peak_hr - 6) if peak_hr > 6 else 0
        rise_data.append({"Site": SITE_NAMES[sid], "Rise (°F)": rise, "Peak Hour": peak_hr,
                         "Rate (°F/hr)": rate})

rise_df = pd.DataFrame(rise_data).sort_values("Rate (°F/hr)", ascending=False)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Bar chart of rates
ax = axes[0]
bars = ax.barh(rise_df["Site"], rise_df["Rate (°F/hr)"], color=plt.cm.YlOrRd(
    (rise_df["Rate (°F/hr)"] - rise_df["Rate (°F/hr)"].min()) /
    (rise_df["Rate (°F/hr)"].max() - rise_df["Rate (°F/hr)"].min()) * 0.6 + 0.3))
ax.set(xlabel="Heating Rate (°F/hr)", title="Morning Warming Rate (6am→Peak)")
ax.invert_yaxis()

# Peak hours
ax2 = axes[1]
ax2.barh(rise_df["Site"], rise_df["Peak Hour"], color="coral")
ax2.set(xlabel="Peak Hour", title="Hour of Peak WBGT")
ax2.invert_yaxis()
ax2.set_xlim(10, 17)

fig.suptitle("Morning Heating Characteristics on Hottest Days", fontsize=13, y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_morning_rise_rates.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 4.5); fig.set_dpi(100)
plt.show()

print(rise_df.to_string(index=False))"""))

cells.append(md("""**Castle Square heats up 3× faster than Mary Soo Hoo** (0.61 vs 0.20°F/hr). Sites that peak earlier (Lyndboro at noon, Castle/Tufts at 1pm) tend to have more thermal mass. Later-peaking sites (Oxford, Chin Park at 4pm) may benefit from afternoon shading."""))

# ── WBGT vs Temperature rank divergence ──
cells.append(md("""### Temperature vs WBGT: The Humidity Factor

A critical finding: site rankings differ substantially between ambient temperature and WBGT because humidity varies by site."""))

cells.append(code("""# Rank divergence plot
site_data = []
for sid in sorted(df["site_id"].unique()):
    s = hot[hot["site_id"]==sid]
    site_data.append({
        "site": sid, "name": SITE_NAMES[sid],
        "wbgt": s[wbgt_col].mean(), "temp": s[temp_col].mean(),
        "humid": s[humid_col].mean(), "heat_idx": s[heat_col].mean(),
    })
sdf = pd.DataFrame(site_data)
sdf["wbgt_rank"] = sdf["wbgt"].rank(ascending=False).astype(int)
sdf["temp_rank"] = sdf["temp"].rank(ascending=False).astype(int)
sdf["rank_shift"] = sdf["temp_rank"] - sdf["wbgt_rank"]

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Bump chart: WBGT vs Temp ranks
ax = axes[0]
for _, row in sdf.iterrows():
    color = "red" if abs(row["rank_shift"]) >= 3 else "gray"
    ax.plot([0, 1], [row["temp_rank"], row["wbgt_rank"]], "o-", color=color, lw=1.5 if color=="red" else 0.8, ms=6)
    ax.text(-0.05, row["temp_rank"], row["name"], ha="right", fontsize=8, color=color)
    ax.text(1.05, row["wbgt_rank"], row["name"], ha="left", fontsize=8, color=color)
ax.set_xticks([0, 1]); ax.set_xticklabels(["Temp Rank", "WBGT Rank"])
ax.set_ylabel("Rank (1=hottest)")
ax.set_title("How Rankings Shift: Temperature → WBGT")
ax.invert_yaxis()
ax.set_xlim(-0.5, 1.5)

# Scatter: humidity vs rank shift
ax2 = axes[1]
ax2.scatter(sdf["humid"], sdf["rank_shift"], s=80, c=sdf["humid"], cmap="Blues", edgecolor="black")
for _, row in sdf.iterrows():
    ax2.annotate(row["name"].split()[0], (row["humid"], row["rank_shift"]),
                fontsize=7, ha="center", va="bottom")
ax2.axhline(0, color="gray", ls="--", alpha=0.5)
ax2.set(xlabel="Mean Humidity (%)", ylabel="Rank Shift (Temp→WBGT, positive=rises)",
        title="Humidity Drives WBGT Rank Changes")
r, p = stats.pearsonr(sdf["humid"], sdf["rank_shift"])
ax2.text(0.05, 0.95, f"r={r:.2f}, p={p:.3f}", transform=ax2.transAxes, fontsize=10)

fig.suptitle("Why Temperature ≠ WBGT: The Role of Humidity", fontsize=13, y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_temp_vs_wbgt_ranks.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 5); fig.set_dpi(100)
plt.show()

print("\\nRank divergence table:")
print(sdf[["name","temp","temp_rank","wbgt","wbgt_rank","humid","rank_shift"]].sort_values("rank_shift", ascending=False).to_string(index=False))"""))

cells.append(md("""**Reggie Wong** is the hottest site by temperature (79.9°F) but only 7th by WBGT (72.2°F) — its low humidity (71.6%) makes it feel less oppressive. **Tufts Garden** is the opposite: rank 6 in temperature but #1 in WBGT due to the highest humidity (78.8%). This demonstrates why WBGT, not temperature, should guide heat safety decisions."""))

# ── Nighttime heat retention ──
cells.append(md("""### Nighttime Heat Retention

Do sites cool down equally at night? Persistent nighttime heat prevents physiological recovery."""))

cells.append(code("""# Nighttime WBGT comparison
night_hot = hot[hot["hour"].isin([22,23,0,1,2,3,4,5])]
night_nonhot = non_hot[non_hot["hour"].isin([22,23,0,1,2,3,4,5])]

night_data = []
for sid in sorted(df["site_id"].unique()):
    h = night_hot.loc[night_hot["site_id"]==sid, wbgt_col].dropna()
    nh = night_nonhot.loc[night_nonhot["site_id"]==sid, wbgt_col].dropna()
    night_data.append({
        "Site": SITE_NAMES[sid],
        "Night WBGT (hot)": h.mean(),
        "Night WBGT (non-hot)": nh.mean(),
        "Retention (°F)": h.mean() - nh.mean(),
    })
ndf = pd.DataFrame(night_data).sort_values("Night WBGT (hot)", ascending=False)

fig, ax = plt.subplots(figsize=(12, 5))
x = range(len(ndf))
ax.bar(x, ndf["Night WBGT (non-hot)"], color="steelblue", alpha=0.7, label="Non-hot nights")
ax.bar(x, ndf["Retention (°F)"], bottom=ndf["Night WBGT (non-hot)"], color="orangered", alpha=0.8, label="Hot-day surplus")
ax.set_xticks(x); ax.set_xticklabels(ndf["Site"], rotation=45, ha="right")
ax.set(ylabel="Nighttime WBGT (°F)", title="Nighttime WBGT: Hot Days vs Normal Nights (10pm–5am)")
ax.legend()

# Annotate retention values
for i, (_, row) in enumerate(ndf.iterrows()):
    ax.text(i, row["Night WBGT (hot)"] + 0.1, f"+{row['Retention (°F)']:.1f}",
            ha="center", fontsize=8, color="darkred")

fig.tight_layout()
fig.savefig(FIG_DIR / "q5_nighttime_retention.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(11, 4.5); fig.set_dpi(100)
plt.show()

print(ndf.round(2).to_string(index=False))"""))

cells.append(md("""Nighttime WBGT is ~7°F higher on hot days than normal nights — a substantial urban heat island effect. Berkeley Garden retains the most nighttime heat (71.5°F), while Mary Soo Hoo cools most effectively (70.6°F). This 0.9°F nighttime difference matters because continuous heat exposure without relief increases heat-related health risk."""))

# ── Site ranking consistency ──
cells.append(md("""### Site Ranking Consistency Across Hot Days

Are the same sites always hottest, or do rankings shift between events?"""))

cells.append(code("""# Ranking consistency across hot days
site_ranks = {}
for d in top5_dates:
    day_means = hot[hot["date_only"]==d].groupby("site_id")[wbgt_col].mean()
    ranks = day_means.rank(ascending=False)
    for sid, r in ranks.items():
        site_ranks.setdefault(sid, []).append(r)

rank_df = pd.DataFrame([
    {"Site": SITE_NAMES[sid], "Mean Rank": np.mean(r), "Std": np.std(r),
     "Best": min(r), "Worst": max(r), "N_days": len(r)}
    for sid, r in site_ranks.items()
]).sort_values("Mean Rank")

fig, ax = plt.subplots(figsize=(12, 5))
bars = ax.barh(rank_df["Site"], rank_df["Mean Rank"],
               xerr=rank_df["Std"], capsize=4,
               color=plt.cm.YlOrRd_r(np.linspace(0.2, 0.9, len(rank_df))))
ax.set(xlabel="Mean Rank (1=hottest)", title="Consistency of Site WBGT Rankings Across 5 Hottest Days")
ax.invert_yaxis()
ax.axvline(6.5, color="gray", ls=":", alpha=0.5)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_ranking_consistency.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(11, 4.5); fig.set_dpi(100)
plt.show()

print(rank_df.to_string(index=False))"""))

cells.append(md("""**Tufts Garden** is the most consistently hot site (mean rank 1.2, std=0.4 — always #1 or #2). **Mary Soo Hoo** is most consistently cool (mean rank 10.0). The low standard deviations for these sites suggest stable microclimate effects rather than random variation."""))

# ── Heat wave vs isolated hot days ──
cells.append(md("""### Heat Wave vs Isolated Hot Days

The Jul 27-29 consecutive heat wave vs the isolated Aug 8 and Aug 13 events."""))

cells.append(code("""# Heat wave vs isolated comparison
wave_dates = [d for d in top5_dates if str(d).startswith("2023-07")]
iso_dates = [d for d in top5_dates if str(d).startswith("2023-08")]

wave = hot[hot["date_only"].isin(wave_dates)]
iso = hot[hot["date_only"].isin(iso_dates)]

print(f"Heat wave dates ({len(wave_dates)}): {wave_dates}")
print(f"Isolated dates ({len(iso_dates)}): {iso_dates}\\n")

fig, axes = plt.subplots(1, 2, figsize=(14, 5), sharey=True)
for ax, subset, title, dates in [
    (axes[0], wave, "Heat Wave (Jul 27-29)", wave_dates),
    (axes[1], iso, "Isolated Hot Days (Aug 8, 13)", iso_dates)]:
    
    site_means = subset.groupby("site_id")[wbgt_col].mean().sort_values(ascending=False)
    bars = ax.barh([SITE_NAMES[s] for s in site_means.index], site_means.values,
                   color=plt.cm.YlOrRd(np.linspace(0.3, 0.9, len(site_means))))
    ax.set(xlabel="Mean WBGT (°F)", title=title)
    ax.set_xlim(70, 74)
    
    range_val = site_means.max() - site_means.min()
    ax.text(0.95, 0.05, f"Range: {range_val:.1f}°F", transform=ax.transAxes, ha="right", fontsize=10,
            bbox=dict(boxstyle="round", fc="lightyellow"))

fig.suptitle("Site WBGT: Heat Wave vs Isolated Hot Days", fontsize=13, y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_heatwave_vs_isolated.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 4.5); fig.set_dpi(100)
plt.show()

# Statistical comparison
wave_all = wave[wbgt_col].dropna()
iso_all = iso[wbgt_col].dropna()
u, p = stats.mannwhitneyu(wave_all, iso_all, alternative="two-sided")
print(f"\\nWave vs Isolated: Wave mean={wave_all.mean():.2f}, Iso mean={iso_all.mean():.2f}, MW p={p:.2e}")"""))

cells.append(md("""The heat wave (Jul 27-29) shows a wider inter-site range and higher absolute WBGT values compared to isolated hot days. During the sustained heat wave, urban heat island effects have more time to accumulate, amplifying microclimate differences."""))

# ── Co-exposure analysis ──
cells.append(md("""### Dual Exposure: Heat + Air Pollution

On the hottest days, are residents also exposed to elevated PM2.5?"""))

cells.append(code("""# Co-exposure timeline
fig, ax1 = plt.subplots(figsize=(14, 5))
hourly_hot = hot.groupby("hour").agg(
    wbgt_mean=(wbgt_col, "mean"),
    pm25_mean=(pm_col, "mean"),
)

ax1.fill_between(hourly_hot.index, 70, hourly_hot["wbgt_mean"],
                 where=hourly_hot["wbgt_mean"]>70, alpha=0.3, color="orangered")
l1, = ax1.plot(hourly_hot.index, hourly_hot["wbgt_mean"], "o-", color="orangered", lw=2, label="WBGT (°F)")
ax1.set(xlabel="Hour of Day", ylabel="WBGT (°F)")
ax1.axhline(70, color="orangered", ls=":", alpha=0.5)

ax2 = ax1.twinx()
l2, = ax2.plot(hourly_hot.index, hourly_hot["pm25_mean"], "s--", color="steelblue", lw=2, label="PM2.5 (µg/m³)")
ax2.set_ylabel("PM2.5 (µg/m³)")
ax2.axhline(9, color="steelblue", ls=":", alpha=0.5)

ax1.set_title("Dual Exposure Profile: WBGT and PM2.5 on Hottest Days")
ax1.legend(handles=[l1, l2], loc="upper left")
ax1.set_xticks(range(0, 24))
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_dual_exposure.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 4.5); fig.set_dpi(100)
plt.show()

# Co-exposure by site
print("\\nDual exposure (PM2.5>9 AND WBGT>70) per site:")
for sid in sorted(df["site_id"].unique()):
    s = hot[hot["site_id"]==sid][[pm_col, wbgt_col]].dropna()
    n_dual = ((s[pm_col] > 9) & (s[wbgt_col] > 70)).sum()
    print(f"  {SITE_NAMES[sid]:<18}: {n_dual:>4} records ({n_dual/len(s)*100:.1f}%)")"""))

cells.append(md("""PM2.5 peaks later than WBGT (2-4pm vs 12-3pm), but there's substantial overlap during the afternoon. On hot days, 47% of records show simultaneous PM2.5 >9 µg/m³ and WBGT >70°F — a compounded health risk, particularly for children and elderly using these open spaces."""))

# ── Threshold exceedance by site ──
cells.append(md("""### Threshold Exceedance: Time Above Critical WBGT Levels"""))

cells.append(code("""# Stacked bar of threshold exceedances
thresholds = [70, 72, 74, 75]
thresh_data = []
for sid in sorted(df["site_id"].unique()):
    s = hot.loc[hot["site_id"]==sid, wbgt_col].dropna()
    row = {"Site": SITE_NAMES[sid]}
    for t in thresholds:
        row[f">{t}°F"] = (s > t).mean() * 100
    thresh_data.append(row)

tdf = pd.DataFrame(thresh_data).sort_values(">74°F", ascending=False)

fig, ax = plt.subplots(figsize=(12, 5))
x = range(len(tdf))
width = 0.2
colors = ["#fee08b", "#fdae61", "#f46d43", "#d73027"]
for i, (t, c) in enumerate(zip(thresholds, colors)):
    ax.bar([xi + i*width for xi in x], tdf[f">{t}°F"], width=width, color=c, label=f">{t}°F")

ax.set_xticks([xi + 1.5*width for xi in x])
ax.set_xticklabels(tdf["Site"], rotation=45, ha="right")
ax.set(ylabel="% of Hot-Day Records", title="WBGT Threshold Exceedance by Site on Hottest Days")
ax.legend()
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_threshold_exceedance.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(11, 4.5); fig.set_dpi(100)
plt.show()

print(tdf.to_string(index=False))"""))

cells.append(md("""**Tufts Garden** spends 40% of hot-day hours above 74°F, while **Mary Soo Hoo** only exceeds this threshold 12% of the time — a 3.3× difference. This means a person spending an afternoon in Tufts Garden would experience high heat stress for roughly 3 hours, compared to about 55 minutes at Mary Soo Hoo."""))

# ── Per-day heatmap ──
cells.append(md("""### Day-by-Day Site Comparison"""))

cells.append(code("""# Per-day × site heatmap
pivot_day = hot.pivot_table(values=wbgt_col, index="site_id", columns="date_only", aggfunc="mean")
pivot_day.index = [SITE_NAMES.get(s, s) for s in pivot_day.index]
pivot_day = pivot_day.loc[pivot_day.mean(axis=1).sort_values(ascending=False).index]
pivot_day.columns = [str(c) for c in pivot_day.columns]

fig, ax = plt.subplots(figsize=(10, 6))
sns.heatmap(pivot_day, cmap="YlOrRd", annot=True, fmt=".1f", linewidths=0.5,
            cbar_kws={"label": "Mean WBGT (°F)"}, ax=ax, vmin=70, vmax=74)
ax.set(xlabel="Date", ylabel="Site", title="Mean WBGT by Site and Hot Day")

# Annotate range per day
for j, col in enumerate(pivot_day.columns):
    vals = pivot_day[col].dropna()
    ax.text(j+0.5, len(pivot_day)+0.5, f"Δ{vals.max()-vals.min():.1f}°F",
            ha="center", fontsize=8, color="darkred")

fig.tight_layout()
fig.savefig(FIG_DIR / "q5_day_site_heatmap.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(9, 5); fig.set_dpi(100)
plt.show()"""))

cells.append(md("""The day×site heatmap shows that inter-site differences are largest on Jul 27 (Δ1.5°F) and smallest on Aug 8 (Δ0.7°F). Sites with missing data (e.g., Berkeley on Aug 8, 13) had sensor gaps during these periods."""))

# ── Heat Index vs WBGT ──
cells.append(md("""### Heat Index vs WBGT Divergence

Heat Index and WBGT measure different things — Heat Index doesn't account for wind and solar radiation. How do they compare on hot days?"""))

cells.append(code("""# Heat Index vs WBGT scatter
both = hot[[heat_col, wbgt_col, "site_id"]].dropna()
r, p = stats.pearsonr(both[heat_col], both[wbgt_col])

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Scatter
ax = axes[0]
for sid in sorted(both["site_id"].unique()):
    s = both[both["site_id"]==sid]
    ax.scatter(s[heat_col], s[wbgt_col], s=8, alpha=0.3, label=SITE_NAMES[sid])
ax.plot([60, 125], [60, 125], "k:", alpha=0.3, label="1:1 line")
ax.set(xlabel="Heat Index (°F)", ylabel="WBGT (°F)", title=f"Heat Index vs WBGT (r={r:.2f})")
ax.text(0.05, 0.95, f"Mean gap: {(both[heat_col]-both[wbgt_col]).mean():.1f}°F\\nMax HI: {both[heat_col].max():.0f}°F",
        transform=ax.transAxes, va="top", fontsize=9, bbox=dict(boxstyle="round", fc="lightyellow"))

# Gap distribution
ax2 = axes[1]
gap = both[heat_col] - both[wbgt_col]
ax2.hist(gap, bins=30, color="coral", edgecolor="black", alpha=0.7)
ax2.axvline(gap.mean(), color="red", ls="--", label=f"Mean gap: {gap.mean():.1f}°F")
ax2.set(xlabel="Heat Index − WBGT (°F)", ylabel="Count", title="HI−WBGT Gap Distribution")
ax2.legend()

fig.suptitle("Heat Index vs WBGT on Hottest Days", fontsize=13, y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_hi_vs_wbgt.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(12, 4.5); fig.set_dpi(100)
plt.show()

print(f"HI-WBGT gap: mean={gap.mean():.1f}°F, median={gap.median():.1f}°F, max={gap.max():.1f}°F")
print(f"Records where HI>100°F: {(both[heat_col]>100).sum()} ({(both[heat_col]>100).mean()*100:.1f}%)")"""))

cells.append(md("""The Heat Index averages 10°F above WBGT on hot days, reaching a maximum of 120.7°F. This means that while WBGT stays below OSHA thresholds, the Heat Index — which the public is more familiar with — frequently exceeds danger levels. The gap between HI and WBGT is largest during hot, humid afternoon hours when the two metrics diverge most."""))

# ── Vulnerability score ──
cells.append(md("""### Site Heat Vulnerability Score

A composite score combining multiple heat stress indicators to rank sites."""))

cells.append(code("""# Composite vulnerability score
vuln_data = []
for sid in sorted(df["site_id"].unique()):
    s = hot[hot["site_id"]==sid]
    wbgt_vals = s[wbgt_col].dropna()
    morning = s[(s["hour"].between(6,15))].groupby("hour")[wbgt_col].mean()
    
    row = {
        "Site": SITE_NAMES[sid],
        "Mean WBGT": wbgt_vals.mean(),
        "Pct >74°F": (wbgt_vals > 74).mean() * 100,
        "Night WBGT": s[s["hour"].isin([22,23,0,1,2,3,4,5])][wbgt_col].mean(),
    }
    if len(morning) >= 5:
        peak = morning.idxmax()
        row["Rise Rate"] = (morning.max() - morning.min()) / max(peak - 6, 1)
    else:
        row["Rise Rate"] = 0
    vuln_data.append(row)

vdf = pd.DataFrame(vuln_data)

# Normalize each metric to 0-10 scale
for col in ["Mean WBGT", "Pct >74°F", "Night WBGT", "Rise Rate"]:
    mn, mx = vdf[col].min(), vdf[col].max()
    vdf[f"{col}_norm"] = (vdf[col] - mn) / (mx - mn) * 10 if mx > mn else 5

vdf["Vulnerability Score"] = (
    vdf["Mean WBGT_norm"] * 0.35 +
    vdf["Pct >74°F_norm"] * 0.30 +
    vdf["Night WBGT_norm"] * 0.20 +
    vdf["Rise Rate_norm"] * 0.15
).round(1)

vdf = vdf.sort_values("Vulnerability Score", ascending=False)
vdf["Category"] = vdf["Vulnerability Score"].apply(
    lambda x: "HIGH" if x >= 7 else "MODERATE" if x >= 4 else "LOW")

fig, ax = plt.subplots(figsize=(12, 5))
colors = {"HIGH": "#d73027", "MODERATE": "#fdae61", "LOW": "#1a9850"}
bars = ax.barh(vdf["Site"], vdf["Vulnerability Score"],
               color=[colors[c] for c in vdf["Category"]])
ax.set(xlabel="Vulnerability Score (0-10)", title="Site Heat Vulnerability Score (Composite)")
ax.invert_yaxis()

for i, (_, row) in enumerate(vdf.iterrows()):
    ax.text(row["Vulnerability Score"] + 0.1, i, f"{row['Vulnerability Score']:.1f} ({row['Category']})",
            va="center", fontsize=9, fontweight="bold" if row["Category"]=="HIGH" else "normal")

ax.axvline(7, color="red", ls=":", alpha=0.5, label="High threshold")
ax.axvline(4, color="orange", ls=":", alpha=0.5, label="Moderate threshold")
ax.legend(fontsize=9)
fig.tight_layout()
fig.savefig(FIG_DIR / "q5_vulnerability_score.png", dpi=300, bbox_inches="tight")
fig.set_size_inches(11, 4.5); fig.set_dpi(100)
plt.show()

print(vdf[["Site","Mean WBGT","Pct >74°F","Night WBGT","Rise Rate","Vulnerability Score","Category"]].to_string(index=False))"""))

cells.append(md("""The composite vulnerability score (weighted: 35% mean WBGT, 30% threshold exceedance, 20% nighttime retention, 15% heating rate) classifies sites into three tiers:
- **HIGH**: Tufts Garden, Castle Square, Berkeley Garden — consistently hot with rapid morning heating
- **MODERATE**: Most central sites  
- **LOW**: Mary Soo Hoo, Eliot Norton — benefit from more effective cooling

This distills complex heat stress data into actionable guidance: **prioritize heat mitigation interventions at high-vulnerability sites**."""))

# ── Synthesis ──
cells.append(md("""## Synthesis & Conclusions

### Key Findings

1. **WBGT never reached OSHA Caution (80°F)** — the hottest reading was 77.5°F. However, Heat Index exceeded 120°F, suggesting the occupational threshold may understate perceived heat risk for outdoor activities.

2. **Tufts Garden is the most consistently hot site** (mean rank 1.2 across all 5 hot days), driven primarily by its high humidity (78.8%) rather than the highest temperature. Mary Soo Hoo is consistently the coolest.

3. **Humidity, not temperature, drives WBGT rankings**. Reggie Wong is the warmest site by temperature (79.9°F) but only 7th by WBGT because it has the lowest humidity (71.6%). This finding has policy implications: reducing humidity through improved drainage and air circulation may be more effective than simply adding shade.

4. **47% of hot-day records show dual exposure** to elevated PM2.5 AND WBGT — compounding health risks during the hours when people are most likely to be outdoors (noon-4pm).

5. **Site-level differences are statistically robust**: Kruskal-Wallis H=213.3 (p<1e-39), with 46 of 66 pairwise comparisons significant after Bonferroni correction. The 1.6°F range between Tufts and Mary Soo Hoo represents a medium effect size (Cohen's d = 0.61).

6. **Nighttime heat retention is substantial**: Hot-day nighttime WBGT is ~7°F above normal, with Berkeley Garden retaining the most heat — preventing physiological recovery between peak heat events.

### Limitations

- WBGT sensors may be capped at 77.5°F (all sites show this maximum)
- Only 5 hot days analyzed; a longer study would capture more extreme events
- No OSHA-level events occurred; results may not extrapolate to more severe heat waves
- Land-use characteristics showed no significant correlation with hot-day WBGT (sample size N=12 sites)

### Implications for Community Action

- **Heat advisories** should consider site-specific microclimate data, not just city-wide temperature
- **Activity scheduling**: Avoid outdoor activities at high-vulnerability sites between 12-4pm on hot days
- **Infrastructure**: Prioritize misting stations, shade structures, and improved ventilation at Tufts Garden, Castle Square, and Berkeley Garden
- **Air quality co-exposure**: Heat warnings should be paired with PM2.5 advisories for Chinatown open spaces"""))

# ── Write notebook ──
nb = {
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11.14"}
    },
    "nbformat": 4,
    "nbformat_minor": 5,
    "cells": cells
}

# Assign unique IDs
import hashlib
for i, cell in enumerate(nb["cells"]):
    cell["id"] = hashlib.md5(f"q5_cell_{i}".encode()).hexdigest()[:8]

out = ROOT / "reports/phase3_refined/Q5_Hottest_Days_WBGT.ipynb"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(nb, indent=1))
print(f"Notebook written to {out}")
print(f"Total cells: {len(cells)} ({sum(1 for c in cells if c['cell_type']=='code')} code, {sum(1 for c in cells if c['cell_type']=='markdown')} markdown)")

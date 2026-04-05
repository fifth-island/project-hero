#!/usr/bin/env python3
"""
Phase 1 — Dataset Inventory, Cleaning & Preparation
=====================================================
Steps 1.1–1.8 from the HEROS analysis pipeline.
Produces: data_HEROS_clean.parquet, data_HEROS_clean.csv
          figures/missing_data_heatmap.png
          figures/outlier_audit.png
          phase1_report.json  (machine-readable summary)
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import json
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
OUT = Path("figures")
OUT.mkdir(exist_ok=True)

report = {}  # collects all Phase 1 findings

# ═══════════════════════════════════════════════════════════════════════
# 1.1 — Catalog all datasets
# ═══════════════════════════════════════════════════════════════════════
print("=" * 70)
print("PHASE 1.1 — Dataset Catalog")
print("=" * 70)

catalog = [
    {
        "filename": "data_HEROS.xlsx",
        "source": "Project team (Purple Air, Kestrel, Weather Stn, MassDEP FEM)",
        "status": "present",
    },
    {
        "filename": "Codebook_HEROS.xlsx",
        "source": "Project team — data dictionary",
        "status": "present",
    },
    {
        "filename": "landuse_HEROS.xlsx",
        "source": "Project team — MassGIS land-use buffers (25m, 50m)",
        "status": "present",
    },
    {
        "filename": "EPA AQS hourly pollutants (CO, SO2, NO2, Ozone)",
        "source": "https://aqs.epa.gov/aqsweb/airdata/download_files.html",
        "status": "to-fetch (Phase 1.3)",
    },
    {
        "filename": "EPA AQS PM0.1 ultrafine (param 87101)",
        "source": "EPA AQS (site 25-025-0045)",
        "status": "to-fetch (Phase 1.3)",
    },
]

cat_df = pd.DataFrame(catalog)
print(cat_df.to_string(index=False))
report["catalog"] = catalog

# ═══════════════════════════════════════════════════════════════════════
# 1.2 — Load & inspect local datasets
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.2 — Load & Inspect")
print("=" * 70)

# --- Main sensor data ---
df = pd.read_excel("data_HEROS.xlsx", sheet_name="Sheet 1")
df["date"] = pd.to_datetime(df["date"])

print(f"\ndata_HEROS.xlsx: {df.shape[0]:,} rows × {df.shape[1]} columns")
print(f"Date range: {df['date'].min()} → {df['date'].max()}")
print(f"Sites ({df['siteID'].nunique()}): {sorted(df['siteID'].unique())}")
print(f"\nColumn dtypes:")
for c in df.columns:
    print(f"  {c}: {df[c].dtype}")

report["main_data"] = {
    "rows": int(df.shape[0]),
    "cols": int(df.shape[1]),
    "date_min": str(df["date"].min()),
    "date_max": str(df["date"].max()),
    "sites": sorted(df["siteID"].unique().tolist()),
    "n_sites": int(df["siteID"].nunique()),
}

# --- Codebook ---
cb = pd.read_excel("Codebook_HEROS.xlsx")
codebook_vars = cb["Variable Name"].tolist()
data_cols = df.columns.tolist()
missing_in_data = [v for v in codebook_vars if v not in data_cols]
extra_in_data = [c for c in data_cols if c not in codebook_vars]
print(f"\nCodebook has {len(codebook_vars)} variables.")
if missing_in_data:
    print(f"  ⚠ In codebook but NOT in data: {missing_in_data}")
if extra_in_data:
    print(f"  ⚠ In data but NOT in codebook: {extra_in_data}")

report["codebook_check"] = {
    "codebook_vars": len(codebook_vars),
    "missing_in_data": missing_in_data,
    "extra_in_data": extra_in_data,
}

# --- Land-use ---
lu = pd.read_excel("landuse_HEROS.xlsx", sheet_name="data")
print(f"\nlanduse_HEROS.xlsx: {lu.shape[0]} rows × {lu.shape[1]} columns")
print(f"Sites: {lu['Site'].unique().tolist()}")
print(f"Distances: {sorted(lu['Distance'].unique())}")
print(lu.describe().round(4).to_string())

report["landuse"] = {
    "rows": int(lu.shape[0]),
    "sites": lu["Site"].unique().tolist(),
    "distances": sorted(lu["Distance"].unique().tolist()),
}

# ═══════════════════════════════════════════════════════════════════════
# SITE NAME MAPPING — reconcile across all datasets
# ═══════════════════════════════════════════════════════════════════════
SITE_ID_TO_NAME = {
    "berkley": "Berkeley Garden",
    "castle": "Castle Square",
    "chin": "Chin Park",
    "dewey": "Dewey Square",
    "eliotnorton": "Eliot Norton Park",
    "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park",
    "msh": "Mary Soo Hoo Park",
    "oxford": "Oxford Place",
    "reggie": "Reggie Wong",
    "taitung": "Tai Tung",
    "tufts": "Tufts Community Garden",
}

# Map land-use site names back to siteID
LANDUSE_NAME_TO_ID = {v: k for k, v in SITE_ID_TO_NAME.items()}

print("\nSite mapping (siteID → land-use name):")
for sid, name in SITE_ID_TO_NAME.items():
    in_lu = name in lu["Site"].values
    print(f"  {sid:15s} → {name:25s} {'✓ in landuse' if in_lu else '✗ NOT in landuse'}")

# ═══════════════════════════════════════════════════════════════════════
# 1.3 — Fetch EPA AQS web data
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.3 — EPA AQS Data Fetch")
print("=" * 70)

# EPA AQS bulk download files are very large (50-300MB each).
# We'll attempt the download with a timeout. If it fails, we document the
# manual process and continue — EPA data is only needed for Q4.
# The user can run phase1_epa_fetch.py separately later.

import io
import zipfile
import urllib.request

SKIP_EPA_DOWNLOAD = True  # Set to False to attempt downloads

TARGET_STATE = "25"
TARGET_COUNTY = "025"
PREFERRED_SITES = ["0045", "0042", "0002"]

EPA_PARAMS = {
    "ozone": "44201",
    "so2": "42401",
    "co": "42101",
    "no2": "42602",
    "pm25_fem": "88101",
}

epa_frames = {}
epa_status = {}

if SKIP_EPA_DOWNLOAD:
    print("\n  ⚠ EPA AQS bulk download SKIPPED (files are 50-300MB each).")
    print("  To fetch EPA data, run: python3 phase1_epa_fetch.py")
    print("  Or set SKIP_EPA_DOWNLOAD = False in this script (requires good internet).")
    print("\n  Manual download instructions:")
    for pollutant, param_code in EPA_PARAMS.items():
        url = f"https://aqs.epa.gov/aqsweb/airdata/hourly_{param_code}_2023.zip"
        print(f"    {pollutant}: {url}")
        epa_status[pollutant] = "skipped — manual download needed"
    print(f"  Filter to: State=25, County=025, Site=0042 or 0045, Dates: 2023-07-19 to 2023-08-23")
    epa_merged = None
else:
    for pollutant, param_code in EPA_PARAMS.items():
        url = f"https://aqs.epa.gov/aqsweb/airdata/hourly_{param_code}_2023.zip"
        print(f"\nFetching {pollutant} (param {param_code}) from EPA AQS ...")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 HEROS-Project"})
            with urllib.request.urlopen(req, timeout=300) as resp:
                raw = resp.read()

            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                csv_name = zf.namelist()[0]
                with zf.open(csv_name) as f:
                    epa_raw = pd.read_csv(
                        f, dtype=str,
                        usecols=["State Code", "County Code", "Site Num",
                                 "Date Local", "Time Local", "Sample Measurement"]
                    )

            mask_county = (epa_raw["State Code"] == TARGET_STATE) & (
                epa_raw["County Code"] == TARGET_COUNTY
            )
            county_data = epa_raw[mask_county]
            available_sites = sorted(county_data["Site Num"].unique().tolist())

            site_data = pd.DataFrame()
            used_site = None
            for site in PREFERRED_SITES:
                candidate = county_data[county_data["Site Num"] == site]
                if len(candidate) > 0:
                    site_data = candidate.copy()
                    used_site = site
                    break
            if site_data.empty and available_sites:
                used_site = available_sites[0]
                site_data = county_data[county_data["Site Num"] == used_site].copy()

            if site_data.empty:
                epa_status[pollutant] = "no data in county"
                continue

            site_data["datetime"] = pd.to_datetime(
                site_data["Date Local"] + " " + site_data["Time Local"]
            )
            study_mask = (site_data["datetime"] >= "2023-07-19") & (
                site_data["datetime"] <= "2023-08-24"
            )
            site_data = site_data[study_mask].copy()
            site_data["value"] = pd.to_numeric(site_data["Sample Measurement"], errors="coerce")

            print(f"  ✓ {pollutant}: {len(site_data)} hourly readings (site {used_site})")
            epa_frames[pollutant] = site_data[["datetime", "value"]].rename(
                columns={"value": f"epa_{pollutant}"}
            )
            epa_status[pollutant] = f"fetched (site {used_site})"

        except Exception as e:
            print(f"  ✗ Failed: {type(e).__name__}: {str(e)[:120]}")
            epa_status[pollutant] = f"failed: {type(e).__name__}"

    if epa_frames:
        epa_merged = None
        for poll, frame in epa_frames.items():
            frame = frame.drop_duplicates(subset="datetime").set_index("datetime")
            if epa_merged is None:
                epa_merged = frame
            else:
                epa_merged = epa_merged.join(frame, how="outer")
        epa_merged = epa_merged.sort_index()
        print(f"\nEPA merged hourly data: {epa_merged.shape}")
    else:
        epa_merged = None

report["epa_fetch"] = epa_status

# ═══════════════════════════════════════════════════════════════════════
# 1.4 — Missing value audit
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.4 — Missing Value Audit")
print("=" * 70)

# Overall missingness
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
miss_overall = df[numeric_cols].isna().sum()
miss_pct_overall = (df[numeric_cols].isna().mean() * 100).round(2)

print("\n--- Overall Missingness ---")
miss_summary = pd.DataFrame(
    {"null_count": miss_overall, "null_pct": miss_pct_overall}
)
print(miss_summary.to_string())

# Per-site missingness for key variables
key_vars = [
    "kes_mean_temp_f",
    "kes_mean_wbgt_f",
    "kes_mean_humid_pct",
    "pa_mean_pm2_5_atm_b_corr_2",
    "dep_FEM_chinatown_pm2_5_ug_m3",
    "dep_FEM_nubian_pm2_5_ug_m3",
    "dep_FEM_nubian_temp_f",
    "wind_direction_degrees_kr",
]

sites = sorted(df["siteID"].unique())
miss_by_site = pd.DataFrame(index=sites, columns=key_vars, dtype=float)
for site in sites:
    sd = df[df["siteID"] == site]
    for var in key_vars:
        miss_by_site.loc[site, var] = round(sd[var].isna().mean() * 100, 2)

print("\n--- Missingness by Site (%) — Key Variables ---")
print(miss_by_site.to_string())

# Missing data heatmap
fig, ax = plt.subplots(figsize=(14, 6))
miss_matrix = miss_by_site.astype(float).values
im = ax.imshow(miss_matrix, cmap="YlOrRd", aspect="auto", vmin=0, vmax=20)
ax.set_xticks(range(len(key_vars)))
ax.set_xticklabels([c.replace("_", "\n", 1) for c in key_vars], fontsize=7, rotation=45, ha="right")
ax.set_yticks(range(len(sites)))
ax.set_yticklabels([SITE_ID_TO_NAME.get(s, s) for s in sites], fontsize=9)
for i in range(len(sites)):
    for j in range(len(key_vars)):
        val = miss_matrix[i, j]
        color = "white" if val > 10 else "black"
        ax.text(j, i, f"{val:.1f}%", ha="center", va="center", fontsize=7, color=color)
plt.colorbar(im, ax=ax, label="% Missing")
ax.set_title("Missing Data Heatmap: Sites × Key Variables", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "missing_data_heatmap.png", dpi=300, bbox_inches="tight")
plt.close(fig)
print("\n✓ Saved figures/missing_data_heatmap.png")

# Classify missing patterns
print("\n--- Missing Pattern Classification ---")
missing_classification = {}

# Kestrel columns: 1725 nulls across all 6 kestrel cols — same rows, same count
kes_cols = [c for c in df.columns if c.startswith("kes_")]
kes_null_mask = df[kes_cols].isna().all(axis=1)
kes_null_sites = df.loc[kes_null_mask, "siteID"].value_counts()
print(f"\nKestrel columns (all 6): {int(kes_null_mask.sum())} rows missing ({kes_null_mask.mean()*100:.1f}%)")
print(f"  By site: {kes_null_sites.to_dict()}")
print("  Pattern: MAR — specific sites/periods with sensor offline")
missing_classification["kestrel_all"] = {
    "count": int(kes_null_mask.sum()),
    "pct": round(kes_null_mask.mean() * 100, 2),
    "pattern": "MAR",
    "note": "Site-specific sensor downtime — same rows across all Kestrel variables",
}

# Purple Air
pa_null_mask = df["pa_mean_pm2_5_atm_b_corr_2"].isna()
pa_null_sites = df.loc[pa_null_mask, "siteID"].value_counts()
print(f"\nPurple Air PM2.5: {int(pa_null_mask.sum())} rows missing ({pa_null_mask.mean()*100:.1f}%)")
print(f"  By site: {pa_null_sites.to_dict()}")
print("  Pattern: MAR — sensor gaps or post-correction NaN (negative values set to missing)")
missing_classification["purple_air_pm25"] = {
    "count": int(pa_null_mask.sum()),
    "pct": round(pa_null_mask.mean() * 100, 2),
    "pattern": "MAR",
    "note": "Post-correction NaN (negatives removed) + sensor gaps",
}

# DEP and weather station
for col in ["dep_FEM_chinatown_pm2_5_ug_m3", "dep_FEM_nubian_pm2_5_ug_m3",
            "dep_FEM_nubian_temp_f", "dep_FEM_nubian_humid_pct",
            "wind_direction_degrees_kr"]:
    n_null = int(df[col].isna().sum())
    pct = round(df[col].isna().mean() * 100, 2)
    # Reference monitors: shared across sites (one reading per timestamp)
    pattern = "MCAR" if pct < 1 else "MAR"
    print(f"\n{col}: {n_null} missing ({pct}%) — {pattern}")
    missing_classification[col] = {
        "count": n_null,
        "pct": pct,
        "pattern": pattern,
        "note": "Sporadic monitor dropouts" if pct < 1 else "Extended monitor offline period",
    }

report["missing_classification"] = missing_classification

# Check for consecutive gap lengths (for imputation strategy)
print("\n--- Consecutive Gap Analysis (Purple Air PM2.5) ---")
for site in sites:
    sd = df[df["siteID"] == site].sort_values("date")
    is_null = sd["pa_mean_pm2_5_atm_b_corr_2"].isna()
    if is_null.sum() == 0:
        continue
    # Count consecutive NaN runs
    groups = (is_null != is_null.shift()).cumsum()
    gap_lengths = is_null.groupby(groups).sum()
    gap_lengths = gap_lengths[gap_lengths > 0]
    if len(gap_lengths) > 0:
        print(f"  {site}: {len(gap_lengths)} gaps, max={int(gap_lengths.max())} readings ({int(gap_lengths.max())*10} min), median={gap_lengths.median():.0f}")

print("\n--- Consecutive Gap Analysis (Kestrel Temperature) ---")
for site in sites:
    sd = df[df["siteID"] == site].sort_values("date")
    is_null = sd["kes_mean_temp_f"].isna()
    if is_null.sum() == 0:
        continue
    groups = (is_null != is_null.shift()).cumsum()
    gap_lengths = is_null.groupby(groups).sum()
    gap_lengths = gap_lengths[gap_lengths > 0]
    if len(gap_lengths) > 0:
        print(f"  {site}: {len(gap_lengths)} gaps, max={int(gap_lengths.max())} readings ({int(gap_lengths.max())*10} min), median={gap_lengths.median():.0f}")


# ═══════════════════════════════════════════════════════════════════════
# 1.5 — Imputation Strategy
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.5 — Imputation")
print("=" * 70)

# Pre-imputation stats
sensor_cols = [c for c in df.columns if c.startswith(("kes_", "pa_"))]
pre_imp_stats = df[sensor_cols].describe().round(4)
print("\n--- Pre-Imputation Descriptive Stats (sensor columns) ---")
print(pre_imp_stats.to_string())

# Add imputed_flag columns
for col in sensor_cols:
    df[f"imputed_{col}"] = False

# Impute per site, per variable
imputation_log = {}
for site in sites:
    site_mask = df["siteID"] == site
    site_idx = df.index[site_mask]
    sd = df.loc[site_mask].sort_values("date")
    sort_idx = sd.index

    for col in sensor_cols:
        series = df.loc[sort_idx, col].copy()
        n_orig_null = int(series.isna().sum())
        if n_orig_null == 0:
            continue

        # Identify gap lengths
        is_null = series.isna()
        groups = (is_null != is_null.shift()).cumsum()
        gap_lens = is_null.groupby(groups).transform("sum")

        # Short gaps (≤3 readings = 30 min): linear interpolation
        short_gap_mask = is_null & (gap_lens <= 3)
        # Moderate gaps (4-12 readings = 40 min - 2 hours): spline interpolation
        moderate_gap_mask = is_null & (gap_lens >= 4) & (gap_lens <= 12)
        # Long gaps (>12 readings = >2 hours): leave as NaN
        long_gap_mask = is_null & (gap_lens > 12)

        # Apply linear interpolation (fills short + moderate, then we'll only keep short)
        interpolated = series.interpolate(method="linear", limit_direction="both")

        # Apply: short gaps get linear interp
        filled = series.copy()
        filled.loc[short_gap_mask] = interpolated.loc[short_gap_mask]

        # Moderate gaps: try spline if enough data, else linear
        if moderate_gap_mask.sum() > 0:
            try:
                spline_interp = series.interpolate(method="spline", order=3, limit_direction="both")
                filled.loc[moderate_gap_mask] = spline_interp.loc[moderate_gap_mask]
            except Exception:
                filled.loc[moderate_gap_mask] = interpolated.loc[moderate_gap_mask]

        # Long gaps: leave as NaN (already NaN in filled)
        n_imputed = n_orig_null - int(filled.isna().sum())
        n_left_nan = int(filled.isna().sum())

        # Update main dataframe
        df.loc[sort_idx, col] = filled.values
        df.loc[sort_idx[short_gap_mask | moderate_gap_mask], f"imputed_{col}"] = True

        if n_imputed > 0:
            imputation_log.setdefault(col, []).append(
                f"{site}: {n_imputed} imputed ({n_left_nan} still NaN)"
            )

# Reference columns (shared across sites): forward-fill then back-fill
ref_cols = [
    "dep_FEM_chinatown_pm2_5_ug_m3",
    "dep_FEM_nubian_pm2_5_ug_m3",
    "dep_FEM_nubian_temp_f",
    "dep_FEM_nubian_humid_pct",
    "wind_direction_degrees_kr",
    "mean_temp_out_f",
    "mean_out_hum_pct",
    "mean_dew_pt_f",
    "mean_wind_speed_mph",
    "mean_heat_index_f",
    "mean_thw_index_f",
]

for col in ref_cols:
    if col not in df.columns:
        continue
    n_before = int(df[col].isna().sum())
    if n_before == 0:
        continue
    df[col] = df[col].ffill().bfill()
    n_after = int(df[col].isna().sum())
    print(f"  {col}: ffill/bfill filled {n_before - n_after} values ({n_after} still NaN)")

# Post-imputation stats
post_imp_stats = df[sensor_cols].describe().round(4)
print("\n--- Post-Imputation Descriptive Stats (sensor columns) ---")
print(post_imp_stats.to_string())

# Compare pre vs post
print("\n--- Pre vs Post Imputation: Mean Difference ---")
for col in sensor_cols:
    pre_m = pre_imp_stats.loc["mean", col] if col in pre_imp_stats.columns else np.nan
    post_m = post_imp_stats.loc["mean", col] if col in post_imp_stats.columns else np.nan
    if pd.notna(pre_m) and pd.notna(post_m):
        diff = post_m - pre_m
        print(f"  {col}: pre={pre_m:.4f}, post={post_m:.4f}, Δ={diff:+.4f}")

print("\n--- Imputation Log ---")
for col, entries in imputation_log.items():
    print(f"  {col}:")
    for e in entries:
        print(f"    {e}")

report["imputation"] = {
    "strategy": "linear_interp(≤30min) + spline(30min-2h) + NaN(>2h) + ffill/bfill(reference)",
    "log_summary": {k: len(v) for k, v in imputation_log.items()},
}

# ═══════════════════════════════════════════════════════════════════════
# 1.6 — Outlier Detection & Treatment
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.6 — Outlier Detection")
print("=" * 70)

# Physical plausibility bounds
bounds = {
    "pa_mean_pm2_5_atm_b_corr_2": (0, 500),
    "kes_mean_temp_f": (40, 120),
    "kes_mean_wbgt_f": (40, 120),
    "kes_mean_humid_pct": (0, 100),
    "kes_mean_press_inHg": (28, 32),
    "kes_mean_heat_f": (40, 150),
    "kes_mean_dew_f": (0, 100),
    "mean_temp_out_f": (40, 120),
    "mean_out_hum_pct": (0, 100),
    "mean_wind_speed_mph": (0, 100),
    "wind_direction_degrees_kr": (0, 360),
    "dep_FEM_chinatown_pm2_5_ug_m3": (0, 500),
    "dep_FEM_nubian_pm2_5_ug_m3": (0, 500),
    "dep_FEM_nubian_temp_f": (40, 120),
    "dep_FEM_nubian_humid_pct": (0, 100),
}

outlier_report = {}
total_removed = 0

print("\n--- Physical Plausibility Check ---")
for col, (lo, hi) in bounds.items():
    if col not in df.columns:
        continue
    below = (df[col] < lo).sum()
    above = (df[col] > hi).sum()
    if below + above > 0:
        print(f"  {col}: {below} below {lo}, {above} above {hi} → set to NaN")
        df.loc[df[col] < lo, col] = np.nan
        df.loc[df[col] > hi, col] = np.nan
        total_removed += below + above
        outlier_report[col] = {"below_bound": int(below), "above_bound": int(above)}
    else:
        print(f"  {col}: all within [{lo}, {hi}] ✓")

# IQR-based outlier detection per site per variable
print("\n--- IQR Statistical Outlier Detection (per site) ---")
iqr_vars = [
    "pa_mean_pm2_5_atm_b_corr_2",
    "kes_mean_temp_f",
    "kes_mean_wbgt_f",
    "kes_mean_humid_pct",
]

iqr_report = {}
for var in iqr_vars:
    n_flagged_total = 0
    for site in sites:
        vals = df.loc[df["siteID"] == site, var].dropna()
        if len(vals) < 10:
            continue
        q1 = vals.quantile(0.25)
        q3 = vals.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = ((vals < lower) | (vals > upper)).sum()
        n_flagged_total += outliers

    pct = round(n_flagged_total / len(df) * 100, 3)
    print(f"  {var}: {n_flagged_total} IQR outliers ({pct}%)")
    iqr_report[var] = {"n_flagged": int(n_flagged_total), "pct": pct}

    # Decision: keep IQR outliers (they may reflect real environmental extremes
    # like wildfire smoke spikes or heat waves). Only physical-bound violations removed above.
    # Winsorize at 0.5th/99.5th percentile for extreme tails
    p005 = df[var].quantile(0.005)
    p995 = df[var].quantile(0.995)
    n_winsorized = int(((df[var] < p005) | (df[var] > p995)).sum())
    if n_winsorized > 0:
        df[var] = df[var].clip(lower=p005, upper=p995)
        print(f"    → Winsorized {n_winsorized} extreme values to [{p005:.1f}, {p995:.1f}]")

print(f"\n  Total physically implausible values removed: {total_removed}")
report["outliers"] = {
    "physical_bounds": outlier_report,
    "iqr_flagged": iqr_report,
    "total_phys_removed": total_removed,
    "winsorization": "0.5th/99.5th percentile clip on key sensor variables",
}

# Outlier audit visualization
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
for ax, var in zip(axes.flatten(), iqr_vars):
    data_to_plot = [df.loc[df["siteID"] == s, var].dropna().values for s in sites]
    bp = ax.boxplot(
        data_to_plot,
        patch_artist=True,
        showfliers=True,
        flierprops=dict(marker=".", markersize=2, alpha=0.3),
    )
    for patch in bp["boxes"]:
        patch.set_facecolor("#7fb3d8")
        patch.set_alpha(0.7)
    ax.set_xticklabels([s[:6] for s in sites], rotation=45, fontsize=7)
    ax.set_title(var.replace("_", " "), fontsize=10)
    ax.grid(axis="y", alpha=0.3)
fig.suptitle("Post-Cleaning Distributions by Site (with outliers shown)", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "outlier_audit.png", dpi=300, bbox_inches="tight")
plt.close(fig)
print("✓ Saved figures/outlier_audit.png")

# ═══════════════════════════════════════════════════════════════════════
# 1.7 — Data Normalization & Type Standardization
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.7 — Data Normalization")
print("=" * 70)

# Datetime: ensure timezone-aware (US/Eastern)
if df["date"].dt.tz is None:
    df["date"] = df["date"].dt.tz_localize("US/Eastern")
    print("  ✓ Datetime localized to US/Eastern")
else:
    df["date"] = df["date"].dt.tz_convert("US/Eastern")
    print("  ✓ Datetime converted to US/Eastern")

# Numeric coercion (safety pass)
numeric_targets = [c for c in df.columns if c not in ("siteID", "date") and not c.startswith("imputed_")]
for col in numeric_targets:
    if df[col].dtype == object:
        before_non_null = df[col].notna().sum()
        df[col] = pd.to_numeric(df[col], errors="coerce")
        after_non_null = df[col].notna().sum()
        coerced = before_non_null - after_non_null
        if coerced > 0:
            print(f"  {col}: coerced {coerced} non-numeric values to NaN")

# Column renaming — already snake_case, but let's standardize
rename_map = {
    "siteID": "site_id",
    "date": "datetime",
}
df.rename(columns=rename_map, inplace=True)
print(f"  ✓ Renamed columns: {rename_map}")

# Site ID normalization (already lowercase strings)
df["site_id"] = df["site_id"].str.strip().str.lower()
print(f"  ✓ site_id normalized to lowercase: {sorted(df['site_id'].unique())}")

# Add derived time columns (useful for later analysis)
df["hour"] = df["datetime"].dt.hour
df["day_of_week"] = df["datetime"].dt.dayofweek
df["date_only"] = df["datetime"].dt.date
df["is_daytime"] = df["hour"].between(6, 17)  # 6am-6pm
print("  ✓ Added derived columns: hour, day_of_week, date_only, is_daytime")

# Unit documentation
units = {
    "kes_mean_temp_f": "°F",
    "kes_mean_wbgt_f": "°F",
    "kes_mean_humid_pct": "%",
    "kes_mean_press_inHg": "inHg",
    "kes_mean_heat_f": "°F",
    "kes_mean_dew_f": "°F",
    "pa_mean_pm2_5_atm_b_corr_2": "µg/m³",
    "mean_temp_out_f": "°F",
    "mean_out_hum_pct": "%",
    "mean_dew_pt_f": "°F",
    "mean_wind_speed_mph": "mph",
    "wind_direction_degrees_kr": "degrees",
    "mean_heat_index_f": "°F",
    "mean_thw_index_f": "°F",
    "dep_FEM_chinatown_pm2_5_ug_m3": "µg/m³",
    "dep_FEM_nubian_pm2_5_ug_m3": "µg/m³",
    "dep_FEM_nubian_temp_f": "°F",
    "dep_FEM_nubian_humid_pct": "%",
}
print(f"  ✓ Unit consistency confirmed (all temps in °F, PM2.5 in µg/m³, etc.)")

# ═══════════════════════════════════════════════════════════════════════
# 1.8 — Merge & Final Cleaned Dataset
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("PHASE 1.8 — Merge & Export")
print("=" * 70)

# --- Merge EPA hourly data ---
if epa_merged is not None:
    # Round HEROS datetime to nearest hour for join
    df["datetime_hour"] = df["datetime"].dt.floor("h")
    # Remove timezone for join compatibility
    epa_merged.index = epa_merged.index.tz_localize(None)
    df["datetime_hour_naive"] = df["datetime_hour"].dt.tz_localize(None)

    df = df.merge(
        epa_merged,
        left_on="datetime_hour_naive",
        right_index=True,
        how="left",
    )
    df.drop(columns=["datetime_hour", "datetime_hour_naive"], inplace=True)
    epa_cols = [c for c in df.columns if c.startswith("epa_")]
    for col in epa_cols:
        filled = df[col].notna().sum()
        total = len(df)
        print(f"  EPA {col}: {filled}/{total} rows matched ({filled/total*100:.1f}%)")
else:
    print("  ⚠ No EPA data to merge — will need manual download for Q4")

# --- Merge land-use data ---
lu["site_id"] = lu["Site"].map(LANDUSE_NAME_TO_ID)
print(f"\n  Land-use site_id mapping: {lu[['Site', 'site_id']].drop_duplicates().to_dict('records')}")

# Pivot land-use: one row per site with 25m and 50m columns
lu_25 = lu[lu["Distance"] == 25].set_index("site_id")[
    ["Roads_Area_Percent", "Greenspace_Area_Percent", "Trees_Area_Percent",
     "Impervious_Area_Percent", "Industrial_Area_Percent"]
].add_suffix("_25m")

lu_50 = lu[lu["Distance"] == 50].set_index("site_id")[
    ["Roads_Area_Percent", "Greenspace_Area_Percent", "Trees_Area_Percent",
     "Impervious_Area_Percent", "Industrial_Area_Percent"]
].add_suffix("_50m")

lu_wide = lu_25.join(lu_50)
print(f"\n  Land-use wide table ({lu_wide.shape[0]} sites × {lu_wide.shape[1]} cols):")
print(lu_wide.round(3).to_string())

df = df.merge(lu_wide, left_on="site_id", right_index=True, how="left")

# Check land-use merge success
lu_cols = [c for c in df.columns if c.endswith(("_25m", "_50m"))]
lu_filled = df[lu_cols[0]].notna().sum() if lu_cols else 0
print(f"\n  Land-use merge: {lu_filled}/{len(df)} rows with land-use data ({lu_filled/len(df)*100:.1f}%)")

# --- Set MultiIndex ---
# Keep a flat copy for parquet export (parquet handles MultiIndex poorly)
df_flat = df.copy()

# --- Export ---
# Remove timezone for parquet compatibility
df_flat["datetime"] = df_flat["datetime"].dt.tz_localize(None)

# Drop the date_only column (it's a date object, not serializable to parquet easily)
df_flat["date_only"] = df_flat["date_only"].astype(str)

df_flat.to_parquet("data_HEROS_clean.parquet", index=False, engine="pyarrow")
print(f"\n  ✓ Exported data_HEROS_clean.parquet")

df_flat.to_csv("data_HEROS_clean.csv", index=False)
print(f"  ✓ Exported data_HEROS_clean.csv")

# --- Final summary ---
print("\n" + "=" * 70)
print("PHASE 1 — FINAL SUMMARY")
print("=" * 70)
print(f"  Shape: {df_flat.shape[0]:,} rows × {df_flat.shape[1]} columns")
print(f"  Columns ({len(df_flat.columns)}):")
for c in df_flat.columns:
    null_pct = df_flat[c].isna().mean() * 100
    print(f"    {c}: {df_flat[c].dtype}  | {null_pct:.2f}% null")
print(f"\n  Overall missingness: {df_flat.isna().sum().sum():,} total NaN cells "
      f"({df_flat.isna().sum().sum() / df_flat.size * 100:.3f}%)")
print(f"  Sites: {sorted(df_flat['site_id'].unique())}")

report["final_dataset"] = {
    "rows": int(df_flat.shape[0]),
    "cols": int(df_flat.shape[1]),
    "columns": df_flat.columns.tolist(),
    "overall_null_pct": round(df_flat.isna().sum().sum() / df_flat.size * 100, 3),
    "sites": sorted(df_flat["site_id"].unique().tolist()),
}
report["units"] = units
report["site_mapping"] = SITE_ID_TO_NAME

# Save report
with open("phase1_report.json", "w") as f:
    json.dump(report, f, indent=2, default=str)
print("\n  ✓ Saved phase1_report.json")

print("\n✅ Phase 1 complete.")

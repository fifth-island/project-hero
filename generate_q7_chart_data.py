#!/usr/bin/env python3
"""Generate JSON data files for Q7 — PM2.5 vs Heat Stress (WBGT) Correlation Analysis."""

import json, pathlib
import pandas as pd
import numpy as np
from scipy import stats

CSV = pathlib.Path("data/clean/data_HEROS_clean.csv")
OUT = pathlib.Path("dashboard-app/app/public/data")
OUT.mkdir(parents=True, exist_ok=True)

SITE_LABELS = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden",
}

def _sanitize(obj):
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj

def save(name, data):
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(_sanitize(data), default=str))
    print(f"  {p.name}")


def main():
    print("Loading data...")
    df = pd.read_csv(CSV)
    pm25_col = "pa_mean_pm2_5_atm_b_corr_2"
    wbgt_col = "kes_mean_wbgt_f"

    # Filter to complete cases
    df = df.dropna(subset=[pm25_col, wbgt_col, "site_id", "hour"])
    df["hour"] = df["hour"].astype(int)
    print(f"  Complete cases: {len(df)}")

    # ── 1. KPIs ──
    r_pearson, p_pearson = stats.pearsonr(df[pm25_col], df[wbgt_col])
    r_spearman, p_spearman = stats.spearmanr(df[pm25_col], df[wbgt_col])
    slope, intercept, _, _, std_err = stats.linregress(df[wbgt_col], df[pm25_col])
    r2 = r_pearson ** 2

    # Site correlations for range
    site_corrs = {}
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        if len(sdf) > 10:
            r, _ = stats.pearsonr(sdf[pm25_col], sdf[wbgt_col])
            site_corrs[sid] = round(r, 3)
    strongest = max(site_corrs, key=site_corrs.get)
    weakest = min(site_corrs, key=site_corrs.get)

    kpi = {
        "pearson_r": round(r_pearson, 4),
        "spearman_rho": round(r_spearman, 4),
        "r_squared": round(r2, 3),
        "slope": round(slope, 3),
        "intercept": round(intercept, 3),
        "std_err": round(std_err, 4),
        "n_obs": len(df),
        "pm25_mean": round(df[pm25_col].mean(), 1),
        "pm25_median": round(df[pm25_col].median(), 1),
        "wbgt_mean": round(df[wbgt_col].mean(), 1),
        "wbgt_range": [round(df[wbgt_col].min(), 1), round(df[wbgt_col].max(), 1)],
        "strongest_site": SITE_LABELS[strongest],
        "strongest_r": site_corrs[strongest],
        "weakest_site": SITE_LABELS[weakest],
        "weakest_r": site_corrs[weakest],
        "corr_cv": round(np.std(list(site_corrs.values())) / np.mean(list(site_corrs.values())) * 100, 1),
    }
    save("q7_kpi", kpi)

    # ── 2. Scatter data (sampled for performance) ──
    # Sample ~3000 points for the overall scatter
    sample_n = min(3000, len(df))
    sampled = df.sample(sample_n, random_state=42)
    scatter = []
    for _, row in sampled.iterrows():
        scatter.append({
            "wbgt": round(row[wbgt_col], 1),
            "pm25": round(row[pm25_col], 1),
            "site_id": row["site_id"],
            "site_label": SITE_LABELS.get(row["site_id"], row["site_id"]),
            "hour": int(row["hour"]),
        })
    save("q7_scatter", scatter)

    # ── 3. Regression line points ──
    wbgt_min, wbgt_max = df[wbgt_col].min(), df[wbgt_col].max()
    regression_line = [
        {"wbgt": round(wbgt_min, 1), "pm25": round(intercept + slope * wbgt_min, 2)},
        {"wbgt": round(wbgt_max, 1), "pm25": round(intercept + slope * wbgt_max, 2)},
    ]
    save("q7_regression_line", regression_line)

    # ── 4. Hexbin / density grid (for joint density) ──
    wbgt_bins = np.linspace(df[wbgt_col].min(), df[wbgt_col].max(), 20)
    pm25_bins = np.linspace(df[pm25_col].min(), min(df[pm25_col].quantile(0.99), 30), 20)
    density = []
    for i in range(len(wbgt_bins) - 1):
        for j in range(len(pm25_bins) - 1):
            mask = (
                (df[wbgt_col] >= wbgt_bins[i]) & (df[wbgt_col] < wbgt_bins[i + 1]) &
                (df[pm25_col] >= pm25_bins[j]) & (df[pm25_col] < pm25_bins[j + 1])
            )
            count = mask.sum()
            if count > 0:
                density.append({
                    "wbgt": round((wbgt_bins[i] + wbgt_bins[i + 1]) / 2, 1),
                    "pm25": round((pm25_bins[j] + pm25_bins[j + 1]) / 2, 1),
                    "count": int(count),
                })
    save("q7_density", density)

    # ── 5. Site-level correlation details ──
    site_stats = []
    for sid in sorted(SITE_LABELS.keys()):
        sdf = df[df["site_id"] == sid]
        if len(sdf) < 10:
            continue
        r, p = stats.pearsonr(sdf[pm25_col], sdf[wbgt_col])
        sl, it, _, _, se = stats.linregress(sdf[wbgt_col], sdf[pm25_col])
        site_stats.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "correlation": round(r, 3),
            "r_squared": round(r ** 2, 3),
            "slope": round(sl, 3),
            "intercept": round(it, 2),
            "n": len(sdf),
            "pm25_mean": round(sdf[pm25_col].mean(), 1),
            "wbgt_mean": round(sdf[wbgt_col].mean(), 1),
        })
    site_stats.sort(key=lambda x: -x["correlation"])
    save("q7_site_stats", site_stats)

    # ── 6. Hourly aggregation (for hour-of-day color pattern) ──
    hourly = []
    for h in range(24):
        hdf = df[df["hour"] == h]
        if len(hdf) < 5:
            continue
        hourly.append({
            "hour": h,
            "pm25_mean": round(hdf[pm25_col].mean(), 2),
            "wbgt_mean": round(hdf[wbgt_col].mean(), 2),
            "pm25_p25": round(hdf[pm25_col].quantile(0.25), 2),
            "pm25_p75": round(hdf[pm25_col].quantile(0.75), 2),
            "wbgt_p25": round(hdf[wbgt_col].quantile(0.25), 2),
            "wbgt_p75": round(hdf[wbgt_col].quantile(0.75), 2),
            "n": len(hdf),
        })
    save("q7_hourly", hourly)

    # ── 7. Per-site scatter (sampled per site for "colored by site" view) ──
    site_scatter = []
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        sample_s = min(250, len(sdf))
        samp = sdf.sample(sample_s, random_state=42) if len(sdf) > 0 else sdf
        for _, row in samp.iterrows():
            site_scatter.append({
                "wbgt": round(row[wbgt_col], 1),
                "pm25": round(row[pm25_col], 1),
                "site_id": sid,
            })
    save("q7_site_scatter", site_scatter)

    # ── 8. Per-site regression lines ──
    site_lines = []
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        if len(sdf) < 10:
            continue
        sl, it, _, _, _ = stats.linregress(sdf[wbgt_col], sdf[pm25_col])
        w_min, w_max = sdf[wbgt_col].min(), sdf[wbgt_col].max()
        site_lines.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "x1": round(w_min, 1), "y1": round(it + sl * w_min, 2),
            "x2": round(w_max, 1), "y2": round(it + sl * w_max, 2),
            "slope": round(sl, 3),
        })
    save("q7_site_lines", site_lines)

    print("\nAll Q7 chart data generated successfully!")


if __name__ == "__main__":
    main()

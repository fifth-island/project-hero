#!/usr/bin/env python3
"""Generate JSON data for Q7 Heterogeneity Deep-Dive — site-level PM2.5×WBGT variation."""

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
    print("Loading data…")
    df = pd.read_csv(CSV)
    pm25 = "pa_mean_pm2_5_atm_b_corr_2"
    wbgt = "kes_mean_wbgt_f"
    df = df.dropna(subset=[pm25, wbgt, "site_id", "hour"])
    df["hour"] = df["hour"].astype(int)
    print(f"  Complete cases: {len(df)}")

    # ── 1. KPIs ──
    site_corrs = {}
    site_slopes = {}
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        if len(sdf) < 10:
            continue
        r, _ = stats.pearsonr(sdf[pm25], sdf[wbgt])
        sl, _, _, _, _ = stats.linregress(sdf[wbgt], sdf[pm25])
        site_corrs[sid] = r
        site_slopes[sid] = sl

    corrs = list(site_corrs.values())
    slopes = list(site_slopes.values())
    sorted_by_r = sorted(site_corrs.items(), key=lambda x: -x[1])

    kpi = {
        "n_sites": len(site_corrs),
        "mean_r": round(np.mean(corrs), 3),
        "std_r": round(np.std(corrs), 3),
        "cv_r": round(np.std(corrs) / np.mean(corrs) * 100, 1),
        "range_r": [round(min(corrs), 3), round(max(corrs), 3)],
        "fold_diff": round(max(corrs) / min(corrs), 1),
        "mean_slope": round(np.mean(slopes), 3),
        "slope_range": [round(min(slopes), 3), round(max(slopes), 3)],
        "strongest_site": SITE_LABELS[sorted_by_r[0][0]],
        "strongest_r": round(sorted_by_r[0][1], 3),
        "weakest_site": SITE_LABELS[sorted_by_r[-1][0]],
        "weakest_r": round(sorted_by_r[-1][1], 3),
        # Levene test for heteroscedasticity proxy
        "n_above_avg": sum(1 for r in corrs if r > np.mean(corrs)),
        "n_below_avg": sum(1 for r in corrs if r <= np.mean(corrs)),
    }
    save("q7h_kpi", kpi)

    # ── 2. Per-site PM2.5 distributions (boxplot data) ──
    pm25_dist = []
    for sid in sorted(SITE_LABELS.keys()):
        sdf = df[df["site_id"] == sid][pm25]
        if len(sdf) < 10:
            continue
        pm25_dist.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "min": round(sdf.min(), 1),
            "q1": round(sdf.quantile(0.25), 1),
            "median": round(sdf.median(), 1),
            "q3": round(sdf.quantile(0.75), 1),
            "max": round(min(sdf.max(), sdf.quantile(0.95) * 1.5), 1),  # cap outliers
            "mean": round(sdf.mean(), 1),
            "iqr": round(sdf.quantile(0.75) - sdf.quantile(0.25), 1),
            "n": len(sdf),
        })
    pm25_dist.sort(key=lambda x: -x["median"])
    save("q7h_pm25_dist", pm25_dist)

    # ── 3. Per-site WBGT distributions ──
    wbgt_dist = []
    for sid in sorted(SITE_LABELS.keys()):
        sdf = df[df["site_id"] == sid][wbgt]
        if len(sdf) < 10:
            continue
        wbgt_dist.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "min": round(sdf.min(), 1),
            "q1": round(sdf.quantile(0.25), 1),
            "median": round(sdf.median(), 1),
            "q3": round(sdf.quantile(0.75), 1),
            "max": round(sdf.max(), 1),
            "mean": round(sdf.mean(), 1),
        })
    wbgt_dist.sort(key=lambda x: -x["median"])
    save("q7h_wbgt_dist", wbgt_dist)

    # ── 4. WBGT-binned PM2.5 response per site ──
    # Shows how PM2.5 changes across WBGT bins for each site
    wbgt_edges = np.arange(55, 80, 2.5)
    binned = []
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        for i in range(len(wbgt_edges) - 1):
            lo, hi = wbgt_edges[i], wbgt_edges[i + 1]
            mask = (sdf[wbgt] >= lo) & (sdf[wbgt] < hi)
            sub = sdf[mask]
            if len(sub) < 5:
                continue
            binned.append({
                "site_id": sid,
                "site_label": SITE_LABELS[sid],
                "wbgt_bin": round((lo + hi) / 2, 1),
                "wbgt_lo": round(lo, 1),
                "wbgt_hi": round(hi, 1),
                "pm25_mean": round(sub[pm25].mean(), 2),
                "pm25_median": round(sub[pm25].median(), 2),
                "pm25_p25": round(sub[pm25].quantile(0.25), 2),
                "pm25_p75": round(sub[pm25].quantile(0.75), 2),
                "n": len(sub),
            })
    save("q7h_binned", binned)

    # ── 5. Site sensitivity: slope + confidence intervals (bootstrap) ──
    sensitivity = []
    for sid in sorted(SITE_LABELS.keys()):
        sdf = df[df["site_id"] == sid]
        if len(sdf) < 30:
            continue
        r, p = stats.pearsonr(sdf[pm25], sdf[wbgt])
        rho, _ = stats.spearmanr(sdf[pm25], sdf[wbgt])
        sl, it, _, p_sl, se = stats.linregress(sdf[wbgt], sdf[pm25])
        # CI for slope
        ci_lo = sl - 1.96 * se
        ci_hi = sl + 1.96 * se
        # Residual std
        pred = it + sl * sdf[wbgt]
        resid_std = round((sdf[pm25] - pred).std(), 2)

        sensitivity.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "r": round(r, 3),
            "rho": round(rho, 3),
            "r_squared": round(r ** 2, 3),
            "slope": round(sl, 3),
            "slope_ci_lo": round(ci_lo, 3),
            "slope_ci_hi": round(ci_hi, 3),
            "intercept": round(it, 2),
            "std_err": round(se, 4),
            "residual_std": resid_std,
            "n": len(sdf),
            "pm25_mean": round(sdf[pm25].mean(), 1),
            "wbgt_mean": round(sdf[wbgt].mean(), 1),
        })
    sensitivity.sort(key=lambda x: -x["r"])
    save("q7h_sensitivity", sensitivity)

    # ── 6. Per-site hourly trajectories (mean WBGT → mean PM2.5 per hour) ──
    trajectories = []
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        for h in range(24):
            hdf = sdf[sdf["hour"] == h]
            if len(hdf) < 3:
                continue
            trajectories.append({
                "site_id": sid,
                "site_label": SITE_LABELS[sid],
                "hour": h,
                "wbgt_mean": round(hdf[wbgt].mean(), 2),
                "pm25_mean": round(hdf[pm25].mean(), 2),
            })
    save("q7h_trajectories", trajectories)

    # ── 7. Per-site scatter (sampled 200/site) ──
    site_scatter = []
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        n = min(200, len(sdf))
        samp = sdf.sample(n, random_state=42)
        for _, row in samp.iterrows():
            site_scatter.append({
                "wbgt": round(row[wbgt], 1),
                "pm25": round(row[pm25], 1),
                "site_id": sid,
            })
    save("q7h_site_scatter", site_scatter)

    # ── 8. Pairwise comparison matrix (r difference between sites) ──
    sids = sorted(site_corrs.keys())
    pair_matrix = []
    for i, s1 in enumerate(sids):
        for j, s2 in enumerate(sids):
            pair_matrix.append({
                "site_a": s1,
                "site_b": s2,
                "label_a": SITE_LABELS[s1],
                "label_b": SITE_LABELS[s2],
                "r_diff": round(site_corrs[s1] - site_corrs[s2], 3),
            })
    save("q7h_pair_matrix", pair_matrix)

    # ── 9. Regression lines per site ──
    site_lines = []
    for sid in SITE_LABELS:
        sdf = df[df["site_id"] == sid]
        if len(sdf) < 10:
            continue
        sl, it, _, _, _ = stats.linregress(sdf[wbgt], sdf[pm25])
        w_min, w_max = max(sdf[wbgt].min(), 50), sdf[wbgt].max()
        site_lines.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "x1": round(w_min, 1), "y1": round(it + sl * w_min, 2),
            "x2": round(w_max, 1), "y2": round(it + sl * w_max, 2),
            "slope": round(sl, 3),
            "r": round(site_corrs.get(sid, 0), 3),
        })
    site_lines.sort(key=lambda x: -x["r"])
    save("q7h_site_lines", site_lines)

    print("\nAll Q7 heterogeneity data generated!")


if __name__ == "__main__":
    main()

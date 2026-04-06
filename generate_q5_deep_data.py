#!/usr/bin/env python3
"""Generate JSON data for Q5 Deep Dive tab — analyses not covered in the main Q5 page."""

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

def save(name: str, data):
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(data, default=str))
    print(f"  {p.name}")

def main():
    df = pd.read_csv(CSV, parse_dates=["datetime"])
    df["date"] = df["datetime"].dt.date.astype(str)
    df["hour"] = df["datetime"].dt.hour
    df["site_label"] = df["site_id"].map(SITE_LABELS)

    wbgt_col = "kes_mean_wbgt_f"
    pm25_col = "pa_mean_pm2_5_atm_b_corr_2"
    temp_col = "kes_mean_temp_f"
    humid_col = "kes_mean_humid_pct"
    hi_col = "kes_mean_heat_f"

    # Identify top 5 hottest days
    daily_mean = df.groupby("date")[wbgt_col].mean().sort_values(ascending=False)
    hot_dates = daily_mean.head(5).index.tolist()
    hot_df = df[df["date"].isin(hot_dates)].copy()

    # ── 1. Site WBGT distributions (box plot data) ──
    distributions = []
    for sid in sorted(SITE_LABELS.keys()):
        vals = hot_df[hot_df["site_id"] == sid][wbgt_col].dropna()
        if len(vals) == 0:
            continue
        q1 = float(np.percentile(vals, 25))
        q3 = float(np.percentile(vals, 75))
        distributions.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "mean": round(vals.mean(), 2),
            "median": round(vals.median(), 2),
            "q1": round(q1, 2),
            "q3": round(q3, 2),
            "min": round(vals.min(), 2),
            "max": round(vals.max(), 2),
            "iqr": round(q3 - q1, 2),
            "std": round(vals.std(), 2),
            "n": int(len(vals)),
        })
    distributions.sort(key=lambda x: x["mean"], reverse=True)
    save("q5d_distributions", distributions)

    # ── 2. Statistical tests ──
    site_groups = [hot_df[hot_df["site_id"] == sid][wbgt_col].dropna().values
                   for sid in SITE_LABELS if len(hot_df[hot_df["site_id"] == sid][wbgt_col].dropna()) > 0]
    kw_stat, kw_p = stats.kruskal(*site_groups)

    # Pairwise Mann-Whitney U (top significant pairs)
    site_ids = sorted([sid for sid in SITE_LABELS if len(hot_df[hot_df["site_id"] == sid][wbgt_col].dropna()) > 0])
    n_pairs = len(site_ids) * (len(site_ids) - 1) // 2
    bonferroni_alpha = 0.05 / n_pairs
    pairwise = []
    for i in range(len(site_ids)):
        for j in range(i + 1, len(site_ids)):
            g1 = hot_df[hot_df["site_id"] == site_ids[i]][wbgt_col].dropna()
            g2 = hot_df[hot_df["site_id"] == site_ids[j]][wbgt_col].dropna()
            u_stat, p_val = stats.mannwhitneyu(g1, g2, alternative="two-sided")
            diff = round(abs(g1.mean() - g2.mean()), 2)
            pairwise.append({
                "site_1": SITE_LABELS[site_ids[i]],
                "site_1_id": site_ids[i],
                "site_2": SITE_LABELS[site_ids[j]],
                "site_2_id": site_ids[j],
                "u_stat": round(float(u_stat), 1),
                "p_value": float(p_val),
                "p_display": f"{p_val:.2e}",
                "significant": bool(p_val < bonferroni_alpha),
                "mean_diff": diff,
            })
    pairwise.sort(key=lambda x: x["p_value"])

    stat_tests = {
        "kruskal_wallis_h": round(float(kw_stat), 2),
        "kruskal_wallis_p": float(kw_p),
        "kruskal_wallis_p_display": f"{kw_p:.2e}",
        "n_pairs": n_pairs,
        "bonferroni_alpha": round(bonferroni_alpha, 6),
        "n_significant": sum(1 for p in pairwise if p["significant"]),
        "pairwise": pairwise[:15],  # Top 15 most significant
    }
    save("q5d_stat_tests", stat_tests)

    # ── 3. Ranking consistency across hot days ──
    ranking_consistency = []
    for sid in SITE_LABELS:
        ranks = []
        for d in hot_dates:
            day_df = hot_df[hot_df["date"] == d]
            day_ranks = day_df.groupby("site_id")[wbgt_col].mean().rank(ascending=False)
            if sid in day_ranks.index:
                ranks.append(int(day_ranks[sid]))
        if ranks:
            ranking_consistency.append({
                "site_id": sid,
                "site_label": SITE_LABELS[sid],
                "mean_rank": round(np.mean(ranks), 2),
                "std_rank": round(np.std(ranks), 2),
                "best_rank": int(min(ranks)),
                "worst_rank": int(max(ranks)),
                "ranks_by_day": {d: int(r) for d, r in zip(hot_dates[:len(ranks)], ranks)},
                "n_days": len(ranks),
            })
    ranking_consistency.sort(key=lambda x: x["mean_rank"])
    save("q5d_ranking_consistency", ranking_consistency)

    # ── 4. Heat wave vs isolated hot days ──
    # Jul 27-29 = heat wave, Aug 8 + Aug 13 = isolated
    hw_dates = [d for d in hot_dates if d.startswith("2023-07")]
    iso_dates = [d for d in hot_dates if d.startswith("2023-08")]

    hw_df = hot_df[hot_df["date"].isin(hw_dates)]
    iso_df = hot_df[hot_df["date"].isin(iso_dates)]

    hw_vs_iso = {
        "heatwave": {
            "dates": hw_dates,
            "mean_wbgt": round(hw_df[wbgt_col].mean(), 2),
            "max_wbgt": round(hw_df[wbgt_col].max(), 2),
            "inter_site_range": round(
                hw_df.groupby("site_id")[wbgt_col].mean().max() -
                hw_df.groupby("site_id")[wbgt_col].mean().min(), 1
            ),
            "mean_humidity": round(hw_df[humid_col].mean(), 1),
            "n_records": int(len(hw_df)),
        },
        "isolated": {
            "dates": iso_dates,
            "mean_wbgt": round(iso_df[wbgt_col].mean(), 2) if len(iso_df) > 0 else 0,
            "max_wbgt": round(iso_df[wbgt_col].max(), 2) if len(iso_df) > 0 else 0,
            "inter_site_range": round(
                iso_df.groupby("site_id")[wbgt_col].mean().max() -
                iso_df.groupby("site_id")[wbgt_col].mean().min(), 1
            ) if len(iso_df) > 0 else 0,
            "mean_humidity": round(iso_df[humid_col].mean(), 1) if len(iso_df) > 0 else 0,
            "n_records": int(len(iso_df)),
        },
    }
    # Mann-Whitney between heat wave and isolated
    if len(hw_df) > 0 and len(iso_df) > 0:
        u, p = stats.mannwhitneyu(
            hw_df[wbgt_col].dropna(), iso_df[wbgt_col].dropna(), alternative="two-sided"
        )
        hw_vs_iso["test_p"] = float(p)
        hw_vs_iso["test_p_display"] = f"{p:.2e}"
    save("q5d_heatwave_vs_isolated", hw_vs_iso)

    # Per-site comparison: heat wave vs isolated
    hw_iso_sites = []
    for sid in SITE_LABELS:
        hw_vals = hw_df[hw_df["site_id"] == sid][wbgt_col].dropna()
        iso_vals = iso_df[iso_df["site_id"] == sid][wbgt_col].dropna()
        if len(hw_vals) == 0 and len(iso_vals) == 0:
            continue
        hw_iso_sites.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "hw_mean": round(hw_vals.mean(), 2) if len(hw_vals) > 0 else None,
            "iso_mean": round(iso_vals.mean(), 2) if len(iso_vals) > 0 else None,
            "difference": round(hw_vals.mean() - iso_vals.mean(), 2) if len(hw_vals) > 0 and len(iso_vals) > 0 else None,
        })
    hw_iso_sites.sort(key=lambda x: x.get("difference") or 0, reverse=True)
    save("q5d_hw_iso_by_site", hw_iso_sites)

    # ── 5. Day × Site Heatmap ──
    day_site = []
    for d in hot_dates:
        for sid in SITE_LABELS:
            vals = hot_df[(hot_df["date"] == d) & (hot_df["site_id"] == sid)][wbgt_col].dropna()
            if len(vals) > 0:
                day_site.append({
                    "date": d,
                    "site_id": sid,
                    "site_label": SITE_LABELS[sid],
                    "mean_wbgt": round(vals.mean(), 2),
                    "n_records": int(len(vals)),
                })
    save("q5d_day_site_heatmap", day_site)

    # ── 6. Heat Index vs WBGT ──
    hi_wbgt = hot_df[[wbgt_col, hi_col, "site_id", "hour"]].dropna()
    hi_wbgt["gap"] = hi_wbgt[hi_col] - hi_wbgt[wbgt_col]
    corr = hi_wbgt[wbgt_col].corr(hi_wbgt[hi_col])

    # Summary stats
    hi_summary = {
        "correlation": round(float(corr), 2),
        "mean_gap": round(float(hi_wbgt["gap"].mean()), 1),
        "median_gap": round(float(hi_wbgt["gap"].median()), 1),
        "max_gap": round(float(hi_wbgt["gap"].max()), 1),
        "pct_hi_above_100": round(float((hi_wbgt[hi_col] > 100).mean() * 100), 1),
        "n_hi_above_100": int((hi_wbgt[hi_col] > 100).sum()),
    }
    save("q5d_hi_wbgt_summary", hi_summary)

    # Scatter data (sampled for perf — take hourly means per site)
    scatter = hi_wbgt.groupby(["site_id", "hour"]).agg({
        wbgt_col: "mean", hi_col: "mean"
    }).reset_index()
    scatter_out = []
    for _, r in scatter.iterrows():
        scatter_out.append({
            "site_id": r["site_id"],
            "site_label": SITE_LABELS[r["site_id"]],
            "wbgt": round(r[wbgt_col], 2),
            "heat_index": round(r[hi_col], 2),
            "hour": int(r["hour"]),
        })
    save("q5d_hi_wbgt_scatter", scatter_out)

    # HI vs WBGT gap by hour
    hourly_gap = hi_wbgt.groupby("hour").agg({
        wbgt_col: "mean", hi_col: "mean", "gap": "mean"
    }).reset_index()
    gap_by_hour = []
    for _, r in hourly_gap.iterrows():
        gap_by_hour.append({
            "hour": int(r["hour"]),
            "wbgt": round(r[wbgt_col], 2),
            "heat_index": round(r[hi_col], 2),
            "gap": round(r["gap"], 2),
        })
    save("q5d_hi_wbgt_hourly", gap_by_hour)

    # ── 7. Humidity decomposition by site ──
    humid_contrib = []
    for sid in SITE_LABELS:
        sd = hot_df[hot_df["site_id"] == sid]
        t = sd[temp_col].mean()
        h = sd[humid_col].mean()
        w = sd[wbgt_col].mean()
        if pd.notna(t) and pd.notna(h) and pd.notna(w):
            # Approximate: WBGT ≈ 0.7*wet-bulb + 0.2*globe + 0.1*dry
            # Humidity contribution proxy: (WBGT - temp * 0.3) / WBGT
            humid_pct = round(h, 1)
            temp_v = round(t, 1)
            wbgt_v = round(w, 2)
            # How much does this site's ranking change due to humidity
            humid_contrib.append({
                "site_id": sid,
                "site_label": SITE_LABELS[sid],
                "temp": temp_v,
                "humidity": humid_pct,
                "wbgt": wbgt_v,
                "wbgt_minus_temp_effect": round(wbgt_v - temp_v * 0.3, 2),
            })
    humid_contrib.sort(key=lambda x: x["humidity"], reverse=True)
    save("q5d_humidity_decomposition", humid_contrib)

    # ── 8. Deep KPIs ──
    site_wbgt = hot_df.groupby("site_id")[wbgt_col].mean().sort_values(ascending=False)
    deep_kpi = {
        "cohens_d": round(float(
            (site_wbgt.iloc[0] - site_wbgt.iloc[-1]) /
            np.sqrt((hot_df[hot_df["site_id"] == site_wbgt.index[0]][wbgt_col].std()**2 +
                     hot_df[hot_df["site_id"] == site_wbgt.index[-1]][wbgt_col].std()**2) / 2)
        ), 2),
        "kruskal_h": round(float(kw_stat), 1),
        "significant_pairs": sum(1 for p in pairwise if p["significant"]),
        "total_pairs": n_pairs,
        "hw_iso_diff": round(hw_df[wbgt_col].mean() - iso_df[wbgt_col].mean(), 1) if len(iso_df) > 0 else 0,
        "hi_wbgt_gap": round(float(hi_wbgt["gap"].mean()), 1),
        "hi_wbgt_corr": round(float(corr), 2),
        "max_heat_index": round(float(hi_wbgt[hi_col].max()), 1),
        "humidity_range": round(
            hot_df.groupby("site_id")[humid_col].mean().max() -
            hot_df.groupby("site_id")[humid_col].mean().min(), 1
        ),
    }
    save("q5d_deep_kpi", deep_kpi)

    print("\nAll Q5 Deep Dive data generated successfully!")

if __name__ == "__main__":
    main()

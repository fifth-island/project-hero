#!/usr/bin/env python3
"""Generate JSON data files for Q5 — Hottest Days: WBGT Differences Across Sites."""

import json, pathlib
import pandas as pd
import numpy as np

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

    # ── Identify top 5 hottest days by mean WBGT across all sites ──
    daily_mean = df.groupby("date")[wbgt_col].mean().sort_values(ascending=False)
    hot_dates = daily_mean.head(5).index.tolist()
    hot_df = df[df["date"].isin(hot_dates)].copy()

    # ── 1. KPIs ──
    site_wbgt = hot_df.groupby("site_id")[wbgt_col].mean().sort_values(ascending=False)
    hottest_site = site_wbgt.index[0]
    coolest_site = site_wbgt.index[-1]
    inter_site_range = round(site_wbgt.iloc[0] - site_wbgt.iloc[-1], 1)

    # Cohen's d
    g1 = hot_df[hot_df["site_id"] == hottest_site][wbgt_col].dropna()
    g2 = hot_df[hot_df["site_id"] == coolest_site][wbgt_col].dropna()
    pooled_std = np.sqrt((g1.std()**2 + g2.std()**2) / 2)
    cohens_d = round((g1.mean() - g2.mean()) / pooled_std, 2) if pooled_std > 0 else 0

    # Dual exposure
    dual = hot_df[(hot_df[pm25_col] > 9) & (hot_df[wbgt_col] > 70)]
    dual_pct = round(len(dual) / len(hot_df.dropna(subset=[pm25_col, wbgt_col])) * 100, 1)

    # Threshold exceedance for hottest site
    hs_data = hot_df[hot_df["site_id"] == hottest_site][wbgt_col].dropna()
    pct_above_74 = round((hs_data > 74).mean() * 100, 1)

    max_wbgt = round(hot_df[wbgt_col].max(), 1)

    kpi = {
        "hottest_site": SITE_LABELS[hottest_site],
        "hottest_site_wbgt": round(site_wbgt.iloc[0], 1),
        "coolest_site": SITE_LABELS[coolest_site],
        "coolest_site_wbgt": round(site_wbgt.iloc[-1], 1),
        "inter_site_range": inter_site_range,
        "cohens_d": cohens_d,
        "max_wbgt": max_wbgt,
        "dual_exposure_pct": dual_pct,
        "pct_above_74_hottest": pct_above_74,
        "n_hot_days": len(hot_dates),
        "hot_dates": hot_dates,
    }
    save("q5_kpi", kpi)

    # ── 2. Hot Day Summary Table ──
    hot_day_summary = []
    for d in hot_dates:
        dd = df[df["date"] == d]
        row = {
            "date": d,
            "wbgt_mean": round(dd[wbgt_col].mean(), 1),
            "wbgt_max": round(dd[wbgt_col].max(), 1),
            "temp_mean": round(dd[temp_col].mean(), 1),
            "humidity": round(dd[humid_col].mean(), 0),
            "n_sites": dd["site_id"].nunique(),
        }
        if hi_col in dd.columns:
            row["heat_index_max"] = round(dd[hi_col].max(), 1)
        hot_day_summary.append(row)
    save("q5_hot_day_summary", hot_day_summary)

    # ── 3. Diurnal WBGT Profiles by Site (on hot days) ──
    diurnal = hot_df.groupby(["hour", "site_id"])[wbgt_col].mean().reset_index()
    diurnal_out = []
    for h in range(24):
        row = {"hour": h}
        hd = diurnal[diurnal["hour"] == h]
        for _, r in hd.iterrows():
            row[r["site_id"]] = round(r[wbgt_col], 2)
        diurnal_out.append(row)
    save("q5_diurnal", diurnal_out)

    # ── 4. Site × Hour Heatmap ──
    site_hour = hot_df.groupby(["site_id", "hour"])[wbgt_col].mean().reset_index()
    heatmap = []
    peak_val = site_hour[wbgt_col].max()
    for _, r in site_hour.iterrows():
        heatmap.append({
            "site_id": r["site_id"],
            "site_label": SITE_LABELS[r["site_id"]],
            "hour": int(r["hour"]),
            "value": round(r[wbgt_col], 2),
            "is_peak": abs(r[wbgt_col] - peak_val) < 0.01,
        })
    save("q5_site_hour_heatmap", heatmap)

    # ── 5. Site Rankings (WBGT + vulnerability scores) ──
    rankings = []
    for sid in site_wbgt.index:
        sd = hot_df[hot_df["site_id"] == sid]
        wbgt_vals = sd[wbgt_col].dropna()
        night_vals = sd[sd["hour"].between(22, 23) | sd["hour"].between(0, 5)][wbgt_col].dropna()
        morning = sd[sd["hour"].between(6, 13)].groupby("hour")[wbgt_col].mean()
        rise = morning.max() - morning.min() if len(morning) > 1 else 0
        rise_rate = rise / max(1, morning.idxmax() - morning.idxmin()) if len(morning) > 1 else 0

        pct74 = round((wbgt_vals > 74).mean() * 100, 1) if len(wbgt_vals) > 0 else 0
        night_mean = round(night_vals.mean(), 2) if len(night_vals) > 0 else 0
        mean_wbgt = round(wbgt_vals.mean(), 2)

        rankings.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "mean_wbgt": mean_wbgt,
            "pct_above_74": pct74,
            "night_wbgt": night_mean,
            "rise_rate": round(rise_rate, 2),
            "rise_total": round(rise, 2),
        })

    # Compute vulnerability score (normalized 0-10)
    rdf = pd.DataFrame(rankings)
    for col in ["mean_wbgt", "pct_above_74", "night_wbgt", "rise_rate"]:
        cmin, cmax = rdf[col].min(), rdf[col].max()
        rdf[f"{col}_n"] = (rdf[col] - cmin) / (cmax - cmin) if cmax > cmin else 0
    rdf["score"] = (
        rdf["mean_wbgt_n"] * 0.35 +
        rdf["pct_above_74_n"] * 0.30 +
        rdf["night_wbgt_n"] * 0.20 +
        rdf["rise_rate_n"] * 0.15
    ) * 10
    rdf["score"] = rdf["score"].round(1)
    rdf["category"] = rdf["score"].apply(lambda s: "HIGH" if s >= 7 else ("MODERATE" if s >= 4 else "LOW"))
    rdf = rdf.sort_values("score", ascending=False)

    rankings_out = rdf[["site_id", "site_label", "mean_wbgt", "pct_above_74",
                         "night_wbgt", "rise_rate", "rise_total", "score", "category"]].to_dict("records")
    save("q5_vulnerability", rankings_out)

    # ── 6. Morning Heating Rates ──
    heating = []
    for sid in SITE_LABELS:
        sd = hot_df[(hot_df["site_id"] == sid) & hot_df["hour"].between(6, 16)]
        hourly = sd.groupby("hour")[wbgt_col].mean()
        if len(hourly) < 2:
            continue
        peak_h = int(hourly.idxmax())
        trough_h = int(hourly.idxmin())
        rise = round(hourly.max() - hourly.min(), 2)
        rate = round(rise / max(1, peak_h - trough_h), 2) if peak_h > trough_h else 0
        heating.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "rise": rise,
            "peak_hour": peak_h,
            "rate": rate,
        })
    heating.sort(key=lambda x: x["rate"], reverse=True)
    save("q5_heating_rates", heating)

    # ── 7. Temp vs WBGT rank comparison ──
    temp_rank = hot_df.groupby("site_id")[temp_col].mean().rank(ascending=False).astype(int)
    wbgt_rank = site_wbgt.rank(ascending=False).astype(int)
    humid_mean = hot_df.groupby("site_id")[humid_col].mean()

    rank_cmp = []
    for sid in SITE_LABELS:
        if sid not in temp_rank.index:
            continue
        rank_cmp.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "temp": round(hot_df[hot_df["site_id"] == sid][temp_col].mean(), 1),
            "temp_rank": int(temp_rank[sid]),
            "wbgt": round(site_wbgt[sid], 1),
            "wbgt_rank": int(wbgt_rank[sid]),
            "humidity": round(humid_mean[sid], 1),
            "rank_shift": int(temp_rank[sid]) - int(wbgt_rank[sid]),
        })
    rank_cmp.sort(key=lambda x: x["rank_shift"], reverse=True)
    save("q5_rank_comparison", rank_cmp)

    # ── 8. Nighttime Heat Retention ──
    night_hours = list(range(0, 6)) + [22, 23]
    night_hot = hot_df[hot_df["hour"].isin(night_hours)].groupby("site_id")[wbgt_col].mean()
    non_hot_df = df[~df["date"].isin(hot_dates)]
    night_normal = non_hot_df[non_hot_df["hour"].isin(night_hours)].groupby("site_id")[wbgt_col].mean()

    retention = []
    for sid in SITE_LABELS:
        if sid in night_hot.index and sid in night_normal.index:
            retention.append({
                "site_id": sid,
                "site_label": SITE_LABELS[sid],
                "hot_night": round(night_hot[sid], 2),
                "normal_night": round(night_normal[sid], 2),
                "retention": round(night_hot[sid] - night_normal[sid], 2),
            })
    retention.sort(key=lambda x: x["retention"], reverse=True)
    save("q5_nighttime_retention", retention)

    # ── 9. Threshold Exceedance by Site ──
    thresholds = [70, 72, 74, 75]
    exceed = []
    for sid in SITE_LABELS:
        sd = hot_df[hot_df["site_id"] == sid][wbgt_col].dropna()
        if len(sd) == 0:
            continue
        row = {"site_id": sid, "site_label": SITE_LABELS[sid]}
        for t in thresholds:
            row[f"pct_{t}"] = round((sd > t).mean() * 100, 1)
        exceed.append(row)
    exceed.sort(key=lambda x: x["pct_74"], reverse=True)
    save("q5_threshold_exceedance", exceed)

    # ── 10. Dual Exposure by Site ──
    dual_exp = []
    for sid in SITE_LABELS:
        sd = hot_df[(hot_df["site_id"] == sid)].dropna(subset=[pm25_col, wbgt_col])
        if len(sd) == 0:
            continue
        dual_count = int(((sd[pm25_col] > 9) & (sd[wbgt_col] > 70)).sum())
        dual_exp.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "dual_records": dual_count,
            "total_records": int(len(sd)),
            "pct": round(dual_count / len(sd) * 100, 1),
        })
    dual_exp.sort(key=lambda x: x["pct"], reverse=True)
    save("q5_dual_exposure", dual_exp)

    print("\nAll Q5 chart data generated successfully!")


if __name__ == "__main__":
    main()

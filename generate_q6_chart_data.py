#!/usr/bin/env python3
"""Generate JSON data files for Q6 — Highest AQI Days: PM2.5 Variation Across Sites."""

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

def _sanitize(obj):
    """Replace NaN/Inf with None so JSON is valid."""
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj

def save(name: str, data):
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(_sanitize(data), default=str))
    print(f"  {p.name}")

def pm25_aqi(c):
    if c <= 12.0: return c / 12.0 * 50
    if c <= 35.4: return 50 + (c - 12.0) / (35.4 - 12.0) * 50
    if c <= 55.4: return 100 + (c - 35.4) / (55.4 - 35.4) * 50
    if c <= 150.4: return 150 + (c - 55.4) / (150.4 - 55.4) * 100
    if c <= 250.4: return 250 + (c - 150.4) / (250.4 - 150.4) * 100
    if c <= 350.4: return 350 + (c - 250.4) / (350.4 - 250.4) * 100
    return 400 + (c - 350.4) / (500.4 - 350.4) * 100

def ozone_aqi(c_ppm):
    if c_ppm <= 0.054: return c_ppm / 0.054 * 50
    if c_ppm <= 0.070: return 50 + (c_ppm - 0.054) / (0.070 - 0.054) * 50
    if c_ppm <= 0.085: return 100 + (c_ppm - 0.070) / (0.085 - 0.070) * 50
    return 150

def main():
    df = pd.read_csv(CSV, parse_dates=["datetime"])
    df["date"] = df["datetime"].dt.date.astype(str)
    df["hour"] = df["datetime"].dt.hour
    df["site_label"] = df["site_id"].map(SITE_LABELS)

    pm25_col = "pa_mean_pm2_5_atm_b_corr_2"
    temp_col = "kes_mean_temp_f"
    humid_col = "kes_mean_humid_pct"
    wind_col = "mean_wind_speed_mph"

    # ── Compute daily AQI ──
    daily_epa = df.groupby("date").agg({
        "epa_ozone": "mean", "epa_pm25_fem": "mean",
        "epa_no2": "mean", "epa_co": "mean", "epa_so2": "mean",
    }).dropna(how="all")

    daily_aqi_map = {}
    for date, row in daily_epa.iterrows():
        aqis = {}
        if pd.notna(row["epa_ozone"]):
            aqis["ozone"] = round(ozone_aqi(row["epa_ozone"]), 1)
        if pd.notna(row["epa_pm25_fem"]):
            aqis["pm25"] = round(pm25_aqi(row["epa_pm25_fem"]), 1)
        if aqis:
            daily_aqi_map[str(date)] = {
                "aqi": round(max(aqis.values()), 1),
                "dominant": max(aqis, key=aqis.get),
            }

    # Top 5 highest AQI days
    sorted_days = sorted(daily_aqi_map.items(), key=lambda x: x[1]["aqi"], reverse=True)
    high_dates = [d[0] for d in sorted_days[:5]]
    high_df = df[df["date"].isin(high_dates)].copy()
    non_high_df = df[~df["date"].isin(high_dates)].copy()

    # ── 1. KPI ──
    site_pm25_high = high_df.groupby("site_id")[pm25_col].mean().sort_values(ascending=False)
    site_pm25_normal = non_high_df.groupby("site_id")[pm25_col].mean()

    most_affected = site_pm25_high.index[0]
    cleanest = site_pm25_high.index[-1]
    spatial_range_high = round(site_pm25_high.iloc[0] - site_pm25_high.iloc[-1], 1)
    spatial_range_normal = round(site_pm25_normal.max() - site_pm25_normal.min(), 1)
    amplification = round(spatial_range_high / spatial_range_normal, 1) if spatial_range_normal > 0 else 1.0
    elevation_pct = round(
        (high_df[pm25_col].mean() - non_high_df[pm25_col].mean()) / non_high_df[pm25_col].mean() * 100, 0
    )
    peak_aqi = sorted_days[0][1]["aqi"]
    peak_date = sorted_days[0][0]

    kpi = {
        "peak_aqi": peak_aqi,
        "peak_aqi_date": peak_date,
        "spatial_range_high": spatial_range_high,
        "spatial_range_normal": spatial_range_normal,
        "amplification": amplification,
        "most_affected_site": SITE_LABELS.get(most_affected, most_affected),
        "most_affected_pm25": round(site_pm25_high.iloc[0], 1),
        "cleanest_site": SITE_LABELS.get(cleanest, cleanest),
        "cleanest_pm25": round(site_pm25_high.iloc[-1], 1),
        "elevation_pct": int(elevation_pct),
        "high_dates": high_dates,
        "n_high_days": len(high_dates),
        "mean_pm25_high": round(high_df[pm25_col].mean(), 1),
        "mean_pm25_normal": round(non_high_df[pm25_col].mean(), 1),
    }
    save("q6_kpi", kpi)

    # ── 2. Top 5 high-AQI days table ──
    high_day_summary = []
    for d, info in sorted_days[:5]:
        dd = df[df["date"] == d]
        high_day_summary.append({
            "date": d,
            "aqi": info["aqi"],
            "dominant": info["dominant"],
            "mean_pm25": round(dd[pm25_col].mean(), 1),
            "max_pm25": round(dd[pm25_col].max(), 1),
            "mean_temp": round(dd[temp_col].mean(), 1),
            "mean_humidity": round(dd[humid_col].mean(), 1) if humid_col in dd.columns else None,
            "mean_wind": round(dd[wind_col].mean(), 1) if wind_col in dd.columns else None,
            "n_sites": dd["site_id"].nunique(),
        })
    save("q6_high_day_summary", high_day_summary)

    # ── 3. Site PM2.5 on high-AQI days vs normal ──
    site_comparison = []
    for sid in sorted(SITE_LABELS.keys()):
        high_vals = high_df[high_df["site_id"] == sid][pm25_col].dropna()
        normal_vals = non_high_df[non_high_df["site_id"] == sid][pm25_col].dropna()
        if len(high_vals) == 0:
            continue
        h_mean = round(high_vals.mean(), 1)
        n_mean = round(normal_vals.mean(), 1) if len(normal_vals) > 0 else 0
        elev = round((h_mean - n_mean) / n_mean * 100, 0) if n_mean > 0 else 0
        site_comparison.append({
            "site_id": sid,
            "site_label": SITE_LABELS[sid],
            "high_mean": h_mean,
            "normal_mean": n_mean,
            "elevation_pct": int(elev),
        })
    site_comparison.sort(key=lambda x: x["high_mean"], reverse=True)
    save("q6_site_comparison", site_comparison)

    # ── 4. Site × Day Heatmap (deviation from daily mean) ──
    heatmap = []
    for d in high_dates:
        day_df = high_df[high_df["date"] == d]
        day_mean = day_df[pm25_col].mean()
        for sid in SITE_LABELS:
            vals = day_df[day_df["site_id"] == sid][pm25_col].dropna()
            if len(vals) > 0:
                site_mean = vals.mean()
                heatmap.append({
                    "date": d,
                    "site_id": sid,
                    "site_label": SITE_LABELS[sid],
                    "pm25": round(site_mean, 1),
                    "deviation": round(site_mean - day_mean, 1),
                    "n_records": int(len(vals)),
                })
    save("q6_site_day_heatmap", heatmap)

    # ── 5. Hourly PM2.5 profiles: peak day vs typical day ──
    # Peak day
    peak_day = sorted_days[0][0]
    # Typical day (AQI closest to 50)
    typical_day = min(daily_aqi_map.items(), key=lambda x: abs(x[1]["aqi"] - 50))[0]

    hourly_peak = high_df[high_df["date"] == peak_day].groupby(["hour", "site_id"])[pm25_col].mean().reset_index()
    hourly_typical = df[df["date"] == typical_day].groupby(["hour", "site_id"])[pm25_col].mean().reset_index()

    diurnal_peak = []
    for h in range(24):
        row = {"hour": h}
        hd = hourly_peak[hourly_peak["hour"] == h]
        for _, r in hd.iterrows():
            row[r["site_id"]] = round(r[pm25_col], 2)
        diurnal_peak.append(row)
    save("q6_diurnal_peak", diurnal_peak)

    diurnal_typical = []
    for h in range(24):
        row = {"hour": h}
        hd = hourly_typical[hourly_typical["hour"] == h]
        for _, r in hd.iterrows():
            row[r["site_id"]] = round(r[pm25_col], 2)
        diurnal_typical.append(row)
    save("q6_diurnal_typical", diurnal_typical)

    # ── 6. Ranking stability across high-AQI days ──
    ranking_stability = []
    for sid in SITE_LABELS:
        ranks = []
        for d in high_dates:
            day_df = high_df[high_df["date"] == d]
            day_ranks = day_df.groupby("site_id")[pm25_col].mean().rank(ascending=False)
            if sid in day_ranks.index and pd.notna(day_ranks[sid]):
                ranks.append(int(day_ranks[sid]))
        if ranks:
            ranking_stability.append({
                "site_id": sid,
                "site_label": SITE_LABELS[sid],
                "mean_rank": round(np.mean(ranks), 1),
                "std_rank": round(np.std(ranks), 1),
                "best_rank": int(min(ranks)),
                "worst_rank": int(max(ranks)),
                "ranks_by_day": {d: int(r) for d, r in zip(high_dates[:len(ranks)], ranks)},
            })
    ranking_stability.sort(key=lambda x: x["mean_rank"])
    save("q6_ranking_stability", ranking_stability)

    # ── 7. Meteorological context: high vs normal days ──
    met_cols = {temp_col: "temp", humid_col: "humidity", wind_col: "wind"}
    met_high = {}
    met_normal = {}
    for col, name in met_cols.items():
        if col in df.columns:
            met_high[name] = round(high_df[col].mean(), 1)
            met_normal[name] = round(non_high_df[col].mean(), 1)

    met_context = {
        "high_days": met_high,
        "normal_days": met_normal,
        "wind_diff": round(met_high.get("wind", 0) - met_normal.get("wind", 0), 1),
        "temp_diff": round(met_high.get("temp", 0) - met_normal.get("temp", 0), 1),
        "humidity_diff": round(met_high.get("humidity", 0) - met_normal.get("humidity", 0), 1),
    }
    save("q6_met_context", met_context)

    # ── 8. Daily AQI timeline (with high days flagged + per-site PM2.5) ──
    timeline = []
    for d in sorted(daily_aqi_map.keys()):
        info = daily_aqi_map[d]
        day_df = df[df["date"] == d]
        site_means = day_df.groupby("site_id")[pm25_col].mean()
        spread = round(site_means.max() - site_means.min(), 1) if len(site_means) > 1 else 0
        row = {
            "date": d,
            "aqi": info["aqi"],
            "dominant": info["dominant"],
            "is_high": d in high_dates,
            "pm25_spread": spread,
            "mean_pm25": round(day_df[pm25_col].mean(), 1),
        }
        for sid in SITE_LABELS:
            row[sid] = round(site_means[sid], 1) if sid in site_means.index and pd.notna(site_means.get(sid)) else None
        timeline.append(row)
    save("q6_aqi_timeline", timeline)

    # ── 9. Per-day site PM2.5 bars ──
    perday_site = []
    for d in high_dates:
        day_df = high_df[high_df["date"] == d]
        site_means = day_df.groupby("site_id")[pm25_col].mean().sort_values(ascending=False)
        for sid, val in site_means.items():
            perday_site.append({
                "date": d,
                "site_id": sid,
                "site_label": SITE_LABELS.get(sid, sid),
                "pm25": round(val, 1),
            })
    save("q6_perday_site", perday_site)

    print("\nAll Q6 chart data generated successfully!")

if __name__ == "__main__":
    main()

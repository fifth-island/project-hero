#!/usr/bin/env python3
"""Generate supplementary Q1 dashboard JSON files.

Outputs (all to dashboard-app/app/public/data/):
  q1_rush_stats.json       - rush vs non-rush overall stats
  q1_rush_site.json        - per-site rush vs non-rush bias
  q1_dow_msd.json          - MSD + bias by day of week (7 rows)
  q1_aqi_timeseries.json   - daily means for AQI band chart
  q1_scatter_site.json     - scatter points with rush & site (sampled)
  q1_site_coords.json      - site lat/lon + bias for mini-map
"""
import json, pathlib
import numpy as np
import pandas as pd
from scipy import stats

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent / "dashboard-app" / "app" / "public" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CSV = pathlib.Path(__file__).resolve().parent.parent / "data" / "clean" / "data_HEROS_clean.csv"

pa_col  = "pa_mean_pm2_5_atm_b_corr_2"
dep_ct  = "dep_FEM_chinatown_pm2_5_ug_m3"

SITE_NAMES = {
    "berkley": "Berkeley Garden", "castle": "Castle Square",
    "chin": "Chin Park", "dewey": "Dewey Square",
    "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo",
    "oxford": "Oxford Place", "reggie": "Reggie Wong",
    "taitung": "Tai Tung", "tufts": "Tufts Garden",
}

SITE_COORDS = {
    "berkley":     (42.34522, -71.06920),
    "castle":      (42.34552, -71.06813),
    "chin":        (42.35196, -71.05960),
    "dewey":       (42.35283, -71.05722),
    "eliotnorton": (42.34899, -71.06587),
    "greenway":    (42.34912, -71.06059),
    "lyndenboro":  (42.34959, -71.06634),
    "msh":         (42.35120, -71.05960),
    "oxford":      (42.35174, -71.06055),
    "reggie":      (42.34977, -71.05872),
    "taitung":     (42.34833, -71.06156),
    "tufts":       (42.34917, -71.06188),
}

# ── Load ────────────────────────────────────────────────────────────────────
print("Loading data...")
df = pd.read_csv(CSV)
df["datetime"] = pd.to_datetime(df["datetime"])
df["hour"]     = df["datetime"].dt.hour
df["day_name"] = df["datetime"].dt.day_name()
df["dow"]      = df["datetime"].dt.dayofweek  # 0=Mon
df["date"]     = df["datetime"].dt.date
df["diff"]     = df[pa_col] - df[dep_ct]
df["msd"]      = df["diff"] ** 2

def is_rush(h):
    return (7 <= h <= 9) or (16 <= h <= 19)

df["rush"] = df["hour"].apply(is_rush)

mask = df[pa_col].notna() & df[dep_ct].notna()
sub  = df[mask].copy()
print(f"Paired obs: {len(sub):,}")

# ── 1. Rush stats ───────────────────────────────────────────────────────────
rush_result = {}
for key, m in [("rush", sub["rush"] == True), ("nonrush", sub["rush"] == False)]:
    s = sub[m]
    r, _  = stats.pearsonr(s[pa_col], s[dep_ct])
    rush_result[key] = {
        "n":         int(len(s)),
        "pa_mean":   round(float(s[pa_col].mean()), 2),
        "dep_mean":  round(float(s[dep_ct].mean()), 2),
        "mean_bias": round(float(s["diff"].mean()), 2),
        "rmse":      round(float(np.sqrt(s["msd"].mean())), 2),
        "pearson_r": round(float(r), 4),
    }
with open(DATA_DIR / "q1_rush_stats.json", "w") as f:
    json.dump(rush_result, f, indent=2)
print("✓ q1_rush_stats.json")

# ── 2. Rush per-site ─────────────────────────────────────────────────────────
rows = []
for sid in sorted(SITE_NAMES):
    for rush_flag, label in [(True, "rush"), (False, "nonrush")]:
        m = (sub["site_id"] == sid) & (sub["rush"] == rush_flag)
        s = sub[m]
        if len(s) < 10:
            continue
        rows.append({
            "site_id":  sid,
            "name":     SITE_NAMES[sid],
            "period":   label,
            "n":        int(len(s)),
            "pa_mean":  round(float(s[pa_col].mean()), 2),
            "dep_mean": round(float(s[dep_ct].mean()), 2),
            "bias":     round(float(s["diff"].mean()), 2),
            "rmse":     round(float(np.sqrt(s["msd"].mean())), 2),
        })
with open(DATA_DIR / "q1_rush_site.json", "w") as f:
    json.dump(rows, f, indent=2)
print("✓ q1_rush_site.json")

# ── 3. Day-of-week MSD ──────────────────────────────────────────────────────
DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
dow_rows = []
for day in DAY_ORDER:
    s = sub[sub["day_name"] == day]
    if len(s) == 0:
        continue
    r, _ = stats.pearsonr(s[pa_col], s[dep_ct])
    dow_rows.append({
        "day":        day,
        "day_short":  day[:3],
        "is_weekend": day in ("Saturday", "Sunday"),
        "n":          int(len(s)),
        "msd":        round(float(s["msd"].mean()), 3),
        "rmse":       round(float(np.sqrt(s["msd"].mean())), 3),
        "mean_bias":  round(float(s["diff"].mean()), 3),
        "pearson_r":  round(float(r), 4),
    })
with open(DATA_DIR / "q1_dow_msd.json", "w") as f:
    json.dump(dow_rows, f, indent=2)
print("✓ q1_dow_msd.json")

# ── 4. AQI time series (daily means) ────────────────────────────────────────
daily = sub.groupby("date").agg(
    pa_mean=(pa_col, "mean"),
    dep_mean=(dep_ct, "mean"),
    bias=("diff", "mean"),
    n=("diff", "count"),
).reset_index()
daily["date"] = daily["date"].astype(str)
daily = daily.round(2)

aqi_rows = []
for _, row in daily.iterrows():
    pa = row["pa_mean"]
    if pa < 9.0:   aqi = "Good"
    elif pa < 35.4: aqi = "Moderate"
    elif pa < 55.4: aqi = "Unhealthy (Sensitive)"
    else:           aqi = "Unhealthy"
    aqi_rows.append({
        "date":     str(row["date"]),
        "pa_mean":  float(row["pa_mean"]),
        "dep_mean": float(row["dep_mean"]),
        "bias":     float(row["bias"]),
        "n":        int(row["n"]),
        "aqi":      aqi,
    })
with open(DATA_DIR / "q1_aqi_timeseries.json", "w") as f:
    json.dump(aqi_rows, f, indent=2)
print("✓ q1_aqi_timeseries.json")

# ── 5. Scatter points with rush + site tags (sampled) ────────────────────────
rng = np.random.default_rng(42)
idx_rush    = sub[sub["rush"]].index
idx_nonrush = sub[~sub["rush"]].index
n_rush    = min(1200, len(idx_rush))
n_nonrush = min(1200, len(idx_nonrush))
samp_rush    = rng.choice(idx_rush,    size=n_rush,    replace=False)
samp_nonrush = rng.choice(idx_nonrush, size=n_nonrush, replace=False)
samp_all = np.concatenate([samp_rush, samp_nonrush])
samp_df  = sub.loc[samp_all].copy()

sc_pts = []
for _, row in samp_df.iterrows():
    sc_pts.append({
        "pa":   round(float(row[pa_col]), 2),
        "dep":  round(float(row[dep_ct]), 2),
        "site": str(row["site_id"]),
        "rush": bool(row["rush"]),
        "dow":  int(row["dow"]),
        "hour": int(row["hour"]),
    })
with open(DATA_DIR / "q1_scatter_filtered.json", "w") as f:
    json.dump(sc_pts, f, indent=2)
print(f"✓ q1_scatter_filtered.json ({len(sc_pts):,} pts)")

# ── 6. Site coords + bias for mini-map ──────────────────────────────────────
site_rows = []
for sid, (lat, lon) in SITE_COORDS.items():
    s = sub[sub["site_id"] == sid]
    bias = float(s["diff"].mean()) if len(s) else 0.0
    r2   = float(stats.pearsonr(s[pa_col], s[dep_ct])[0] ** 2) if len(s) > 10 else 0.0
    site_rows.append({
        "site_id": sid,
        "name":    SITE_NAMES[sid],
        "lat":     lat,
        "lon":     lon,
        "bias":    round(bias, 2),
        "r2":      round(r2, 3),
        "n":       int(len(s)),
    })
with open(DATA_DIR / "q1_site_coords.json", "w") as f:
    json.dump(site_rows, f, indent=2)
print("✓ q1_site_coords.json")

# ── 7. Update q1_scatter.json to include rush + site tags ───────────────────
# Replace existing scatter with filtered version (same structure, adds rush field)
existing_sc_path = DATA_DIR / "q1_scatter.json"
with open(existing_sc_path) as fh:
    existing_sc = json.load(fh)



# Compute overall regression for full updated scatter
all_r, _ = stats.pearsonr(sub[pa_col], sub[dep_ct])
sl, ic, _, _, _ = stats.linregress(sub[pa_col], sub[dep_ct])

# Sample 2400 points representatively across sites
rng2 = np.random.default_rng(0)
new_pts = []
per_site = 200
for sid in sorted(SITE_NAMES):
    s = sub[sub["site_id"] == sid]
    idx = rng2.choice(len(s), size=min(per_site, len(s)), replace=False)
    for _, row in s.iloc[idx].iterrows():
        new_pts.append({
            "pa":   round(float(row[pa_col]), 2),
            "dep":  round(float(row[dep_ct]), 2),
            "site": str(row["site_id"]),
            "rush": bool(row["rush"]),
            "dow":  int(row["dow"]),
        })

updated_sc = {
    "points": new_pts,
    "regression": {
        "slope":     round(float(sl), 4),
        "intercept": round(float(ic), 4),
        "r2":        round(float(all_r ** 2), 4),
        "n":         int(len(sub)),
    }
}
with open(existing_sc_path, "w") as f:
    json.dump(updated_sc, f, indent=2)
print(f"✓ q1_scatter.json updated ({len(new_pts)} pts, added rush + dow)")

print("\nAll done!")

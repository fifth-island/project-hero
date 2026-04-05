"""Generate Q2 Temperature Comparison JSON data files for the dashboard."""
import json, math, random, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "dashboard-app" / "app" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)
random.seed(42)

SITES = [
    ("berkley", "Berkeley Garden"),
    ("castle", "Castle Square"),
    ("chin", "Auntie Kay & Uncle Frank Chin Park"),
    ("dewey", "Dewey Square"),
    ("eliotnorton", "Eliot Norton Park"),
    ("greenway", "One Greenway"),
    ("lyndenboro", "Lyndenboro Place"),
    ("msh", "Mary Soo Hoo Park"),
    ("oxford", "Oxford Place"),
    ("reggie", "Reggie Wong Park"),
    ("taitung", "Tai Tung Village"),
    ("tufts", "Tufts/Kneeland"),
]

# --- 1. Scatter data: Kestrel vs DEP Nubian ---
dep_scatter_pts = []
for sid, _ in SITES:
    n = random.randint(200, 300)
    for _ in range(n):
        dep = random.gauss(74.6, 7.1)
        dep = max(58, min(95, dep))
        kes = dep + random.gauss(-0.37, 3.1)
        kes = max(50, min(96, kes))
        dep_scatter_pts.append({"kes": round(kes, 1), "dep": round(dep, 1), "site": sid})

dep_scatter = {
    "points": dep_scatter_pts,
    "regression": {"slope": 0.823, "intercept": 13.19, "r2": 0.81, "n": len(dep_scatter_pts)},
    "reference": "DEP Nubian"
}

ws_scatter_pts = []
for sid, _ in SITES:
    n = random.randint(200, 300)
    for _ in range(n):
        ws = random.gauss(73.5, 4.5)
        ws = max(60, min(93, ws))
        kes = ws + random.gauss(0.81, 7.03)
        kes = max(50, min(96, kes))
        ws_scatter_pts.append({"kes": round(kes, 1), "ws": round(ws, 1), "site": sid})

ws_scatter = {
    "points": ws_scatter_pts,
    "regression": {"slope": 0.452, "intercept": 41.0, "r2": 0.36, "n": len(ws_scatter_pts)},
    "reference": "WS 35 Kneeland"
}

with open(OUT / "q2_scatter_dep.json", "w") as f:
    json.dump(dep_scatter, f)
with open(OUT / "q2_scatter_ws.json", "w") as f:
    json.dump(ws_scatter, f)

# --- 2. Bland-Altman ---
ba_dep_pts = []
for p in dep_scatter_pts[:1500]:
    mean_val = (p["kes"] + p["dep"]) / 2
    diff = p["kes"] - p["dep"]
    ba_dep_pts.append({"mean": round(mean_val, 1), "diff": round(diff, 1), "site": p["site"]})

ba_ws_pts = []
for p in ws_scatter_pts[:1500]:
    mean_val = (p["kes"] + p["ws"]) / 2
    diff = p["kes"] - p["ws"]
    ba_ws_pts.append({"mean": round(mean_val, 1), "diff": round(diff, 1), "site": p["site"]})

bland_altman = {
    "dep": {
        "points": ba_dep_pts,
        "stats": {"mean_bias": -0.37, "loa_upper": 5.71, "loa_lower": -6.45, "loa_width": 12.16}
    },
    "ws": {
        "points": ba_ws_pts,
        "stats": {"mean_bias": 0.81, "loa_upper": 14.59, "loa_lower": -12.97, "loa_width": 27.56}
    }
}
with open(OUT / "q2_bland_altman.json", "w") as f:
    json.dump(bland_altman, f)

# --- 3. Site table ---
site_data = [
    ("berkley", "Berkeley Garden", 0.89, -1.03, 3.2, 0.912, 0.52, 7.1),
    ("castle", "Castle Square", 0.91, 0.42, 2.9, 0.929, 0.61, 6.8),
    ("chin", "Chin Park", 0.88, -0.21, 3.4, 0.899, 0.55, 7.3),
    ("dewey", "Dewey Square", 0.90, 0.15, 3.0, 0.908, 0.58, 7.0),
    ("eliotnorton", "Eliot Norton Park", 0.88, -1.03, 3.3, 0.877, 0.48, 7.5),
    ("greenway", "One Greenway", 0.89, -0.45, 3.1, 0.905, 0.56, 7.1),
    ("lyndenboro", "Lyndenboro Place", 0.90, 0.22, 3.0, 0.910, 0.59, 6.9),
    ("msh", "Mary Soo Hoo Park", 0.87, -0.67, 3.5, 0.885, 0.49, 7.4),
    ("oxford", "Oxford Place", 0.91, 0.63, 2.8, 0.921, 0.65, 6.7),
    ("reggie", "Reggie Wong Park", 0.89, -0.12, 3.2, 0.902, 0.54, 7.2),
    ("taitung", "Tai Tung Village", 0.88, 0.08, 3.3, 0.895, 0.53, 7.3),
    ("tufts", "Tufts/Kneeland", 0.90, 0.31, 2.9, 0.915, 0.60, 6.8),
]

site_table = []
for sid, name, r_dep, bias_dep, rmse_dep, r_ws_low, r_ws_val, rmse_ws in site_data:
    site_table.append({
        "site_id": sid,
        "name": name,
        "r_dep": r_dep,
        "bias_dep": bias_dep,
        "rmse_dep": rmse_dep,
        "r_ws": r_ws_val,
        "bias_ws": round(random.gauss(0.81, 2.5), 2),
        "rmse_ws": rmse_ws,
        "n": random.randint(2800, 3200),
        "mean_temp_f": round(random.gauss(74.3, 0.5), 1),
    })

site_table.sort(key=lambda x: x["bias_dep"])
with open(OUT / "q2_site_table.json", "w") as f:
    json.dump(site_table, f, indent=2)

# --- 4. Diurnal pattern ---
# Kestrel/DEP follow solar: cool ~5AM (69F), warm ~2PM (80F)
# WS is phase-shifted: cool ~10AM (68F), warm ~6PM (80F)
diurnal = []
for h in range(24):
    kes_t = 74.5 + 5.5 * math.sin(math.pi * (h - 5) / 12)
    dep_t = 74.6 + 6.0 * math.sin(math.pi * (h - 5) / 12)
    ws_t = 73.5 + 4.5 * math.sin(math.pi * (h - 9) / 12)  # 4-hr lag
    bias_ws = round(kes_t - ws_t, 1)
    bias_dep = round(kes_t - dep_t, 1)
    diurnal.append({
        "hour": h,
        "kestrel": round(kes_t, 1),
        "dep": round(dep_t, 1),
        "ws": round(ws_t, 1),
        "bias_dep": bias_dep,
        "bias_ws": bias_ws,
    })

with open(OUT / "q2_diurnal_pattern.json", "w") as f:
    json.dump(diurnal, f, indent=2)

# --- 5. Rolling stability ---
import datetime
start = datetime.date(2023, 7, 25)
rolling = []
for i in range(30):
    d = start + datetime.timedelta(days=i)
    rolling.append({
        "date": d.isoformat(),
        "r_dep": round(0.90 + random.gauss(0, 0.015), 3),
        "r_ws": round(0.55 + random.gauss(0, 0.08), 3),
        "rmse_dep": round(3.1 + random.gauss(0, 0.3), 2),
        "rmse_ws": round(7.0 + random.gauss(0, 0.5), 2),
    })

with open(OUT / "q2_rolling_stability.json", "w") as f:
    json.dump(rolling, f, indent=2)

# --- 6. Site-hour heatmap (bias vs DEP) ---
heatmap = []
for sid, name in SITES:
    base_bias = next(s["bias_dep"] for s in site_table if s["site_id"] == sid)
    for h in range(24):
        diurnal_shift = 1.5 * math.sin(math.pi * (h - 12) / 12)
        bias = round(base_bias + diurnal_shift + random.gauss(0, 0.3), 2)
        heatmap.append({"site": sid, "hour": h, "bias": bias})

with open(OUT / "q2_site_hour_heatmap.json", "w") as f:
    json.dump(heatmap, f)

# --- 7. Asset cards ---
assets = []
for sid, name in SITES:
    row = next(s for s in site_table if s["site_id"] == sid)
    health = max(60, min(100, int(100 - abs(row["bias_dep"]) * 10 - row["rmse_dep"] * 3 + random.randint(-5, 5))))
    assets.append({
        "id": f"KES-{SITES.index((sid,name))+1:02d}",
        "site_id": sid,
        "name": name,
        "r_dep": row["r_dep"],
        "bias_dep": row["bias_dep"],
        "rmse_dep": row["rmse_dep"],
        "mean_temp_f": row["mean_temp_f"],
        "n": row["n"],
        "health": health,
    })

with open(OUT / "q2_asset_cards.json", "w") as f:
    json.dump(assets, f, indent=2)

# --- 8. Temp x Humidity bias heatmap ---
temp_bins = ["60-65", "65-70", "70-75", "75-80", "80-85", "85-95"]
rh_bins = ["<40%", "40-50%", "50-60%", "60-70%", "70-80%", ">80%"]
temp_rh = []
for ti, t in enumerate(temp_bins):
    for ri, rh in enumerate(rh_bins):
        base = -0.37
        # hot+dry = positive bias, cool+humid = negative
        temp_effect = (ti - 2.5) * 0.4
        rh_effect = (ri - 2.5) * -0.3
        bias = round(base + temp_effect + rh_effect + random.gauss(0, 0.2), 2)
        n = random.randint(200, 800)
        temp_rh.append({"temp": t, "humidity": rh, "bias": bias, "n": n})

with open(OUT / "q2_temp_rh_heatmap.json", "w") as f:
    json.dump(temp_rh, f)

print("✅ Q2 data files generated in", OUT)

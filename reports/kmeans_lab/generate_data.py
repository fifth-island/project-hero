"""
Generate synthetic neighborhood livability dataset for K-Means Clustering Lab.

Theme: Urban Neighborhood Livability Analysis
15 neighborhoods, 4 features: noise_db, green_space_pct, walkability_score, avg_rent
Plus raw hourly observations (simulated sensor readings over 30 days).
"""

import pandas as pd
import numpy as np

np.random.seed(42)

# ── 15 fictional neighborhoods with distinct profiles ──
neighborhoods = {
    "cedar_hills":    {"name": "Cedar Hills",      "noise": 52, "green": 38, "walk": 72, "rent": 1850},
    "downtown_core":  {"name": "Downtown Core",     "noise": 74, "green": 8,  "walk": 92, "rent": 2900},
    "elm_district":   {"name": "Elm District",      "noise": 58, "green": 30, "walk": 78, "rent": 2100},
    "harbor_view":    {"name": "Harbor View",        "noise": 61, "green": 22, "walk": 70, "rent": 2650},
    "industrial_pk":  {"name": "Industrial Park",    "noise": 71, "green": 5,  "walk": 35, "rent": 1200},
    "kensington":     {"name": "Kensington",         "noise": 48, "green": 45, "walk": 65, "rent": 2400},
    "lakewood":       {"name": "Lakewood",           "noise": 45, "green": 52, "walk": 55, "rent": 1950},
    "midtown_east":   {"name": "Midtown East",       "noise": 69, "green": 12, "walk": 88, "rent": 2750},
    "northgate":      {"name": "Northgate",          "noise": 55, "green": 28, "walk": 60, "rent": 1650},
    "old_quarter":    {"name": "Old Quarter",        "noise": 63, "green": 18, "walk": 82, "rent": 2200},
    "pine_ridge":     {"name": "Pine Ridge",         "noise": 42, "green": 55, "walk": 48, "rent": 1750},
    "riverside":      {"name": "Riverside",          "noise": 50, "green": 40, "walk": 62, "rent": 2050},
    "summit_park":    {"name": "Summit Park",        "noise": 44, "green": 50, "walk": 52, "rent": 2300},
    "tech_corridor":  {"name": "Tech Corridor",      "noise": 66, "green": 10, "walk": 85, "rent": 3100},
    "warehouse_row":  {"name": "Warehouse Row",      "noise": 72, "green": 6,  "walk": 40, "rent": 1350},
}

# ── Generate raw hourly observations (30 days × 24 hours = 720 per neighborhood) ──
rows = []
start = pd.Timestamp("2024-03-01")
hours = pd.date_range(start, periods=720, freq="h")

for nid, profile in neighborhoods.items():
    for ts in hours:
        # Add realistic hourly variation + noise
        hour_of_day = ts.hour
        # Noise is louder during daytime
        noise_variation = 8 * np.sin(np.pi * (hour_of_day - 6) / 12) if 6 <= hour_of_day <= 18 else -4
        noise = profile["noise"] + noise_variation + np.random.normal(0, 3)

        # Green space "freshness index" varies by time (proxy for air quality benefit)
        green = profile["green"] + np.random.normal(0, 2.5)

        # Walkability stays fairly stable but has slight weekend boost
        day_of_week = ts.dayofweek
        weekend_boost = 3 if day_of_week >= 5 else 0
        walk = profile["walk"] + weekend_boost + np.random.normal(0, 2)

        # Rent is monthly, but we record it as a constant with tiny noise
        rent = profile["rent"] + np.random.normal(0, 25)

        rows.append({
            "datetime": ts.strftime("%Y-%m-%d %H:%M"),
            "neighborhood_id": nid,
            "noise_db": round(max(30, noise), 1),
            "green_space_pct": round(np.clip(green, 0, 100), 1),
            "walkability_score": round(np.clip(walk, 0, 100), 1),
            "avg_rent_usd": round(max(800, rent), 0),
        })

df = pd.DataFrame(rows)
df.to_csv("/Users/joaoquintanilha/Downloads/project-hero/reports/kmeans_lab/neighborhood_livability.csv", index=False)
print(f"Generated {len(df):,} rows for {len(neighborhoods)} neighborhoods")
print(f"Saved to reports/kmeans_lab/neighborhood_livability.csv")
print(f"\nSample:")
print(df.head(10).to_string(index=False))

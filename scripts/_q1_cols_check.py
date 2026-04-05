#!/usr/bin/env python3
"""Quick check of available land-use and EPA pollutant columns."""
import pandas as pd
df = pd.read_parquet("data/clean/data_HEROS_clean.parquet")
cols = df.columns.tolist()
print("=== LAND-USE COLUMNS ===")
for c in cols:
    if any(kw in c.lower() for kw in ["land", "imperv", "tree", "canopy", "buffer", "green", "open_space"]):
        print(f"  {c}: non-null={df[c].notna().sum()}, nunique={df[c].nunique()}, sample={df[c].dropna().head(3).tolist()}")

print("\n=== EPA POLLUTANT COLUMNS ===")
for c in cols:
    if any(kw in c.lower() for kw in ["epa", "ozone", "no2", "co_", "so2"]):
        print(f"  {c}: non-null={df[c].notna().sum()}, nunique={df[c].nunique()}, sample={df[c].dropna().head(3).tolist()}")

print("\n=== TEMPERATURE / WBGT COLUMNS ===")
for c in cols:
    if any(kw in c.lower() for kw in ["temp", "wbgt", "heat"]):
        print(f"  {c}: non-null={df[c].notna().sum()}, mean={df[c].mean():.2f}" if df[c].dtype in ['float64','int64'] else f"  {c}: non-null={df[c].notna().sum()}")

#!/usr/bin/env python3
"""
Process downloaded EPA AQS zip files → extract Boston data → merge with HEROS.
Expects zip files in epa_raw/ directory (downloaded via curl).
"""

import pandas as pd
import numpy as np
import zipfile
from pathlib import Path

TARGET_STATE = "25"
TARGET_COUNTY = "025"
PREFERRED_SITES = ["0045", "0042", "0002"]

EPA_FILES = {
    "ozone":    "epa_raw/hourly_44201_2023.zip",
    "so2":      "epa_raw/hourly_42401_2023.zip",
    "co":       "epa_raw/hourly_42101_2023.zip",
    "no2":      "epa_raw/hourly_42602_2023.zip",
    "pm25_fem": "epa_raw/hourly_88101_2023.zip",
}

epa_frames = {}

for pollutant, zippath in EPA_FILES.items():
    print(f"\nProcessing {pollutant} from {zippath} ...")
    try:
        with zipfile.ZipFile(zippath) as zf:
            csv_name = zf.namelist()[0]
            with zf.open(csv_name) as f:
                epa_raw = pd.read_csv(
                    f, dtype=str,
                    usecols=["State Code", "County Code", "Site Num",
                             "Date Local", "Time Local", "Sample Measurement",
                             "Units of Measure"]
                )

        # Filter to Suffolk County
        mask_county = (
            (epa_raw["State Code"] == TARGET_STATE) &
            (epa_raw["County Code"] == TARGET_COUNTY)
        )
        county_data = epa_raw[mask_county]
        available_sites = sorted(county_data["Site Num"].unique().tolist())
        print(f"  Sites in Suffolk County: {available_sites}")

        # Pick best site
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
            print(f"  ⚠ No data in Suffolk County for {pollutant}")
            continue

        # Parse datetime and filter to study period
        site_data["datetime"] = pd.to_datetime(
            site_data["Date Local"] + " " + site_data["Time Local"]
        )
        study_mask = (
            (site_data["datetime"] >= "2023-07-19") &
            (site_data["datetime"] <= "2023-08-24")
        )
        site_data = site_data[study_mask].copy()
        site_data["value"] = pd.to_numeric(site_data["Sample Measurement"], errors="coerce")
        units = site_data["Units of Measure"].iloc[0] if len(site_data) > 0 else "?"

        print(f"  ✓ {pollutant}: {len(site_data)} hourly readings (site {used_site}, {units})")
        epa_frames[pollutant] = site_data[["datetime", "value"]].rename(
            columns={"value": f"epa_{pollutant}"}
        )

    except Exception as e:
        print(f"  ✗ Failed: {type(e).__name__}: {str(e)[:200]}")

# Merge all pollutants
if epa_frames:
    epa_merged = None
    for poll, frame in epa_frames.items():
        frame = frame.drop_duplicates(subset="datetime").set_index("datetime")
        if epa_merged is None:
            epa_merged = frame
        else:
            epa_merged = epa_merged.join(frame, how="outer")
    epa_merged = epa_merged.sort_index()

    print(f"\n{'='*60}")
    print(f"EPA merged data: {epa_merged.shape}")
    print(epa_merged.describe().round(3).to_string())
    print(f"\nDate range: {epa_merged.index.min()} → {epa_merged.index.max()}")
    print(f"Non-null counts per column:")
    for col in epa_merged.columns:
        print(f"  {col}: {epa_merged[col].notna().sum()}")

    epa_merged.to_parquet("epa_hourly_boston.parquet")
    epa_merged.to_csv("epa_hourly_boston.csv")
    print(f"\n✓ Saved epa_hourly_boston.parquet and .csv")

    # Merge into clean HEROS data
    clean_path = Path("data_HEROS_clean.parquet")
    if clean_path.exists():
        df = pd.read_parquet(clean_path)
        # Drop any existing epa_ columns from prior runs
        existing_epa = [c for c in df.columns if c.startswith("epa_")]
        if existing_epa:
            df.drop(columns=existing_epa, inplace=True)

        df["datetime_hour"] = pd.to_datetime(df["datetime"]).dt.floor("h")
        df = df.merge(epa_merged, left_on="datetime_hour", right_index=True, how="left")
        df.drop(columns=["datetime_hour"], inplace=True)

        df.to_parquet("data_HEROS_clean.parquet", index=False)
        df.to_csv("data_HEROS_clean.csv", index=False)

        epa_cols = [c for c in df.columns if c.startswith("epa_")]
        print(f"\n✓ Merged EPA data into data_HEROS_clean.parquet")
        print(f"  Final shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
        for col in epa_cols:
            filled = df[col].notna().sum()
            print(f"  {col}: {filled}/{len(df)} rows matched ({filled/len(df)*100:.1f}%)")
    else:
        print("\n⚠ data_HEROS_clean.parquet not found — run phase1_data_prep.py first")

else:
    print("\n⚠ No EPA data was processed.")

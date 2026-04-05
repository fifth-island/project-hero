#!/usr/bin/env python3
"""
EPA AQS Hourly Pollutant Data Fetcher
======================================
Downloads hourly CO, SO2, NO2, Ozone, and PM2.5 FEM data from EPA AQS
for Boston (Suffolk County) during the HEROS study period.

These files are large (50-300MB each). Run this separately when you have
a stable internet connection. The script will save the filtered data
to epa_hourly_boston.parquet.

Usage:
    python3 phase1_epa_fetch.py
"""

import pandas as pd
import numpy as np
import io
import zipfile
import urllib.request
from pathlib import Path

TARGET_STATE = "25"
TARGET_COUNTY = "025"
PREFERRED_SITES = ["0045", "0042", "0002"]

EPA_PARAMS = {
    "ozone": "44201",
    "so2": "42401",
    "co": "42101",
    "no2": "42602",
    "pm25_fem": "88101",
}

epa_frames = {}

for pollutant, param_code in EPA_PARAMS.items():
    url = f"https://aqs.epa.gov/aqsweb/airdata/hourly_{param_code}_2023.zip"
    print(f"\nFetching {pollutant} (param {param_code})...")
    print(f"  URL: {url}")
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 HEROS-Project"}
        )
        with urllib.request.urlopen(req, timeout=600) as resp:
            raw = resp.read()
            print(f"  Downloaded {len(raw) / 1e6:.1f} MB")

        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            csv_name = zf.namelist()[0]
            with zf.open(csv_name) as f:
                epa_raw = pd.read_csv(
                    f,
                    dtype=str,
                    usecols=[
                        "State Code",
                        "County Code",
                        "Site Num",
                        "Date Local",
                        "Time Local",
                        "Sample Measurement",
                        "Units of Measure",
                    ],
                )

        mask_county = (epa_raw["State Code"] == TARGET_STATE) & (
            epa_raw["County Code"] == TARGET_COUNTY
        )
        county_data = epa_raw[mask_county]
        available_sites = sorted(county_data["Site Num"].unique().tolist())
        print(f"  Sites in Suffolk County: {available_sites}")

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

        site_data["datetime"] = pd.to_datetime(
            site_data["Date Local"] + " " + site_data["Time Local"]
        )
        study_mask = (site_data["datetime"] >= "2023-07-19") & (
            site_data["datetime"] <= "2023-08-24"
        )
        site_data = site_data[study_mask].copy()
        site_data["value"] = pd.to_numeric(
            site_data["Sample Measurement"], errors="coerce"
        )
        units = site_data["Units of Measure"].iloc[0] if len(site_data) > 0 else "?"

        print(f"  ✓ {pollutant}: {len(site_data)} hourly readings (site {used_site}, {units})")
        epa_frames[pollutant] = site_data[["datetime", "value"]].rename(
            columns={"value": f"epa_{pollutant}"}
        )

    except Exception as e:
        print(f"  ✗ Failed: {type(e).__name__}: {str(e)[:200]}")

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

    epa_merged.to_parquet("epa_hourly_boston.parquet")
    epa_merged.to_csv("epa_hourly_boston.csv")
    print(f"\n✓ Saved epa_hourly_boston.parquet and .csv")

    # Also try to append to the clean data
    clean_path = Path("data_HEROS_clean.parquet")
    if clean_path.exists():
        df = pd.read_parquet(clean_path)
        df["datetime_hour"] = pd.to_datetime(df["datetime"]).dt.floor("h")
        df = df.merge(
            epa_merged,
            left_on="datetime_hour",
            right_index=True,
            how="left",
        )
        df.drop(columns=["datetime_hour"], inplace=True)
        df.to_parquet("data_HEROS_clean.parquet", index=False)
        epa_cols = [c for c in df.columns if c.startswith("epa_")]
        print(f"\n✓ Merged EPA data into data_HEROS_clean.parquet")
        for col in epa_cols:
            filled = df[col].notna().sum()
            print(f"  {col}: {filled}/{len(df)} rows ({filled/len(df)*100:.1f}%)")
else:
    print("\n⚠ No EPA data was fetched.")

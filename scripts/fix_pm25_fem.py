#!/usr/bin/env python3
"""Fix PM2.5 FEM extraction — the zip has a nested directory structure."""
import zipfile, pandas as pd

with zipfile.ZipFile("epa_raw/hourly_88101_2023.zip") as zf:
    csv_name = [n for n in zf.namelist() if n.endswith(".csv")][0]
    print(f"Using: {csv_name}")
    with zf.open(csv_name) as f:
        epa = pd.read_csv(
            f, dtype=str,
            usecols=["State_Code", "County_Code", "Site_Num",
                     "Date_Local", "Time_Local", "Sample_Measurement",
                     "Units_of_Measure"],
        )

mask = (epa["State_Code"] == "25") & (epa["County_Code"] == "025")
county = epa[mask]
sites = sorted(county["Site_Num"].unique().tolist())
print(f"Suffolk County PM2.5 FEM sites: {sites}")

for site in ["0045", "0042", "0002"]:
    sub = county[county["Site_Num"] == site]
    if len(sub) == 0:
        continue
    sub = sub.copy()
    sub["datetime"] = pd.to_datetime(sub["Date_Local"] + " " + sub["Time_Local"])
    sub = sub[(sub["datetime"] >= "2023-07-19") & (sub["datetime"] <= "2023-08-24")]
    sub["value"] = pd.to_numeric(sub["Sample_Measurement"], errors="coerce")
    units = sub["Units_of_Measure"].iloc[0] if len(sub) > 0 else "?"
    print(f"  Site {site}: {len(sub)} readings ({units})")

    if len(sub) > 0:
        pm25 = sub[["datetime", "value"]].rename(columns={"value": "epa_pm25_fem"})
        pm25 = pm25.drop_duplicates(subset="datetime").set_index("datetime")

        # Add to EPA standalone file
        epa_existing = pd.read_parquet("epa_hourly_boston.parquet")
        if "epa_pm25_fem" in epa_existing.columns:
            epa_existing.drop(columns=["epa_pm25_fem"], inplace=True)
        epa_merged = epa_existing.join(pm25, how="outer")
        epa_merged.to_parquet("epa_hourly_boston.parquet")
        epa_merged.to_csv("epa_hourly_boston.csv")
        print(f"  Saved to epa_hourly_boston.parquet ({epa_merged.shape})")

        # Merge into clean HEROS data
        df = pd.read_parquet("data_HEROS_clean.parquet")
        if "epa_pm25_fem" in df.columns:
            df.drop(columns=["epa_pm25_fem"], inplace=True)
        df["datetime_hour"] = pd.to_datetime(df["datetime"]).dt.floor("h")
        df = df.merge(pm25, left_on="datetime_hour", right_index=True, how="left")
        df.drop(columns=["datetime_hour"], inplace=True)
        df.to_parquet("data_HEROS_clean.parquet", index=False)
        df.to_csv("data_HEROS_clean.csv", index=False)
        filled = df["epa_pm25_fem"].notna().sum()
        print(f"  Merged into HEROS: {filled}/{len(df)} rows ({filled/len(df)*100:.1f}%)")
        print(f"  Final dataset: {df.shape[0]:,} rows x {df.shape[1]} columns")
        break

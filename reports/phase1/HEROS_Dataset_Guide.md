# How to Get All the Data for the HEROS Project
**Chinatown HEROS — Heat & Environmental Research in Open Spaces**

> These are my notes on where every dataset in this project comes from and how to actually get your hands on them. Some files were handed to us directly by the research team, others we had to go find and download ourselves from the EPA website. I'll walk through each one.

---

## Part 1 — The Files You Already Have (Project Team Data)

These three files come straight from the HEROS research team. They should already be sitting in your `data/raw/` folder. If they're not there, ask the instructor — you're not going to find these on any website.

---

### `data_HEROS.xlsx` — The Main Dataset

This is the heart of everything. It has **48,123 rows of 10-minute interval readings** collected from July 19 to August 23, 2023, across 12 open-space sites in Boston's Chinatown neighborhood.

Inside this file you'll find four types of measurements all living together:

- **Purple Air sensors** — these are low-cost air quality sensors deployed at each of the 12 sites, measuring PM2.5 (fine particulate matter, in µg/m³). The column you'll mostly use is `pa_mean_pm2_5_atm_b_corr_2` — the "b_corr" part means it's been bias-corrected, which matters for accuracy.

- **Kestrel sensors** — handheld weather instruments also placed at each site, measuring temperature (°F), wet bulb globe temperature (WBGT, a heat stress index), humidity (%), dew point (°F), barometric pressure (inHg), and heat index (°F). These are the `kes_*` columns.

- **Weather station at 35 Kneeland St** — one central weather station on a rooftop nearby, measuring ambient temperature, humidity, dew point, wind speed (mph), wind direction (degrees), heat index, and THW index. These are the `mean_*` columns.

- **MassDEP FEM reference monitors** — "FEM" stands for Federal Equivalent Method, meaning these are regulatory-grade monitors the government uses for official air quality reporting. There are two: one in Chinatown itself (`dep_FEM_chinatown_pm2_5_ug_m3`) and one in Nubian Square/Roxbury (`dep_FEM_nubian_pm2_5_ug_m3`), plus temperature and humidity from Nubian Square. These are the "truth" we compare the Purple Air sensors against.

---

### `Codebook_HEROS.xlsx` — The Data Dictionary

Open this before you do anything else with the main dataset. It explains what every single column name means, what units it's in, and where the measurement came from. There are 21 variables documented here. Note: `dep_FEM_nubian_pm10_stp_ug_m3` is listed in the codebook but actually doesn't appear in the data — the PM10 readings weren't included. Don't go looking for it.

---

### `landuse_HEROS.xlsx` — Land Use Characteristics per Site

This one's a bit different — it's not time-series data. It has **24 rows** (12 sites × 2 buffer distances), describing the physical environment around each monitoring site. For each site, you get the percentage of the surrounding area that is:

- Roads
- Greenspace
- Tree cover
- Impervious surface (concrete, pavement, etc.)
- Industrial buildings

The two buffer distances are **25 meters** and **50 meters** from the site center. The idea is to see whether sites surrounded by more greenery or more pavement tend to have different temperature or air quality readings.

---

## Part 2 — The EPA Data (You Have to Go Get These)

This is where it gets a bit more involved. The HEROS dataset only captures what the sensors on the ground measured. To answer questions about other pollutants — ozone, sulfur dioxide, carbon monoxide, nitrogen dioxide — we need to pull data from the EPA's national monitoring network.

All of this lives on the **EPA Air Quality System (AQS)** public data portal.

---

### What the EPA AQS Is

The EPA maintains a network of official air quality monitors across the country. All their historical data is publicly downloadable. The bulk download page is here:

**→ [https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw](https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw)**

We care specifically about **hourly data for 2023**, and we're looking for monitors in **Boston, Suffolk County, Massachusetts** (State code `25`, County code `025`).

There are two monitoring sites in the area that matter to us:

| Site ID | Location | What it monitors |
|---------|----------|-----------------|
| **25-025-0042** | Harrison Ave / Von Hillern St | Ozone, SO₂, CO, NO₂ |
| **25-025-0045** | Chinatown (next to Reggie Wong Park) | PM2.5 FEM |

Site 0045 is literally in Chinatown — that's the one closest to our study area, so it's our preferred source for PM2.5. For the other pollutants, 0042 is the nearest monitor that has data.

---

### The Five Files to Download

Head to the bulk download page linked above. Scroll to the **"Hourly Data"** section. You'll see a table with links organized by parameter code and year. We need **2023** data for these five parameters:

---

#### 1. Ozone — Parameter Code `44201`

On the download page, find **"Ozone (44201)"** and click the **2023** link.

- **File:** `hourly_44201_2023.zip`
- **Size:** roughly 50–80 MB
- **After unzipping:** one large CSV with ozone readings from monitors across the entire US
- **What we use:** filter to State `25` (Massachusetts), County `025` (Suffolk), Site `0042`
- **Units:** ppm (parts per million)
- **What we got:** 844 hourly readings covering our study window (July 19 – August 23, 2023)

---

#### 2. Sulfur Dioxide (SO₂) — Parameter Code `42401`

Find **"SO2 (42401)"** → 2023.

- **File:** `hourly_42401_2023.zip`
- **Size:** roughly 30–50 MB
- **Monitor site:** 0042 (Harrison Ave)
- **Units:** ppb (parts per billion)
- **What we got:** 810 hourly readings (~93% coverage of our study period)

---

#### 3. Carbon Monoxide (CO) — Parameter Code `42101`

Find **"CO (42101)"** → 2023.

- **File:** `hourly_42101_2023.zip`
- **Size:** roughly 30–50 MB
- **Monitor site:** 0042 (Harrison Ave)
- **Units:** ppm
- **What we got:** 846 hourly readings (~97% coverage)

---

#### 4. Nitrogen Dioxide (NO₂) — Parameter Code `42602`

Find **"NO2 (42602)"** → 2023.

- **File:** `hourly_42602_2023.zip`
- **Size:** roughly 30–50 MB
- **Monitor site:** 0042 (Harrison Ave)
- **Units:** ppb
- **What we got:** 730 hourly readings — this one has the most gaps (~86% coverage), worth keeping in mind when doing any NO₂ analysis

---

#### 5. PM2.5 FEM — Parameter Code `88101`

Find **"PM2.5 FRM/FEM Mass (88101)"** → 2023.

- **File:** `hourly_88101_2023.zip`
- **Size:** this one is larger, can be 200–300 MB
- **Monitor site:** **0045** (Chinatown) — this is the one right in our neighborhood, not 0042
- **Units:** µg/m³
- **What we got:** 901 hourly readings (~98.5% coverage — best coverage of all five)

> **Heads up:** These zip files are big. The PM2.5 one especially. Make sure you have a stable internet connection and some disk space before downloading. Put all five zips into `data/epa/epa_raw/` once you have them.

---

## Part 3 — How It All Gets Joined Together

Once you have all five EPA zips and the three project Excel files, here's mentally how the merge works:

The HEROS sensor data records one reading every **10 minutes**. The EPA monitors record one reading per **hour**. So to join them, we round every HEROS timestamp down to the nearest hour and match it to the corresponding EPA hourly reading. That means every 6 HEROS rows (one hour's worth) end up with the same EPA value attached — which is fine, the EPA readings don't change within the hour anyway.

The land use data joins differently — it's not time-based at all. It joins on `site_id`, so every row from a given site gets that site's land use percentages appended as constant columns.

The final merged dataset ends up with **46 columns** and the same 48,123 rows as the original HEROS file.

---

## Quick Reference — Everything in One Place

| Dataset | Where to get it | File name |
|---------|----------------|-----------|
| Main HEROS sensor data | Project team (already in `data/raw/`) | `data_HEROS.xlsx` |
| Column codebook | Project team (already in `data/raw/`) | `Codebook_HEROS.xlsx` |
| Land use per site | Project team (already in `data/raw/`) | `landuse_HEROS.xlsx` |
| EPA Ozone 2023 | [EPA AQS bulk download](https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw) → Hourly → Ozone (44201) → 2023 | `hourly_44201_2023.zip` |
| EPA SO₂ 2023 | [EPA AQS bulk download](https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw) → Hourly → SO2 (42401) → 2023 | `hourly_42401_2023.zip` |
| EPA CO 2023 | [EPA AQS bulk download](https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw) → Hourly → CO (42101) → 2023 | `hourly_42101_2023.zip` |
| EPA NO₂ 2023 | [EPA AQS bulk download](https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw) → Hourly → NO2 (42602) → 2023 | `hourly_42602_2023.zip` |
| EPA PM2.5 FEM 2023 | [EPA AQS bulk download](https://aqs.epa.gov/aqsweb/airdata/download_files.html#Raw) → Hourly → PM2.5 FRM/FEM (88101) → 2023 | `hourly_88101_2023.zip` |

---

> **Where to put everything:**
> - Excel files → `data/raw/`
> - EPA zip files → `data/epa/epa_raw/`
> - After processing, clean outputs go into `data/clean/` and `data/epa/`

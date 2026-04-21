import pandas as pd

df = pd.read_parquet("/Users/joaoquintanilha/Downloads/project-hero/data/clean/data_HEROS_clean.parquet")

# Find the datetime column
datetime_cols = [c for c in df.columns if df[c].dtype == "datetime64[ns]" or "time" in c.lower() or "date" in c.lower() or "ts" == c.lower()]
print("Datetime-like columns:", datetime_cols)
print("All columns:", list(df.columns))

time_col = datetime_cols[0] if datetime_cols else df.select_dtypes(include="datetime").columns[0]

# Overall mean (all 10-min readings)
overall_mean = df["pa_mean_pm2_5_atm_b_corr_2"].mean()

# Average of daily means
df["date"] = pd.to_datetime(df[time_col]).dt.date
daily_means = df.groupby("date")["pa_mean_pm2_5_atm_b_corr_2"].mean()

avg_daily_mean = daily_means.mean()
min_daily = daily_means.min()
max_daily = daily_means.max()
std_daily = daily_means.std()

print(f"Overall mean (all 10-min readings): {overall_mean:.2f} µg/m³")
print(f"\nAverage of daily means:             {avg_daily_mean:.2f} µg/m³")
print(f"  Min daily mean:  {min_daily:.2f} µg/m³  ({daily_means.idxmin()})")
print(f"  Max daily mean:  {max_daily:.2f} µg/m³  ({daily_means.idxmax()})")
print(f"  Std of daily means: {std_daily:.2f} µg/m³")
print(f"  Number of days:  {len(daily_means)}")

print("\nDaily means (all days):")
print(daily_means.round(2).to_string())

# DEP FEM monitors
for col, label in [
    ("dep_FEM_chinatown_pm2_5_ug_m3", "DEP Chinatown FEM"),
    ("dep_FEM_nubian_pm2_5_ug_m3",   "DEP Nubian Sq FEM"),
]:
    dm = df.groupby("date")[col].mean()
    print(f"\n{label}:")
    print(f"  Average of daily means: {dm.mean():.2f} µg/m³")
    print(f"  Min daily mean:  {dm.min():.2f} µg/m³  ({dm.idxmin()})")
    print(f"  Max daily mean:  {dm.max():.2f} µg/m³  ({dm.idxmax()})")
    print(f"  Std of daily means: {dm.std():.2f} µg/m³")

"""
Phase 0 — Data Cleaning Script
================================
Applies all cleaning decisions documented in phase0_diagnostic/report.md.
Produces the cleaned dataset used in all subsequent phases.

Outputs:
  - dataset/student_wellness_clean.csv
  - phase0_diagnostic/figures/before_after_*.png  (before/after comparisons)
"""

import os
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE  = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab"
RAW   = os.path.join(BASE, "dataset", "student_wellness.csv")
CLEAN = os.path.join(BASE, "dataset", "student_wellness_clean.csv")
FIGS  = os.path.join(BASE, "phase0_diagnostic", "figures")

PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8"]
LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA", paper_bgcolor="#FFFFFF",
    margin=dict(t=80, b=60, l=60, r=40),
)

def save_fig(fig, name):
    fig.write_image(os.path.join(FIGS, name), width=1200, height=600, scale=2)
    print(f"  [saved] {name}")

# ── Load raw ───────────────────────────────────────────────────────────────────
df = pd.read_csv(RAW, dtype=str)
n_raw = len(df)
print(f"\nRaw shape: {df.shape}")

cleaning_log = []  # {step, column, action, rows_affected}

# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Drop duplicate rows
# ══════════════════════════════════════════════════════════════════════════════
before = len(df)
df = df.drop_duplicates()
dropped_dupes = before - len(df)
cleaning_log.append({"step": 1, "column": "ALL", "action": "Dropped duplicate rows",
                      "rows_affected": dropped_dupes})
print(f"\n[1] Dropped {dropped_dupes} duplicate rows → {len(df)} rows remain")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Convert numeric columns, null out impossible values
# ══════════════════════════════════════════════════════════════════════════════

# age: valid 16–35
df["age"] = pd.to_numeric(df["age"], errors="coerce")
invalid_age_mask = ~df["age"].between(16, 35)
n_invalid_age = invalid_age_mask.sum()
df.loc[invalid_age_mask, "age"] = np.nan
age_median = df["age"].median()
df["age"] = df["age"].fillna(age_median).round(0).astype(int)
cleaning_log.append({"step": 2, "column": "age",
                      "action": f"Nulled {n_invalid_age} impossible values; imputed with median ({age_median:.0f})",
                      "rows_affected": int(n_invalid_age)})
print(f"[2] age: nulled {n_invalid_age} impossible values, imputed median={age_median:.0f}")

# gpa: valid 0–4.0
df["gpa"] = pd.to_numeric(df["gpa"], errors="coerce")
over_gpa = df["gpa"] > 4.0
df.loc[over_gpa & (df["gpa"] <= 4.3), "gpa"] = 4.0      # slight rounding → cap
df.loc[over_gpa & (df["gpa"] > 4.3), "gpa"] = np.nan    # clearly wrong → NaN
df.loc[df["gpa"] < 0, "gpa"] = np.nan
n_invalid_gpa = df["gpa"].isna().sum()
gpa_median = df["gpa"].median()
df["gpa"] = df["gpa"].fillna(gpa_median).round(2)
cleaning_log.append({"step": 3, "column": "gpa",
                      "action": f"Capped GPA≤4.3→4.0, nulled clearly wrong, imputed median={gpa_median:.2f}",
                      "rows_affected": int(over_gpa.sum())})
print(f"[3] gpa: fixed out-of-range values, imputed median={gpa_median:.2f}")

# study_hours_per_day: valid 0–18
df["study_hours_per_day"] = pd.to_numeric(df["study_hours_per_day"], errors="coerce")
invalid_study = ~df["study_hours_per_day"].between(0, 18)
n_inv_study = invalid_study.sum()
df.loc[invalid_study, "study_hours_per_day"] = np.nan
study_median = df["study_hours_per_day"].median()
df["study_hours_per_day"] = df["study_hours_per_day"].fillna(study_median).round(1)
cleaning_log.append({"step": 4, "column": "study_hours_per_day",
                      "action": f"Nulled {n_inv_study} impossible values; imputed median ({study_median:.1f})",
                      "rows_affected": int(n_inv_study)})
print(f"[4] study_hours_per_day: nulled {n_inv_study}, imputed median={study_median:.1f}")

# sleep_hours_per_night: valid 2–16
df["sleep_hours_per_night"] = pd.to_numeric(df["sleep_hours_per_night"], errors="coerce")
invalid_sleep = ~df["sleep_hours_per_night"].between(2, 16)
n_inv_sleep = invalid_sleep.sum()
df.loc[invalid_sleep, "sleep_hours_per_night"] = np.nan
sleep_median = df["sleep_hours_per_night"].median()
df["sleep_hours_per_night"] = df["sleep_hours_per_night"].fillna(sleep_median).round(1)
cleaning_log.append({"step": 5, "column": "sleep_hours_per_night",
                      "action": f"Nulled {n_inv_sleep} impossible values; imputed median ({sleep_median:.1f})",
                      "rows_affected": int(n_inv_sleep)})
print(f"[5] sleep_hours_per_night: nulled {n_inv_sleep}, imputed median={sleep_median:.1f}")

# attendance_rate: cap at 100
df["attendance_rate"] = pd.to_numeric(df["attendance_rate"], errors="coerce")
over_att = df["attendance_rate"] > 100
n_over_att = over_att.sum()
df.loc[over_att, "attendance_rate"] = 100.0
cleaning_log.append({"step": 6, "column": "attendance_rate",
                      "action": f"Capped {n_over_att} values >100% to 100%",
                      "rows_affected": int(n_over_att)})
print(f"[6] attendance_rate: capped {n_over_att} values >100%")

# screen_time_hours, social_media_hours, life_satisfaction — convert + impute
for col in ["screen_time_hours", "social_media_hours", "life_satisfaction"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")
    n_null = df[col].isna().sum()
    if n_null > 0:
        df[col] = df[col].fillna(df[col].median())

# caffeine, exercise, monthly_spending, anxiety, depression, num_clubs — convert + impute
for col in ["caffeine_mg_per_day", "exercise_days_per_week", "monthly_spending",
            "anxiety_score", "depression_score", "num_clubs"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")
    med = df[col].median()
    n_null = df[col].isna().sum()
    df[col] = df[col].fillna(med).round(1)
    if n_null > 0:
        cleaning_log.append({"step": 7, "column": col,
                              "action": f"Imputed {n_null} missing values with median ({med:.1f})",
                              "rows_affected": int(n_null)})
        print(f"[7] {col}: imputed {n_null} missing with median={med:.1f}")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 — Standardize gender encoding
# ══════════════════════════════════════════════════════════════════════════════
gender_map = {
    "M": "Male", "male": "Male", "MALE": "Male", "man": "Male",
    "F": "Female", "female": "Female", "FEMALE": "Female", "woman": "Female",
}
n_gender_fix = df["gender"].isin(gender_map.keys()).sum()
df["gender"] = df["gender"].replace(gender_map)
cleaning_log.append({"step": 8, "column": "gender",
                      "action": f"Standardized {n_gender_fix} inconsistent encodings",
                      "rows_affected": int(n_gender_fix)})
print(f"\n[8] gender: standardized {n_gender_fix} entries")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Fix stress_level mixed types
# ══════════════════════════════════════════════════════════════════════════════
stress_text_map = {"low": 2.5, "medium": 5.0, "high": 7.5, "very high": 9.5}
is_text_stress = df["stress_level"].isin(stress_text_map.keys())
n_text_stress = is_text_stress.sum()
df["stress_level"] = df["stress_level"].replace(stress_text_map)
df["stress_level"] = pd.to_numeric(df["stress_level"], errors="coerce")
stress_median = df["stress_level"].median()
df["stress_level"] = df["stress_level"].fillna(stress_median).round(1)
cleaning_log.append({"step": 9, "column": "stress_level",
                      "action": f"Mapped {n_text_stress} text labels to numeric (low→2.5, medium→5, high→7.5, very high→9.5)",
                      "rows_affected": int(n_text_stress)})
print(f"[9] stress_level: converted {n_text_stress} text labels to numeric")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Fix on_campus mixed booleans
# ══════════════════════════════════════════════════════════════════════════════
true_vals  = {"True", "true", "1", "yes", "YES"}
false_vals = {"False", "false", "0", "no", "NO"}
n_oc_before = (~df["on_campus"].isin(["True", "False"])).sum()
df["on_campus"] = df["on_campus"].apply(
    lambda x: True if x in true_vals else (False if x in false_vals else np.nan)
)
df["on_campus"] = df["on_campus"].fillna(True)  # impute with mode
cleaning_log.append({"step": 10, "column": "on_campus",
                      "action": f"Standardized {n_oc_before} mixed boolean values",
                      "rows_affected": int(n_oc_before)})
print(f"[10] on_campus: standardized {n_oc_before} mixed boolean values")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6 — has_part_time_job — impute missing with mode
# ══════════════════════════════════════════════════════════════════════════════
n_ptj_missing = df["has_part_time_job"].isna().sum()
if n_ptj_missing == 0:
    n_ptj_missing = (df["has_part_time_job"] == "nan").sum()
df["has_part_time_job"] = df["has_part_time_job"].replace("nan", np.nan)
mode_ptj = df["has_part_time_job"].mode()[0]
df["has_part_time_job"] = df["has_part_time_job"].fillna(mode_ptj)
print(f"[11] has_part_time_job: imputed {n_ptj_missing} missing with mode='{mode_ptj}'")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 7 — year_in_school — convert to int
# ══════════════════════════════════════════════════════════════════════════════
df["year_in_school"] = pd.to_numeric(df["year_in_school"], errors="coerce")
df["year_in_school"] = df["year_in_school"].fillna(df["year_in_school"].median()).round(0).astype(int)

# ══════════════════════════════════════════════════════════════════════════════
# BEFORE/AFTER COMPARISON CHARTS
# ══════════════════════════════════════════════════════════════════════════════
df_raw = pd.read_csv(RAW, dtype=str)

# GPA before / after
gpa_before = pd.to_numeric(df_raw["gpa"], errors="coerce").dropna()
gpa_after  = df["gpa"]
fig = make_subplots(rows=1, cols=2, subplot_titles=["GPA — Before Cleaning", "GPA — After Cleaning"])
fig.add_trace(go.Histogram(x=gpa_before, nbinsx=30, marker_color="#F4A8B0", name="Before"), row=1, col=1)
fig.add_trace(go.Histogram(x=gpa_after,  nbinsx=30, marker_color="#A8C8E8", name="After"),  row=1, col=2)
fig.update_layout(**LAYOUT, title="GPA Distribution: Before vs After Cleaning", showlegend=False)
save_fig(fig, "11_gpa_before_after.png")

# Sleep before / after
sleep_before = pd.to_numeric(df_raw["sleep_hours_per_night"], errors="coerce").dropna()
sleep_after  = df["sleep_hours_per_night"]
fig = make_subplots(rows=1, cols=2, subplot_titles=["Sleep — Before Cleaning", "Sleep — After Cleaning"])
fig.add_trace(go.Histogram(x=sleep_before, nbinsx=25, marker_color="#F4A8B0", name="Before"), row=1, col=1)
fig.add_trace(go.Histogram(x=sleep_after,  nbinsx=25, marker_color="#A8C8E8", name="After"),  row=1, col=2)
fig.update_layout(**LAYOUT, title="Sleep Hours: Before vs After Cleaning", showlegend=False)
save_fig(fig, "12_sleep_before_after.png")

# Gender encoding before / after
gender_before = df_raw["gender"].value_counts()
gender_after  = df["gender"].value_counts()
fig = make_subplots(rows=1, cols=2, subplot_titles=["Gender — Before (12 variants)", "Gender — After (4 canonical)"])
fig.add_trace(go.Bar(x=gender_before.index, y=gender_before.values, marker_color="#F4A8B0"), row=1, col=1)
fig.add_trace(go.Bar(x=gender_after.index,  y=gender_after.values,  marker_color="#A8C8E8"), row=1, col=2)
fig.update_layout(**LAYOUT, title="Gender Encoding: Before vs After Cleaning", showlegend=False)
save_fig(fig, "13_gender_before_after.png")

# ══════════════════════════════════════════════════════════════════════════════
# SAVE CLEAN DATASET
# ══════════════════════════════════════════════════════════════════════════════
df.to_csv(CLEAN, index=False)

# Cleaning log
log_df = pd.DataFrame(cleaning_log)
log_df.to_csv(os.path.join(BASE, "phase0_diagnostic", "cleaning_log.csv"), index=False)

print(f"\n{'='*60}")
print("CLEANING COMPLETE")
print(f"{'='*60}")
print(f"Raw rows:     {n_raw}")
print(f"Clean rows:   {len(df)}")
print(f"Rows removed: {n_raw - len(df)} (duplicates)")
print(f"\nClean dataset: {CLEAN}")
print(f"Cleaning log:  {os.path.join(BASE, 'phase0_diagnostic', 'cleaning_log.csv')}")
print(f"\nFinal dtypes:")
print(df.dtypes.to_string())

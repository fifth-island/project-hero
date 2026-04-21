"""
EDA Lab Dataset Generator
--------------------------
Generates a synthetic student wellness & academic performance dataset
with intentional data quality issues for teaching purposes.

Issues injected:
  - Duplicate rows (~3%)
  - Impossible / out-of-range values (age=200, gpa=5.2, sleep=-1, study=30)
  - Inconsistent categorical encoding (gender: "Male"/"M"/"male"/"MALE")
  - Mixed types in a numeric column (stress_level: "high"/"low" mixed with 1-10)
  - Missing values strategically placed (~12-18% per affected column)
  - Attendance_rate values > 100%
  - on_campus column with True/False/1/0 mixed strings
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)

N = 520  # will trim duplicates to keep ~500 clean rows conceptually

# ── core demographics ──────────────────────────────────────────────────────────
student_ids = [f"STU{str(i).zfill(4)}" for i in range(1, N + 1)]

age_clean = RNG.integers(18, 26, size=N).astype(float)

genders_clean = RNG.choice(["Male", "Female", "Non-binary", "Prefer not to say"],
                            p=[0.45, 0.45, 0.06, 0.04], size=N)

majors = RNG.choice(
    ["Computer Science", "Psychology", "Business", "Biology",
     "Political Science", "Art & Design", "Nursing", "Economics",
     "Mechanical Engineering", "Communications"],
    p=[0.15, 0.12, 0.14, 0.11, 0.09, 0.07, 0.10, 0.08, 0.07, 0.07],
    size=N
)

year_clean = RNG.choice([1, 2, 3, 4], p=[0.28, 0.27, 0.25, 0.20], size=N).astype(float)

# ── academic variables ─────────────────────────────────────────────────────────
# GPA correlated with study hours (added later) + noise
gpa_base = RNG.normal(3.1, 0.5, size=N).clip(1.5, 4.0)

study_hours_clean = (gpa_base - 1.5) * 1.8 + RNG.normal(4, 1.5, size=N)
study_hours_clean = study_hours_clean.clip(0, 16)

attendance_clean = RNG.normal(82, 12, size=N).clip(50, 100)

# ── lifestyle variables ────────────────────────────────────────────────────────
sleep_clean = RNG.normal(6.8, 1.2, size=N).clip(3, 11)

exercise_days = RNG.integers(0, 8, size=N).astype(float)

screen_time = RNG.normal(7.5, 2.0, size=N).clip(1, 16)

social_media_hours = (screen_time * 0.35 + RNG.normal(0, 1.0, size=N)).clip(0, 10)

caffeine_mg = RNG.normal(180, 90, size=N).clip(0, 700)

# ── wellness variables ─────────────────────────────────────────────────────────
# stress: higher for STEM + low sleep + high screen time
stress_base = (
    (majors == "Computer Science").astype(float) * 1.2 +
    (majors == "Nursing").astype(float) * 1.5 +
    (majors == "Mechanical Engineering").astype(float) * 1.0 -
    (sleep_clean - 6.8) * 0.6 +
    (screen_time - 7.5) * 0.3 +
    RNG.normal(5, 1.5, size=N)
)
stress_clean = stress_base.clip(1, 10).round(1)

# GAD-7 anxiety (0–21)
anxiety_clean = (stress_clean * 1.1 + RNG.normal(0, 2, size=N)).clip(0, 21).round(0)

# PHQ-9 depression (0–27)
depression_clean = (stress_clean * 0.9 + RNG.normal(0, 3, size=N)).clip(0, 27).round(0)

life_satisfaction = (11 - stress_clean + RNG.normal(0, 1.5, size=N)).clip(1, 10).round(1)

# ── social / financial ─────────────────────────────────────────────────────────
num_clubs = RNG.integers(0, 7, size=N).astype(float)

on_campus_clean = RNG.choice([True, False], p=[0.55, 0.45], size=N)

has_part_time_job = RNG.choice(["Yes", "No"], p=[0.42, 0.58], size=N)

monthly_spending = RNG.normal(850, 250, size=N).clip(200, 2000).round(2)

# ── build clean dataframe ──────────────────────────────────────────────────────
df = pd.DataFrame({
    "student_id": student_ids,
    "age": age_clean,
    "gender": genders_clean,
    "major": majors,
    "year_in_school": year_clean,
    "gpa": gpa_base.round(2),
    "study_hours_per_day": study_hours_clean.round(1),
    "attendance_rate": attendance_clean.round(1),
    "sleep_hours_per_night": sleep_clean.round(1),
    "exercise_days_per_week": exercise_days,
    "screen_time_hours": screen_time.round(1),
    "social_media_hours": social_media_hours.round(1),
    "caffeine_mg_per_day": caffeine_mg.round(0),
    "stress_level": stress_clean,
    "anxiety_score": anxiety_clean,
    "depression_score": depression_clean,
    "life_satisfaction": life_satisfaction,
    "num_clubs": num_clubs,
    "on_campus": on_campus_clean,
    "has_part_time_job": has_part_time_job,
    "monthly_spending": monthly_spending,
})

# ══════════════════════════════════════════════════════════════════════════════
# INJECT DATA QUALITY ISSUES
# ══════════════════════════════════════════════════════════════════════════════

# 1) Duplicate rows — inject ~15 exact duplicates
dup_idx = RNG.choice(N, size=15, replace=False)
duplicates = df.iloc[dup_idx].copy()
df = pd.concat([df, duplicates], ignore_index=True)

# 2) Impossible values — age
bad_age_idx = RNG.choice(len(df), size=6, replace=False)
bad_ages = [200, 5, 0, 999, -3, 150]
for i, idx in enumerate(bad_age_idx):
    df.at[idx, "age"] = bad_ages[i]

# 3) GPA out of range (> 4.0 or negative)
bad_gpa_idx = RNG.choice(len(df), size=8, replace=False)
bad_gpas = [5.2, 4.8, -0.5, 6.0, 4.99, -1.0, 5.5, 4.75]
for i, idx in enumerate(bad_gpa_idx):
    df.at[idx, "gpa"] = bad_gpas[i]

# 4) Study hours impossible values
bad_study_idx = RNG.choice(len(df), size=5, replace=False)
bad_study = [30, 25, -2, 28, 35]
for i, idx in enumerate(bad_study_idx):
    df.at[idx, "study_hours_per_day"] = bad_study[i]

# 5) Sleep hours: impossible negatives and extreme
bad_sleep_idx = RNG.choice(len(df), size=5, replace=False)
bad_sleep = [-1, -3, 24, 0.1, 22]
for i, idx in enumerate(bad_sleep_idx):
    df.at[idx, "sleep_hours_per_night"] = bad_sleep[i]

# 6) Attendance > 100%
bad_att_idx = RNG.choice(len(df), size=10, replace=False)
for idx in bad_att_idx:
    df.at[idx, "attendance_rate"] = RNG.integers(101, 130)

# 7) Inconsistent gender encoding
# Replace some "Male" with "M", "male", "MALE"; some "Female" with "F", "female"
male_rows = df[df["gender"] == "Male"].index.tolist()
female_rows = df[df["gender"] == "Female"].index.tolist()

replacements_m = RNG.choice(male_rows, size=min(40, len(male_rows)), replace=False)
variants_m = RNG.choice(["M", "male", "MALE", "man"], size=len(replacements_m))
for idx, var in zip(replacements_m, variants_m):
    df.at[idx, "gender"] = var

replacements_f = RNG.choice(female_rows, size=min(35, len(female_rows)), replace=False)
variants_f = RNG.choice(["F", "female", "FEMALE", "woman"], size=len(replacements_f))
for idx, var in zip(replacements_f, variants_f):
    df.at[idx, "gender"] = var

# 8) Mixed types in stress_level: replace some numeric with text labels
df["stress_level"] = df["stress_level"].astype(object)
stress_text_idx = RNG.choice(len(df), size=20, replace=False)
stress_labels = RNG.choice(["low", "medium", "high", "very high"], size=20)
for idx, label in zip(stress_text_idx, stress_labels):
    df.at[idx, "stress_level"] = label

# 9) on_campus: mix True/False with "1"/"0"/"yes"/"no"
df["on_campus"] = df["on_campus"].astype(object)
on_campus_idx = RNG.choice(len(df), size=60, replace=False)
on_campus_variants_true = ["1", "yes", "YES", "true"]
on_campus_variants_false = ["0", "no", "NO", "false"]
for idx in on_campus_idx:
    if df.at[idx, "on_campus"] == True:
        df.at[idx, "on_campus"] = RNG.choice(on_campus_variants_true)
    else:
        df.at[idx, "on_campus"] = RNG.choice(on_campus_variants_false)

# 10) Missing values — strategic placement
def inject_missing(series, frac, rng):
    idx = rng.choice(len(series), size=int(len(series) * frac), replace=False)
    series = series.copy().astype(object)
    series.iloc[idx] = np.nan
    return series

df["gpa"] = inject_missing(df["gpa"], 0.08, RNG)
df["sleep_hours_per_night"] = inject_missing(df["sleep_hours_per_night"], 0.10, RNG)
df["anxiety_score"] = inject_missing(df["anxiety_score"], 0.13, RNG)
df["depression_score"] = inject_missing(df["depression_score"], 0.13, RNG)
df["exercise_days_per_week"] = inject_missing(df["exercise_days_per_week"], 0.06, RNG)
df["monthly_spending"] = inject_missing(df["monthly_spending"], 0.09, RNG)
df["caffeine_mg_per_day"] = inject_missing(df["caffeine_mg_per_day"], 0.07, RNG)
df["has_part_time_job"] = inject_missing(df["has_part_time_job"], 0.05, RNG)
df["num_clubs"] = inject_missing(df["num_clubs"], 0.04, RNG)

# 11) Shuffle rows
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# ── save ───────────────────────────────────────────────────────────────────────
out_path = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab/dataset/student_wellness.csv"
df.to_csv(out_path, index=False)
print(f"Dataset saved: {out_path}")
print(f"Shape: {df.shape}")
print(f"\nMissing values per column:")
print(df.isnull().sum()[df.isnull().sum() > 0])
print(f"\nSample dtypes:\n{df.dtypes}")

"""
Phase 0 — Data Diagnostic Script
===================================
Produces a full quality audit of the raw student_wellness.csv dataset.

Outputs:
  - phase0_diagnostic/figures/  : one chart per column with quality issues
  - phase0_diagnostic/quality_summary.csv : issue log
  - Prints a full per-column quality report to stdout
"""

import sys
import os
import warnings
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE   = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab"
RAW    = os.path.join(BASE, "dataset", "student_wellness.csv")
FIGS   = os.path.join(BASE, "phase0_diagnostic", "figures")
os.makedirs(FIGS, exist_ok=True)

# ── Palette ───────────────────────────────────────────────────────────────────
PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8"]
WARN   = "#F4A8B0"   # rose for bad values
OK     = "#A8C8E8"   # blue for good values

LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA",
    paper_bgcolor="#FFFFFF",
    margin=dict(t=80, b=60, l=60, r=40),
)

def save_fig(fig, name):
    path = os.path.join(FIGS, name)
    fig.write_image(path, width=1200, height=600, scale=2)
    print(f"  [saved] {name}")

# ── Load raw data ──────────────────────────────────────────────────────────────
df = pd.read_csv(RAW, dtype=str)  # load everything as string first
print(f"\n{'='*60}")
print(f"RAW DATASET — {RAW}")
print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"{'='*60}\n")

issues = []  # will collect: {column, issue_type, affected_rows, recommendation}

# ══════════════════════════════════════════════════════════════════════════════
# 1. DUPLICATE ROWS
# ══════════════════════════════════════════════════════════════════════════════
dupes = df.duplicated()
n_dupes = dupes.sum()
print(f"[DUPLICATES] {n_dupes} duplicate rows found")
if n_dupes > 0:
    issues.append({"column": "ALL", "issue_type": "Duplicate rows",
                   "affected_rows": int(n_dupes),
                   "recommendation": "Drop duplicates using df.drop_duplicates()"})

# ── Duplicate bar chart ────────────────────────────────────────────────────────
fig = go.Figure(go.Bar(
    x=["Unique rows", "Duplicate rows"],
    y=[len(df) - n_dupes, n_dupes],
    marker_color=[OK, WARN],
    text=[len(df) - n_dupes, n_dupes],
    textposition="auto",
))
fig.update_layout(**LAYOUT,
    title="Duplicate Row Check",
    yaxis_title="Count",
)
save_fig(fig, "00_duplicates.png")

# ══════════════════════════════════════════════════════════════════════════════
# 2. MISSING VALUES
# ══════════════════════════════════════════════════════════════════════════════
missing = df.replace("", np.nan).isnull().sum()
missing_pct = (missing / len(df) * 100).round(1)
missing_df = pd.DataFrame({"missing_count": missing, "missing_pct": missing_pct})
missing_df = missing_df[missing_df["missing_count"] > 0].sort_values("missing_pct", ascending=False)

print(f"\n[MISSING VALUES] Columns with missing data:")
print(missing_df.to_string())

for col in missing_df.index:
    issues.append({"column": col, "issue_type": "Missing values",
                   "affected_rows": int(missing_df.loc[col, "missing_count"]),
                   "recommendation": f"Impute with median (numeric) or mode (categorical), or flag as unknown"})

# ── Missing values bar chart ───────────────────────────────────────────────────
if not missing_df.empty:
    fig = px.bar(missing_df.reset_index(), x="index", y="missing_pct",
                 color="missing_pct", color_continuous_scale=["#A8C8E8", "#F4A8B0"],
                 text="missing_pct", labels={"index": "Column", "missing_pct": "% Missing"})
    fig.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
    fig.update_layout(**LAYOUT, title="Missing Values by Column (%)",
                      coloraxis_showscale=False)
    save_fig(fig, "01_missing_values.png")

# ══════════════════════════════════════════════════════════════════════════════
# 3. COLUMN-BY-COLUMN QUALITY CHECKS
# ══════════════════════════════════════════════════════════════════════════════

# ── age ────────────────────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[age]")
age_num = pd.to_numeric(df["age"], errors="coerce")
invalid_age = age_num[(age_num < 16) | (age_num > 35)].dropna()
print(f"  Valid range: 16–35 | Invalid values: {len(invalid_age)}")
print(f"  Min: {age_num.min()}, Max: {age_num.max()}, Unique invalid: {sorted(invalid_age.unique())}")
if len(invalid_age):
    issues.append({"column": "age", "issue_type": "Impossible values (out of range)",
                   "affected_rows": len(invalid_age),
                   "recommendation": "Set to NaN and impute with median age (≈21)"})

fig = go.Figure()
fig.add_trace(go.Histogram(x=age_num[age_num.between(16, 35)], name="Valid", marker_color=OK,
                           nbinsx=20, opacity=0.8))
fig.add_trace(go.Histogram(x=age_num[~age_num.between(16, 35)], name="Invalid (<16 or >35)",
                           marker_color=WARN, nbinsx=20, opacity=0.9))
fig.update_layout(**LAYOUT, title="Age Distribution — Valid vs Invalid Values",
                  xaxis_title="Age", yaxis_title="Count", barmode="overlay",
                  legend=dict(x=0.75, y=0.9))
save_fig(fig, "02_age_check.png")

# ── gpa ────────────────────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[gpa]")
gpa_num = pd.to_numeric(df["gpa"], errors="coerce")
invalid_gpa = gpa_num[(gpa_num < 0) | (gpa_num > 4.0)].dropna()
missing_gpa = gpa_num.isna().sum()
print(f"  Valid range: 0–4.0 | Out-of-range: {len(invalid_gpa)} | Missing: {missing_gpa}")
print(f"  Out-of-range values: {sorted(invalid_gpa.round(2).unique())}")
if len(invalid_gpa):
    issues.append({"column": "gpa", "issue_type": "Out-of-range values (GPA > 4.0 or < 0)",
                   "affected_rows": len(invalid_gpa),
                   "recommendation": "Cap at 4.0 for values slightly above; set to NaN for clearly wrong values (GPA > 4.5)"})

valid_gpa = gpa_num[gpa_num.between(0, 4.0)]
fig = make_subplots(rows=1, cols=2, subplot_titles=["GPA Distribution (valid only)", "GPA Range Check"])
fig.add_trace(go.Histogram(x=valid_gpa, marker_color=OK, nbinsx=25, name="Valid GPA"), row=1, col=1)
fig.add_trace(go.Box(y=gpa_num, marker_color=WARN, name="All GPA (incl. outliers)",
                     boxpoints="outliers", jitter=0.3), row=1, col=2)
fig.update_layout(**LAYOUT, title="GPA — Distribution & Outlier Check", showlegend=False)
save_fig(fig, "03_gpa_check.png")

# ── study_hours_per_day ────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[study_hours_per_day]")
study_num = pd.to_numeric(df["study_hours_per_day"], errors="coerce")
invalid_study = study_num[(study_num < 0) | (study_num > 18)].dropna()
print(f"  Valid range: 0–18 | Invalid: {len(invalid_study)}")
print(f"  Values: {sorted(invalid_study.round(1).unique())}")
if len(invalid_study):
    issues.append({"column": "study_hours_per_day", "issue_type": "Impossible values (>18 or <0)",
                   "affected_rows": len(invalid_study),
                   "recommendation": "Set to NaN — 30hrs/day is physically impossible"})

fig = go.Figure()
fig.add_trace(go.Box(y=study_num, marker_color=PASTEL[0],
                     boxpoints="outliers", jitter=0.3, name="Study Hours"))
fig.add_hline(y=18, line_dash="dash", line_color=WARN,
              annotation_text="Max reasonable (18hrs)", annotation_position="right")
fig.add_hline(y=0, line_dash="dash", line_color=WARN,
              annotation_text="Min (0hrs)", annotation_position="right")
fig.update_layout(**LAYOUT, title="Study Hours per Day — Box Plot with Outlier Threshold",
                  yaxis_title="Hours")
save_fig(fig, "04_study_hours_check.png")

# ── sleep_hours_per_night ──────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[sleep_hours_per_night]")
sleep_num = pd.to_numeric(df["sleep_hours_per_night"], errors="coerce")
invalid_sleep = sleep_num[(sleep_num < 0) | (sleep_num > 16)].dropna()
print(f"  Valid range: 0–16 | Invalid: {len(invalid_sleep)}")
print(f"  Values: {sorted(invalid_sleep.round(1).unique())}")
if len(invalid_sleep):
    issues.append({"column": "sleep_hours_per_night", "issue_type": "Impossible values (negative or >16)",
                   "affected_rows": len(invalid_sleep),
                   "recommendation": "Set to NaN — negative sleep is impossible; >16 hrs is implausible for a student"})

fig = go.Figure()
fig.add_trace(go.Box(y=sleep_num, marker_color=PASTEL[2], boxpoints="outliers", jitter=0.3))
fig.add_hline(y=0, line_dash="dash", line_color=WARN, annotation_text="Floor (0)")
fig.add_hline(y=16, line_dash="dash", line_color=WARN, annotation_text="Ceiling (16hrs)")
fig.update_layout(**LAYOUT, title="Sleep Hours per Night — Box Plot with Range Check",
                  yaxis_title="Hours")
save_fig(fig, "05_sleep_hours_check.png")

# ── attendance_rate ────────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[attendance_rate]")
att_num = pd.to_numeric(df["attendance_rate"], errors="coerce")
invalid_att = att_num[att_num > 100].dropna()
print(f"  Valid range: 0–100 | Values > 100: {len(invalid_att)}")
print(f"  Example > 100 values: {sorted(invalid_att.unique())[:8]}")
if len(invalid_att):
    issues.append({"column": "attendance_rate", "issue_type": "Values > 100% (impossible percentage)",
                   "affected_rows": len(invalid_att),
                   "recommendation": "Cap at 100% — a percentage cannot exceed 100"})

fig = go.Figure()
fig.add_trace(go.Histogram(x=att_num[att_num <= 100], name="Valid (≤100%)", marker_color=OK, opacity=0.8))
fig.add_trace(go.Histogram(x=att_num[att_num > 100], name="Invalid (>100%)", marker_color=WARN, opacity=0.9))
fig.add_vline(x=100, line_dash="dash", line_color="#888",
              annotation_text="100% ceiling", annotation_position="top left")
fig.update_layout(**LAYOUT, title="Attendance Rate — Valid vs. Invalid Values",
                  xaxis_title="Attendance (%)", yaxis_title="Count", barmode="overlay")
save_fig(fig, "06_attendance_check.png")

# ── gender ─────────────────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[gender]")
gender_counts = df["gender"].value_counts()
print(f"  Unique values ({len(gender_counts)}):")
print(gender_counts.to_string())
inconsistent_gender = df["gender"].isin(["M", "male", "MALE", "man", "F", "female", "FEMALE", "woman"])
n_inconsistent = inconsistent_gender.sum()
print(f"  Inconsistent encodings: {n_inconsistent} rows")
if n_inconsistent:
    issues.append({"column": "gender", "issue_type": "Inconsistent categorical encoding",
                   "affected_rows": int(n_inconsistent),
                   "recommendation": "Standardize: map M/male/MALE→Male, F/female/FEMALE→Female"})

fig = px.bar(gender_counts.reset_index(), x="gender", y="count",
             color="gender", color_discrete_sequence=PASTEL,
             text="count", labels={"gender": "Gender Value", "count": "Count"})
fig.update_traces(textposition="outside")
fig.update_layout(**LAYOUT, title="Gender Column — All Unique Values (showing encoding inconsistencies)",
                  showlegend=False)
save_fig(fig, "07_gender_encoding.png")

# ── stress_level ───────────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[stress_level]")
stress_text = df["stress_level"][pd.to_numeric(df["stress_level"], errors="coerce").isna()]
n_text_stress = len(stress_text)
stress_text_vals = stress_text.value_counts()
print(f"  Non-numeric stress_level entries: {n_text_stress}")
print(stress_text_vals.to_string())
if n_text_stress:
    issues.append({"column": "stress_level", "issue_type": "Mixed types (numeric 1–10 + text labels)",
                   "affected_rows": int(n_text_stress),
                   "recommendation": "Map text labels to numeric: low→2.5, medium→5, high→7.5, very high→9.5; then convert to float"})

type_counts = pd.Series({"Numeric (1–10)": len(df) - n_text_stress, "Text label": n_text_stress})
fig = px.pie(values=type_counts.values, names=type_counts.index,
             color_discrete_sequence=[OK, WARN])
fig.update_layout(**LAYOUT, title="stress_level — Numeric vs. Text Label Breakdown")
save_fig(fig, "08_stress_type_mix.png")

# ── on_campus ──────────────────────────────────────────────────────────────────
print(f"\n{'─'*40}\n[on_campus]")
on_campus_vals = df["on_campus"].value_counts()
print(f"  Unique values ({len(on_campus_vals)}): {list(on_campus_vals.index)}")
inconsistent_oc = df["on_campus"].isin(["1", "0", "yes", "no", "YES", "NO", "true", "false"])
n_incon_oc = inconsistent_oc.sum()
print(f"  Non-boolean encodings: {n_incon_oc} rows")
if n_incon_oc:
    issues.append({"column": "on_campus", "issue_type": "Mixed boolean representations (True/False/1/0/yes/no)",
                   "affected_rows": int(n_incon_oc),
                   "recommendation": "Map all truthy variants → True, falsy variants → False; store as boolean"})

fig = px.bar(on_campus_vals.reset_index(), x="on_campus", y="count",
             color="on_campus", color_discrete_sequence=PASTEL,
             text="count", labels={"on_campus": "on_campus value", "count": "Count"})
fig.update_traces(textposition="outside")
fig.update_layout(**LAYOUT, title="on_campus — All Unique Values (showing boolean inconsistencies)",
                  showlegend=False)
save_fig(fig, "09_on_campus_encoding.png")

# ── anxiety_score & depression_score ──────────────────────────────────────────
for col, max_val, scale_name in [("anxiety_score", 21, "GAD-7"), ("depression_score", 27, "PHQ-9")]:
    print(f"\n{'─'*40}\n[{col}]")
    num = pd.to_numeric(df[col], errors="coerce")
    missing_n = num.isna().sum()
    invalid_n = num[(num < 0) | (num > max_val)].dropna()
    print(f"  {scale_name} scale (0–{max_val}) | Missing: {missing_n} | Out-of-range: {len(invalid_n)}")

# ── Summary chart: missing % heatmap per column ────────────────────────────────
all_missing_pct = {}
for col in df.columns:
    num_missing = df[col].replace("", np.nan).isnull().sum()
    all_missing_pct[col] = round(num_missing / len(df) * 100, 1)

missing_series = pd.Series(all_missing_pct)
fig = px.bar(x=missing_series.index, y=missing_series.values,
             color=missing_series.values,
             color_continuous_scale=["#A8E8C8", "#A8C8E8", "#F4D8A8", "#F4A8B0"],
             labels={"x": "Column", "y": "% Missing"},
             text=[f"{v}%" for v in missing_series.values])
fig.update_traces(textposition="outside")
fig.update_layout(**LAYOUT, title="Missing Values (%) — All Columns Overview",
                  coloraxis_showscale=False, xaxis_tickangle=-35)
save_fig(fig, "10_missing_all_columns.png")

# ══════════════════════════════════════════════════════════════════════════════
# 4. QUALITY SUMMARY CSV
# ══════════════════════════════════════════════════════════════════════════════
issues_df = pd.DataFrame(issues)
summary_path = os.path.join(BASE, "phase0_diagnostic", "quality_summary.csv")
issues_df.to_csv(summary_path, index=False)

# ══════════════════════════════════════════════════════════════════════════════
# 5. FINAL PRINT SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("QUALITY AUDIT COMPLETE")
print(f"{'='*60}")
print(f"Total issues found: {len(issues)}")
print(f"\nIssue breakdown:")
for _, row in issues_df.iterrows():
    print(f"  [{row['column']}] {row['issue_type']} — {row['affected_rows']} rows")
    print(f"    → {row['recommendation']}")
print(f"\nFigures saved to: {FIGS}")
print(f"Quality summary saved to: {summary_path}")
print(f"\nNext step: Review each issue above, decide on cleaning strategy, then run cleaning.py")

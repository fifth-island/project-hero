"""
Phase 0 — Data Orientation & Diagnostic Script
================================================
Loads the raw student_wellness.csv and produces:
  • Per-column structural overview (type, nulls, uniques, stats)
  • Data quality issue inventory with recommendations
  • One diagnostic Plotly chart per problematic column → saved to phase0_diagnostic/figures/
  • quality_summary.csv with structured issue log
  • Full console report

Run:  python phase0_diagnostic/scripts/diagnostic.py
"""

import os, json, textwrap
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# ── paths ────────────────────────────────────────────────────────────────
BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # phase0_diagnostic/
ROOT    = os.path.dirname(BASE)                                        # eda_lab_student/
DATA    = os.path.join(ROOT, "dataset", "student_wellness.csv")
FIG_DIR = os.path.join(BASE, "figures")
os.makedirs(FIG_DIR, exist_ok=True)

# ── palette (from agent.md) ──────────────────────────────────────────────
PALETTE = {
    "primary":    "#A8C8E8",
    "secondary":  "#F4A8B0",
    "accent1":    "#A8E8C8",
    "accent2":    "#F4D8A8",
    "accent3":    "#C8A8E8",
    "accent4":    "#F4F4A8",
    "neutral":    "#D0D0D0",
    "dark_text":  "#4A4A4A",
    "background": "#FAFAFA",
}
CATEGORICAL_COLORS = [
    "#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8",
    "#C8A8E8", "#F4F4A8", "#B8D8F8", "#F8C8D8",
]

LAYOUT_DEFAULTS = dict(
    template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA",
    paper_bgcolor="#FFFFFF",
    margin=dict(t=80, b=60, l=60, r=40),
)

def styled(fig, title):
    fig.update_layout(
        **LAYOUT_DEFAULTS,
        title=dict(text=title, font=dict(size=16, color="#4A4A4A"), x=0.5, xanchor="center"),
    )
    return fig

def save(fig, name):
    fig.write_html(os.path.join(FIG_DIR, f"{name}.html"))
    fig.write_image(os.path.join(FIG_DIR, f"{name}.png"), width=1200, height=700, scale=2)
    print(f"  ✓ saved  figures/{name}.png  +  .html")

# ── load raw ─────────────────────────────────────────────────────────────
df = pd.read_csv(DATA)
print(f"\n{'='*70}")
print(f"  DATASET LOADED: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"{'='*70}\n")

# ══════════════════════════════════════════════════════════════════════════
# 1. STRUCTURAL OVERVIEW
# ══════════════════════════════════════════════════════════════════════════

overview_rows = []

for col in df.columns:
    s = df[col]
    info = {
        "column": col,
        "pandas_dtype": str(s.dtype),
        "n_missing": int(s.isna().sum()),
        "pct_missing": round(s.isna().mean() * 100, 2),
        "n_unique": int(s.nunique()),
    }

    if pd.api.types.is_numeric_dtype(s):
        info["min"]    = round(float(s.min()), 4) if s.notna().any() else None
        info["max"]    = round(float(s.max()), 4) if s.notna().any() else None
        info["mean"]   = round(float(s.mean()), 4) if s.notna().any() else None
        info["median"] = round(float(s.median()), 4) if s.notna().any() else None
        info["std"]    = round(float(s.std()), 4) if s.notna().any() else None
        info["unique_values"] = None
    else:
        vc = s.dropna().value_counts()
        if len(vc) <= 20:
            info["unique_values"] = vc.to_dict()
        else:
            info["unique_values"] = vc.head(10).to_dict()
        info["min"] = info["max"] = info["mean"] = info["median"] = info["std"] = None

    overview_rows.append(info)

overview_df = pd.DataFrame(overview_rows)

# pretty-print
print("─" * 70)
print("  STRUCTURAL OVERVIEW")
print("─" * 70)
for r in overview_rows:
    col = r["column"]
    print(f"\n  ▸ {col}")
    print(f"    dtype={r['pandas_dtype']}  |  missing={r['n_missing']} ({r['pct_missing']}%)"
          f"  |  unique={r['n_unique']}")
    if r["min"] is not None:
        print(f"    min={r['min']}  max={r['max']}  mean={r['mean']}"
              f"  median={r['median']}  std={r['std']}")
    if r["unique_values"]:
        vals = r["unique_values"]
        print(f"    values: {vals}")

# ══════════════════════════════════════════════════════════════════════════
# 2. DUPLICATE CHECK
# ══════════════════════════════════════════════════════════════════════════

dups = df.duplicated()
n_dups = int(dups.sum())
print(f"\n{'─'*70}")
print(f"  DUPLICATE ROWS: {n_dups}")
if n_dups:
    print(f"  (indices: {list(df.index[dups][:20])})")
print(f"{'─'*70}")

# ══════════════════════════════════════════════════════════════════════════
# 3. DATA QUALITY ISSUES
# ══════════════════════════════════════════════════════════════════════════

issues = []

def flag(col, issue_type, affected, recommendation, detail=""):
    issues.append({
        "column": col,
        "issue_type": issue_type,
        "affected_rows": affected,
        "recommendation": recommendation,
        "detail": detail,
    })

# ── duplicates ──
if n_dups:
    flag("(whole row)", "duplicate_rows", n_dups,
         "Drop exact duplicate rows, keep first occurrence")

# ── age ──
age_raw = pd.to_numeric(df["age"], errors="coerce")
impossible_age = ((age_raw < 16) | (age_raw > 60)).sum()
if impossible_age:
    flag("age", "impossible_value", int(impossible_age),
         "Set impossible ages (< 16 or > 60) to NaN; impute with median later",
         detail=f"Values seen: {sorted(age_raw[(age_raw < 16) | (age_raw > 60)].dropna().unique().tolist())}")

# ── gender ──
gender_vals = df["gender"].dropna().unique().tolist()
canonical = {"Male", "Female", "Non-binary", "Prefer not to say"}
non_canonical = [v for v in gender_vals if v not in canonical]
if non_canonical:
    flag("gender", "inconsistent_encoding", int(df["gender"].isin(non_canonical).sum()),
         "Map all variants to canonical: Male/Female/Non-binary/Prefer not to say",
         detail=f"Non-canonical values: {non_canonical}")

# ── gpa ──
gpa_numeric = pd.to_numeric(df["gpa"], errors="coerce")
gpa_bad = ((gpa_numeric < 0) | (gpa_numeric > 4.0))
gpa_coercion_failed = df["gpa"].notna() & gpa_numeric.isna()
n_gpa_issues = int(gpa_bad.sum() + gpa_coercion_failed.sum())
if n_gpa_issues:
    flag("gpa", "impossible_value / wrong_type", n_gpa_issues,
         "Coerce to numeric; set values outside [0, 4] to NaN",
         detail=f"Out-of-range count={int(gpa_bad.sum())}; coercion failures={int(gpa_coercion_failed.sum())}")

# ── study_hours_per_day ──
sh = df["study_hours_per_day"]
sh_bad = ((sh < 0) | (sh > 16))
if sh_bad.any():
    flag("study_hours_per_day", "impossible_value", int(sh_bad.sum()),
         "Set values outside [0, 16] to NaN")

# ── attendance_rate ──
ar = df["attendance_rate"]
ar_bad = ((ar < 0) | (ar > 100))
if ar_bad.any():
    flag("attendance_rate", "impossible_value", int(ar_bad.sum()),
         "Cap at 100 or set > 100 to NaN")

# ── sleep_hours_per_night ──
sleep_numeric = pd.to_numeric(df["sleep_hours_per_night"], errors="coerce")
sleep_bad = ((sleep_numeric < 0) | (sleep_numeric > 20))
sleep_coerce_fail = df["sleep_hours_per_night"].notna() & sleep_numeric.isna()
n_sleep_issues = int(sleep_bad.sum() + sleep_coerce_fail.sum())
if n_sleep_issues:
    flag("sleep_hours_per_night", "impossible_value / wrong_type", n_sleep_issues,
         "Coerce to numeric; clamp to [0, 16] or set extreme values to NaN")

# ── exercise_days_per_week ──
ex = pd.to_numeric(df["exercise_days_per_week"], errors="coerce")
ex_bad = ((ex < 0) | (ex > 7))
ex_coerce_fail = df["exercise_days_per_week"].notna() & ex.isna()
n_ex = int(ex_bad.sum() + ex_coerce_fail.sum())
if n_ex:
    flag("exercise_days_per_week", "impossible_value / wrong_type", n_ex,
         "Coerce to numeric; clamp to [0, 7]")

# ── stress_level (mixed text + numeric) ──
stress_numeric = pd.to_numeric(df["stress_level"], errors="coerce")
stress_text = df["stress_level"][stress_numeric.isna() & df["stress_level"].notna()]
if len(stress_text):
    flag("stress_level", "mixed_types (text + numeric)", int(len(stress_text)),
         "Map text labels to numeric midpoints (e.g., low→2, medium→5, high→8); coerce rest to float",
         detail=f"Text values: {stress_text.value_counts().to_dict()}")

# ── anxiety_score ──
anx = pd.to_numeric(df["anxiety_score"], errors="coerce")
anx_bad = ((anx < 0) | (anx > 21))
anx_coerce = df["anxiety_score"].notna() & anx.isna()
n_anx = int(anx_bad.sum() + anx_coerce.sum())
if n_anx:
    flag("anxiety_score", "impossible_value / wrong_type", n_anx,
         "Coerce to numeric; set values outside [0, 21] to NaN")

# ── depression_score ──
dep = pd.to_numeric(df["depression_score"], errors="coerce")
dep_bad = ((dep < 0) | (dep > 27))
dep_coerce = df["depression_score"].notna() & dep.isna()
n_dep = int(dep_bad.sum() + dep_coerce.sum())
if n_dep:
    flag("depression_score", "impossible_value / wrong_type", n_dep,
         "Coerce to numeric; set values outside [0, 27] to NaN")

# ── caffeine_mg_per_day ──
caf = pd.to_numeric(df["caffeine_mg_per_day"], errors="coerce")
caf_bad = ((caf < 0) | (caf > 1000))
caf_coerce = df["caffeine_mg_per_day"].notna() & caf.isna()
n_caf = int(caf_bad.sum() + caf_coerce.sum())
if n_caf:
    flag("caffeine_mg_per_day", "impossible_value / wrong_type", n_caf,
         "Coerce to numeric; set values outside [0, 1000] to NaN")

# ── on_campus ──
oc = df["on_campus"].dropna().unique().tolist()
oc_expected = {"True", "False"}
oc_non = [v for v in oc if str(v) not in oc_expected]
if oc_non:
    flag("on_campus", "inconsistent_encoding", int(df["on_campus"].isin(oc_non).sum()),
         "Map all variants to boolean True/False",
         detail=f"Non-canonical values: {oc_non}")

# ── has_part_time_job ──
hp = df["has_part_time_job"].dropna().unique().tolist()
hp_expected = {"Yes", "No"}
hp_non = [v for v in hp if v not in hp_expected]
if hp_non:
    flag("has_part_time_job", "inconsistent_encoding", int(df["has_part_time_job"].isin(hp_non).sum()),
         "Map all variants to Yes/No",
         detail=f"Non-canonical values: {hp_non}")

# ── num_clubs ──
nc = pd.to_numeric(df["num_clubs"], errors="coerce")
nc_bad = ((nc < 0) | (nc > 10))
nc_coerce = df["num_clubs"].notna() & nc.isna()
n_nc = int(nc_bad.sum() + nc_coerce.sum())
if n_nc:
    flag("num_clubs", "impossible_value / wrong_type", n_nc,
         "Coerce to numeric; set values outside [0, 10] to NaN")

# ── monthly_spending ──
ms = pd.to_numeric(df["monthly_spending"], errors="coerce")
ms_bad = ((ms < 0) | (ms > 5000))
ms_coerce = df["monthly_spending"].notna() & ms.isna()
n_ms = int(ms_bad.sum() + ms_coerce.sum())
if n_ms:
    flag("monthly_spending", "impossible_value / wrong_type", n_ms,
         "Coerce to numeric; set values outside [0, 5000] to NaN")

# ── missing values summary ──
for col in df.columns:
    n_miss = int(df[col].isna().sum())
    if n_miss > 0:
        # only add if not already flagged for this column
        if col not in [i["column"] for i in issues]:
            flag(col, "missing_values", n_miss,
                 f"Investigate missingness pattern; impute or drop depending on Phase 1 needs")

# print issues
print(f"\n{'─'*70}")
print(f"  DATA QUALITY ISSUES FOUND: {len(issues)}")
print(f"{'─'*70}")
for i, iss in enumerate(issues, 1):
    print(f"\n  [{i}] {iss['column']}  —  {iss['issue_type']}")
    print(f"      rows affected: {iss['affected_rows']}")
    print(f"      recommendation: {iss['recommendation']}")
    if iss["detail"]:
        print(f"      detail: {iss['detail']}")

# save quality_summary.csv
issues_df = pd.DataFrame(issues)
issues_path = os.path.join(BASE, "quality_summary.csv")
issues_df.to_csv(issues_path, index=False)
print(f"\n  ✓ saved  quality_summary.csv ({len(issues)} issues)")

# ══════════════════════════════════════════════════════════════════════════
# 4. DIAGNOSTIC CHARTS
# ══════════════════════════════════════════════════════════════════════════

print(f"\n{'─'*70}")
print(f"  GENERATING DIAGNOSTIC CHARTS")
print(f"{'─'*70}")

# 4a. Missing values heatmap (overview)
miss = df.isnull().sum()
miss = miss[miss > 0].sort_values(ascending=True)
fig = go.Figure(go.Bar(
    y=miss.index, x=miss.values, orientation="h",
    marker_color=PALETTE["secondary"],
    text=[f"{v} ({v/len(df)*100:.1f}%)" for v in miss.values],
    textposition="outside",
))
styled(fig, "Missing Values per Column")
fig.update_xaxes(title_text="Number of Missing Values")
save(fig, "missing_values_overview")

# 4b. Age distribution highlighting impossible values
age_vals = pd.to_numeric(df["age"], errors="coerce")
colors = ["#F4A8B0" if (v < 16 or v > 60) else "#A8C8E8" for v in age_vals]
fig = go.Figure(go.Histogram(
    x=age_vals, nbinsx=50,
    marker_color=PALETTE["primary"],
))
# add annotations for impossible values
impossible_ages = age_vals[(age_vals < 16) | (age_vals > 60)].dropna()
if len(impossible_ages):
    for a in impossible_ages.unique():
        fig.add_vline(x=a, line_dash="dash", line_color="#F4A8B0",
                      annotation_text=f"impossible: {a}")
styled(fig, "Age Distribution (impossible values highlighted)")
fig.update_xaxes(title_text="Age (years)")
fig.update_yaxes(title_text="Count")
save(fig, "age_distribution")

# 4c. Gender encoding variants
gender_vc = df["gender"].value_counts()
fig = go.Figure(go.Bar(
    x=gender_vc.index.tolist(), y=gender_vc.values,
    marker_color=CATEGORICAL_COLORS[:len(gender_vc)],
    text=gender_vc.values, textposition="outside",
))
styled(fig, "Gender — All Unique Encodings (Before Cleaning)")
fig.update_xaxes(title_text="Gender Value")
fig.update_yaxes(title_text="Count")
save(fig, "gender_encoding")

# 4d. GPA distribution
gpa_vals = pd.to_numeric(df["gpa"], errors="coerce")
fig = go.Figure(go.Histogram(x=gpa_vals, nbinsx=40, marker_color=PALETTE["accent1"]))
bad_gpa = gpa_vals[(gpa_vals < 0) | (gpa_vals > 4)]
for v in bad_gpa.dropna().unique():
    fig.add_vline(x=v, line_dash="dash", line_color="#F4A8B0",
                  annotation_text=f"out-of-range: {v}")
styled(fig, "GPA Distribution (flagging out-of-range)")
fig.update_xaxes(title_text="GPA")
fig.update_yaxes(title_text="Count")
save(fig, "gpa_distribution")

# 4e. Stress level — mixed types
stress_all = df["stress_level"].dropna()
stress_vc = stress_all.value_counts().head(20)
fig = go.Figure(go.Bar(
    x=[str(v) for v in stress_vc.index], y=stress_vc.values,
    marker_color=[PALETTE["secondary"] if not str(v).replace('.','').replace('-','').isdigit()
                  else PALETTE["primary"] for v in stress_vc.index],
    text=stress_vc.values, textposition="outside",
))
styled(fig, "Stress Level Values (text entries highlighted in rose)")
fig.update_xaxes(title_text="Stress Level Value")
fig.update_yaxes(title_text="Count")
save(fig, "stress_level_mixed")

# 4f. on_campus encoding
oc_vc = df["on_campus"].value_counts()
fig = go.Figure(go.Bar(
    x=[str(v) for v in oc_vc.index], y=oc_vc.values,
    marker_color=CATEGORICAL_COLORS[:len(oc_vc)],
    text=oc_vc.values, textposition="outside",
))
styled(fig, "on_campus — All Unique Encodings")
fig.update_xaxes(title_text="on_campus value")
fig.update_yaxes(title_text="Count")
save(fig, "on_campus_encoding")

# 4g. Sleep hours distribution
sleep_vals = pd.to_numeric(df["sleep_hours_per_night"], errors="coerce")
fig = go.Figure(go.Histogram(x=sleep_vals, nbinsx=40, marker_color=PALETTE["accent3"]))
bad_sleep = sleep_vals[(sleep_vals < 0) | (sleep_vals > 16)]
for v in bad_sleep.dropna().unique():
    fig.add_vline(x=v, line_dash="dash", line_color="#F4A8B0",
                  annotation_text=f"extreme: {v}")
styled(fig, "Sleep Hours Distribution")
fig.update_xaxes(title_text="Hours per Night")
fig.update_yaxes(title_text="Count")
save(fig, "sleep_hours_distribution")

# 4h. Attendance rate distribution
fig = go.Figure(go.Histogram(x=df["attendance_rate"], nbinsx=40, marker_color=PALETTE["accent2"]))
ar_bad_vals = df["attendance_rate"][df["attendance_rate"] > 100]
for v in ar_bad_vals.dropna().unique():
    fig.add_vline(x=v, line_dash="dash", line_color="#F4A8B0",
                  annotation_text=f">100%: {v}")
styled(fig, "Attendance Rate Distribution")
fig.update_xaxes(title_text="Attendance (%)")
fig.update_yaxes(title_text="Count")
save(fig, "attendance_rate_distribution")

# 4i. Study hours distribution
fig = go.Figure(go.Histogram(x=df["study_hours_per_day"], nbinsx=40, marker_color=PALETTE["primary"]))
sh_bad_vals = df["study_hours_per_day"][(df["study_hours_per_day"] < 0) | (df["study_hours_per_day"] > 16)]
for v in sh_bad_vals.dropna().unique():
    fig.add_vline(x=v, line_dash="dash", line_color="#F4A8B0",
                  annotation_text=f"impossible: {v}")
styled(fig, "Study Hours per Day Distribution")
fig.update_xaxes(title_text="Hours / Day")
fig.update_yaxes(title_text="Count")
save(fig, "study_hours_distribution")

# 4j. Caffeine distribution
caf_vals = pd.to_numeric(df["caffeine_mg_per_day"], errors="coerce")
fig = go.Figure(go.Histogram(x=caf_vals, nbinsx=40, marker_color=PALETTE["accent2"]))
styled(fig, "Caffeine Intake Distribution (mg/day)")
fig.update_xaxes(title_text="Caffeine (mg)")
fig.update_yaxes(title_text="Count")
save(fig, "caffeine_distribution")

# 4k. Monthly spending distribution
ms_vals = pd.to_numeric(df["monthly_spending"], errors="coerce")
fig = go.Figure(go.Histogram(x=ms_vals, nbinsx=40, marker_color=PALETTE["accent1"]))
styled(fig, "Monthly Spending Distribution ($)")
fig.update_xaxes(title_text="Spending ($)")
fig.update_yaxes(title_text="Count")
save(fig, "monthly_spending_distribution")

# 4l. Duplicate rows indicator
if n_dups:
    dup_labels = ["Unique Rows", "Duplicate Rows"]
    dup_vals = [len(df) - n_dups, n_dups]
    fig = go.Figure(go.Pie(
        labels=dup_labels, values=dup_vals,
        marker_colors=[PALETTE["primary"], PALETTE["secondary"]],
        textinfo="label+value+percent",
    ))
    styled(fig, f"Duplicate Rows: {n_dups} of {len(df)}")
    save(fig, "duplicate_rows")

# ── final summary ────────────────────────────────────────────────────────
print(f"\n{'='*70}")
print(f"  PHASE 0 DIAGNOSTIC COMPLETE")
print(f"  Rows: {df.shape[0]}  |  Columns: {df.shape[1]}")
print(f"  Duplicates: {n_dups}")
print(f"  Quality issues flagged: {len(issues)}")
print(f"  Figures saved to: {FIG_DIR}/")
print(f"  Quality CSV saved to: {issues_path}")
print(f"{'='*70}\n")

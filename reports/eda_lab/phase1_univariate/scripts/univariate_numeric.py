"""
Phase 1 — Univariate Analysis: Numeric Columns
================================================
Produces histogram + KDE + box plot for each numeric column.
Prints descriptive stats (mean, median, std, skewness, kurtosis).

Outputs: phase1_univariate/figures/[col]_hist.png, [col]_box.png
"""

import os
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from scipy import stats

BASE  = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab"
CLEAN = os.path.join(BASE, "dataset", "student_wellness_clean.csv")
FIGS  = os.path.join(BASE, "phase1_univariate", "figures")
os.makedirs(FIGS, exist_ok=True)

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

df = pd.read_csv(CLEAN)

NUMERIC_COLS = [
    ("age",                    "Age",                       "Years",      PASTEL[0]),
    ("gpa",                    "GPA",                       "Grade Points (0–4.0)", PASTEL[1]),
    ("study_hours_per_day",    "Study Hours per Day",       "Hours",      PASTEL[2]),
    ("attendance_rate",        "Class Attendance Rate",     "%",          PASTEL[3]),
    ("sleep_hours_per_night",  "Sleep Hours per Night",     "Hours",      PASTEL[4]),
    ("exercise_days_per_week", "Exercise Days per Week",    "Days",       PASTEL[0]),
    ("screen_time_hours",      "Daily Screen Time",         "Hours",      PASTEL[1]),
    ("social_media_hours",     "Social Media Usage",        "Hours/Day",  PASTEL[2]),
    ("caffeine_mg_per_day",    "Caffeine Intake",           "mg/Day",     PASTEL[3]),
    ("stress_level",           "Stress Level (self-report)","Scale 1–10", PASTEL[4]),
    ("anxiety_score",          "Anxiety Score (GAD-7)",     "0–21",       PASTEL[0]),
    ("depression_score",       "Depression Score (PHQ-9)",  "0–27",       PASTEL[1]),
    ("life_satisfaction",      "Life Satisfaction",         "Scale 1–10", PASTEL[2]),
    ("monthly_spending",       "Monthly Spending",          "USD ($)",    PASTEL[3]),
]

print(f"\n{'='*60}")
print("PHASE 1 — UNIVARIATE ANALYSIS: NUMERIC COLUMNS")
print(f"{'='*60}\n")

summary_rows = []

for col, label, unit, color in NUMERIC_COLS:
    if col not in df.columns:
        continue
    s = df[col].dropna()

    skew = s.skew()
    kurt = s.kurtosis()
    skew_label = ("symmetric" if abs(skew) < 0.5
                  else ("right-skewed" if skew > 0 else "left-skewed"))

    print(f"[{col}]")
    print(f"  mean={s.mean():.2f}  median={s.median():.2f}  std={s.std():.2f}")
    print(f"  min={s.min():.2f}  max={s.max():.2f}  skew={skew:.2f} ({skew_label})  kurtosis={kurt:.2f}")

    summary_rows.append({
        "column": col, "mean": round(s.mean(), 2), "median": round(s.median(), 2),
        "std": round(s.std(), 2), "min": round(s.min(), 2), "max": round(s.max(), 2),
        "skewness": round(skew, 2), "kurtosis": round(kurt, 2),
        "shape": skew_label,
    })

    # ── Histogram with KDE overlay ──
    kde_x = np.linspace(s.min(), s.max(), 300)
    kde_y = stats.gaussian_kde(s)(kde_x)
    kde_y_scaled = kde_y * len(s) * (s.max() - s.min()) / 30  # scale to histogram

    fig_hist = go.Figure()
    fig_hist.add_trace(go.Histogram(
        x=s, nbinsx=30, name="Distribution",
        marker_color=color, opacity=0.75,
        showlegend=True,
    ))
    fig_hist.add_trace(go.Scatter(
        x=kde_x, y=kde_y_scaled, mode="lines",
        line=dict(color="#4A4A4A", width=2, dash="solid"),
        name="KDE", showlegend=True,
    ))
    fig_hist.add_vline(x=s.mean(),   line_dash="dash", line_color="#A8C8E8",
                       annotation_text=f"Mean: {s.mean():.1f}")
    fig_hist.add_vline(x=s.median(), line_dash="dot",  line_color="#F4A8B0",
                       annotation_text=f"Median: {s.median():.1f}")
    fig_hist.update_layout(**LAYOUT,
        title=f"{label} — Distribution",
        xaxis_title=f"{label} ({unit})",
        yaxis_title="Count",
        legend=dict(x=0.78, y=0.92),
    )
    save_fig(fig_hist, f"{col}_hist.png")

    # ── Box plot ──
    fig_box = go.Figure()
    fig_box.add_trace(go.Box(
        y=s, name=label,
        marker_color=color,
        boxpoints="outliers",
        jitter=0.3,
        line=dict(color="#4A4A4A", width=1.5),
    ))
    fig_box.update_layout(**LAYOUT,
        title=f"{label} — Box Plot",
        yaxis_title=f"{label} ({unit})",
        xaxis=dict(showticklabels=False),
    )
    save_fig(fig_box, f"{col}_box.png")

# ── Summary stats CSV ──
summary_df = pd.DataFrame(summary_rows)
summary_path = os.path.join(BASE, "phase1_univariate", "numeric_summary_stats.csv")
summary_df.to_csv(summary_path, index=False)

print(f"\n{'='*60}")
print("NUMERIC UNIVARIATE COMPLETE")
print(f"Figures saved to: {FIGS}")
print(f"Summary stats:    {summary_path}")
print(f"{'='*60}")
print("\nKey highlights:")
print(summary_df[["column", "mean", "median", "skewness", "shape"]].to_string(index=False))

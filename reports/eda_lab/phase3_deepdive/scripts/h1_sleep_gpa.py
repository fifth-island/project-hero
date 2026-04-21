"""
Phase 3 — H1 Deep Dive: Sleep, Study Hours, and GPA
======================================================
Hypothesis: The direct sleep → GPA relationship is a confound.
Controlling for study hours reveals a more nuanced picture.

Outputs: phase3_deepdive/figures/h1_*.png
"""

import os
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from scipy import stats

BASE  = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab"
CLEAN = os.path.join(BASE, "dataset", "student_wellness_clean.csv")
FIGS  = os.path.join(BASE, "phase3_deepdive", "figures")
os.makedirs(FIGS, exist_ok=True)

PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8"]
LAYOUT = dict(template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA", paper_bgcolor="#FFFFFF", margin=dict(t=80, b=60, l=60, r=40))

def save_fig(fig, name):
    fig.write_image(os.path.join(FIGS, name), width=1200, height=650, scale=2)
    print(f"  [saved] {name}")

df = pd.read_csv(CLEAN)
df["sleep_cat"] = pd.cut(df["sleep_hours_per_night"], bins=[0, 6, 7, 100],
                          labels=["< 6 hrs", "6–7 hrs", "≥ 7 hrs"])
df["study_cat"] = pd.cut(df["study_hours_per_day"], bins=[0, 5, 8, 100],
                          labels=["Low study (<5hrs)", "Moderate (5–8hrs)", "High study (>8hrs)"])
STEM = {"Computer Science", "Biology", "Nursing", "Mechanical Engineering"}
df["major_type"] = df["major"].apply(lambda x: "STEM" if x in STEM else "Non-STEM")

print(f"\n{'='*60}\nH1 DEEP DIVE: SLEEP × STUDY HOURS × GPA\n{'='*60}\n")

# ── 1. Correlation matrix: sleep, study, gpa ──────────────────────────────────
corr_vars = ["sleep_hours_per_night", "study_hours_per_day", "gpa", "attendance_rate"]
corr = df[corr_vars].corr()
print("Correlation matrix:")
print(corr.round(3).to_string())

fig = px.imshow(corr, text_auto=".2f", color_continuous_scale="RdBu",
                zmin=-1, zmax=1,
                title="H1: Correlation Matrix — Sleep, Study Hours, GPA, Attendance",
                labels=dict(color="Pearson r"))
fig.update_layout(**LAYOUT)
save_fig(fig, "h1_correlation_matrix.png")

# ── 2. Scatter: sleep vs GPA, colored by study hours ─────────────────────────
fig2 = px.scatter(df, x="sleep_hours_per_night", y="gpa",
                  color="study_cat",
                  color_discrete_map={
                      "Low study (<5hrs)": PASTEL[1],
                      "Moderate (5–8hrs)": PASTEL[0],
                      "High study (>8hrs)": PASTEL[2],
                  },
                  opacity=0.65, size_max=8,
                  labels={"sleep_hours_per_night": "Sleep Hours per Night",
                          "gpa": "GPA", "study_cat": "Study Intensity"},
                  title="H1: Sleep vs GPA — Colored by Study Hours (the confound revealed)")
fig2.update_layout(**LAYOUT)
save_fig(fig2, "h1_sleep_gpa_by_study.png")

# ── 3. Within-study-group: sleep → GPA (controlling for study) ───────────────
print("\nGPA means by sleep category, WITHIN each study intensity group:")
fig3 = make_subplots(rows=1, cols=3,
    subplot_titles=["Low Study (<5hrs)", "Moderate Study (5–8hrs)", "High Study (>8hrs)"],
    shared_yaxes=True)

for i, (study_label, color) in enumerate([
    ("Low study (<5hrs)", PASTEL[1]),
    ("Moderate (5–8hrs)", PASTEL[0]),
    ("High study (>8hrs)", PASTEL[2]),
]):
    sub = df[df["study_cat"] == study_label]
    for j, sleep_label in enumerate(["< 6 hrs", "6–7 hrs", "≥ 7 hrs"]):
        g = sub[sub["sleep_cat"] == sleep_label]["gpa"]
        print(f"  {study_label} × {sleep_label}: GPA = {g.mean():.3f} (n={len(g)})")
        fig3.add_trace(go.Box(y=g, name=sleep_label, marker_color=PASTEL[j],
                              boxpoints="outliers", showlegend=(i==0)), row=1, col=i+1)

fig3.update_layout(**LAYOUT,
    title="H1: GPA by Sleep Category — Controlled for Study Intensity",
    yaxis_title="GPA")
save_fig(fig3, "h1_gpa_sleep_controlled_study.png")

# ── 4. Scatter: study hours vs GPA (the real driver) ────────────────────────
r_study, p_study = stats.pearsonr(df["study_hours_per_day"], df["gpa"])
r_sleep, p_sleep = stats.pearsonr(df["sleep_hours_per_night"], df["gpa"])
print(f"\nStudy hours → GPA: r = {r_study:.3f}, p = {p_study:.4f}")
print(f"Sleep hours  → GPA: r = {r_sleep:.3f}, p = {p_sleep:.4f}")

fig4 = make_subplots(rows=1, cols=2,
    subplot_titles=[
        f"Study Hours → GPA (r={r_study:.2f}, p={p_study:.4f})",
        f"Sleep Hours → GPA (r={r_sleep:.2f}, p={p_sleep:.4f})"
    ])
fig4.add_trace(go.Scatter(x=df["study_hours_per_day"], y=df["gpa"],
    mode="markers", marker=dict(color=PASTEL[2], opacity=0.5, size=6), showlegend=False), row=1, col=1)
fig4.add_trace(go.Scatter(x=df["sleep_hours_per_night"], y=df["gpa"],
    mode="markers", marker=dict(color=PASTEL[0], opacity=0.5, size=6), showlegend=False), row=1, col=2)

# trend lines
for col_idx, (x_col, color) in enumerate([("study_hours_per_day", PASTEL[2]), ("sleep_hours_per_night", PASTEL[0])]):
    m, b = np.polyfit(df[x_col], df["gpa"], 1)
    x_r = np.linspace(df[x_col].min(), df[x_col].max(), 100)
    fig4.add_trace(go.Scatter(x=x_r, y=m*x_r+b, mode="lines",
        line=dict(color="#4A4A4A", width=2), showlegend=False), row=1, col=col_idx+1)

fig4.update_xaxes(title_text="Study Hours/Day", row=1, col=1)
fig4.update_xaxes(title_text="Sleep Hours/Night", row=1, col=2)
fig4.update_yaxes(title_text="GPA", row=1, col=1)
fig4.update_layout(**LAYOUT, title="H1: Study Hours vs GPA (strong) vs Sleep vs GPA (weak)")
save_fig(fig4, "h1_study_vs_sleep_driver.png")

# ── 5. Negative correlation between sleep and study ───────────────────────────
r_sleepstudy, p_ss = stats.pearsonr(df["sleep_hours_per_night"], df["study_hours_per_day"])
print(f"\nSleep ↔ Study hours: r = {r_sleepstudy:.3f}, p = {p_ss:.4f}")
print("  (Negative = more study → less sleep: the confound mechanism)")

fig5 = px.scatter(df, x="study_hours_per_day", y="sleep_hours_per_night",
                  color="gpa", color_continuous_scale="Blues",
                  opacity=0.65,
                  labels={"study_hours_per_day": "Study Hours/Day",
                          "sleep_hours_per_night": "Sleep Hours/Night",
                          "gpa": "GPA"},
                  title=f"H1: The Confound — Study Hours vs Sleep (r={r_sleepstudy:.2f}), colored by GPA")
fig5.update_layout(**LAYOUT)
save_fig(fig5, "h1_study_sleep_gpa_confound.png")

print(f"\n{'='*60}\nH1 COMPLETE — 5 figures saved\n{'='*60}")

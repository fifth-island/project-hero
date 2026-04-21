"""
Phase 2 — Bivariate Preview Charts
=====================================
Quick preview charts for the top hypotheses to help decide which 3
to investigate deeply in Phase 3.

Hypotheses being previewed:
  H1: Sleep hours → GPA (sleep predicts academic performance)
  H2: Major (STEM vs. non-STEM) → Stress level
  H3: Screen time → Life satisfaction / wellness composite
  H4: Part-time job → Study hours and GPA
  H5: Year in school → Anxiety score (stress accumulates over years)

Outputs: phase2_hypothesis/figures/preview_h[1-5]*.png
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
FIGS  = os.path.join(BASE, "phase2_hypothesis", "figures")
os.makedirs(FIGS, exist_ok=True)

PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8", "#B8D8F8", "#F8C8D8"]
LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA", paper_bgcolor="#FFFFFF",
    margin=dict(t=80, b=60, l=60, r=40),
)

def save_fig(fig, name):
    fig.write_image(os.path.join(FIGS, name), width=1200, height=650, scale=2)
    print(f"  [saved] {name}")

df = pd.read_csv(CLEAN)

# STEM flag
STEM_MAJORS = {"Computer Science", "Biology", "Nursing", "Mechanical Engineering"}
df["is_stem"] = df["major"].isin(STEM_MAJORS)
df["major_type"] = df["is_stem"].map({True: "STEM", False: "Non-STEM"})

# Sleep category
df["sleep_cat"] = pd.cut(df["sleep_hours_per_night"],
                          bins=[0, 6, 7, 100],
                          labels=["< 6 hrs", "6–7 hrs", "≥ 7 hrs"])

# Screen time category
df["screen_cat"] = pd.cut(df["screen_time_hours"],
                           bins=[0, 5, 9, 100],
                           labels=["Low (<5hrs)", "Moderate (5–9hrs)", "High (>9hrs)"])

# Year label
year_map = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}
df["year_label"] = df["year_in_school"].map(year_map)

print(f"\n{'='*60}")
print("PHASE 2 — BIVARIATE PREVIEW CHARTS")
print(f"{'='*60}\n")

# ══════════════════════════════════════════════════════════════════════════════
# H1: Sleep → GPA
# ══════════════════════════════════════════════════════════════════════════════
print("[H1] Sleep hours → GPA")
r, p = stats.pearsonr(df["sleep_hours_per_night"], df["gpa"])
print(f"  Pearson r = {r:.3f}, p = {p:.4f}")

fig = px.scatter(df, x="sleep_hours_per_night", y="gpa",
                 color="major_type", color_discrete_map={"STEM": PASTEL[0], "Non-STEM": PASTEL[1]},
                 trendline="ols", opacity=0.6,
                 labels={"sleep_hours_per_night": "Sleep Hours per Night",
                         "gpa": "GPA", "major_type": "Major Type"},
                 title=f"H1 Preview: Sleep Hours vs GPA (r = {r:.2f}, p = {p:.4f})")
fig.update_layout(**LAYOUT)
save_fig(fig, "preview_h1_sleep_gpa.png")

# Box plot: GPA by sleep category
fig2 = px.box(df, x="sleep_cat", y="gpa",
              color="sleep_cat", color_discrete_sequence=PASTEL,
              category_orders={"sleep_cat": ["< 6 hrs", "6–7 hrs", "≥ 7 hrs"]},
              labels={"sleep_cat": "Sleep Category", "gpa": "GPA"},
              title="H1 Preview: GPA Distribution by Sleep Category")
fig2.update_layout(**LAYOUT, showlegend=False)
save_fig(fig2, "preview_h1_gpa_by_sleep_cat.png")

# Print group means
for cat in ["< 6 hrs", "6–7 hrs", "≥ 7 hrs"]:
    g = df[df["sleep_cat"] == cat]["gpa"]
    print(f"  GPA mean ({cat}): {g.mean():.3f} ± {g.std():.3f}")

# ══════════════════════════════════════════════════════════════════════════════
# H2: Major type → Stress level
# ══════════════════════════════════════════════════════════════════════════════
print("\n[H2] STEM vs. Non-STEM → Stress level")
stem_stress   = df[df["is_stem"]]["stress_level"]
nonstm_stress = df[~df["is_stem"]]["stress_level"]
t, p2 = stats.ttest_ind(stem_stress, nonstm_stress)
print(f"  STEM mean stress:     {stem_stress.mean():.2f}")
print(f"  Non-STEM mean stress: {nonstm_stress.mean():.2f}")
print(f"  t = {t:.3f}, p = {p2:.4f}")

fig3 = px.violin(df, x="major_type", y="stress_level",
                 color="major_type", color_discrete_map={"STEM": PASTEL[0], "Non-STEM": PASTEL[1]},
                 box=True, points="outliers",
                 labels={"major_type": "Major Type", "stress_level": "Stress Level (1–10)"},
                 title=f"H2 Preview: Stress Level by Major Type (t={t:.2f}, p={p2:.4f})")
fig3.update_layout(**LAYOUT, showlegend=False)
save_fig(fig3, "preview_h2_stress_by_major_type.png")

# Per-major stress
print("  Stress by major:")
for m in df.groupby("major")["stress_level"].mean().sort_values(ascending=False).items():
    print(f"    {m[0]:30s}: {m[1]:.2f}")

# ══════════════════════════════════════════════════════════════════════════════
# H3: Screen time → Life satisfaction
# ══════════════════════════════════════════════════════════════════════════════
print("\n[H3] Screen time → Life satisfaction")
r3, p3 = stats.pearsonr(df["screen_time_hours"], df["life_satisfaction"])
r3b, p3b = stats.pearsonr(df["screen_time_hours"], df["stress_level"])
print(f"  Screen vs Life Satisfaction: r = {r3:.3f}, p = {p3:.4f}")
print(f"  Screen vs Stress:            r = {r3b:.3f}, p = {p3b:.4f}")

fig4 = make_subplots(rows=1, cols=2,
    subplot_titles=["Screen Time vs Life Satisfaction", "Screen Time vs Stress Level"])
fig4.add_trace(go.Scatter(x=df["screen_time_hours"], y=df["life_satisfaction"],
    mode="markers", marker=dict(color=PASTEL[0], opacity=0.5, size=6), name="Life Sat"),
    row=1, col=1)
fig4.add_trace(go.Scatter(x=df["screen_time_hours"], y=df["stress_level"],
    mode="markers", marker=dict(color=PASTEL[1], opacity=0.5, size=6), name="Stress"),
    row=1, col=2)
m1, b1 = np.polyfit(df["screen_time_hours"], df["life_satisfaction"], 1)
m2, b2 = np.polyfit(df["screen_time_hours"], df["stress_level"], 1)
x_range = np.linspace(df["screen_time_hours"].min(), df["screen_time_hours"].max(), 100)
fig4.add_trace(go.Scatter(x=x_range, y=m1*x_range+b1, mode="lines",
    line=dict(color="#4A4A4A", dash="dash"), name="Trend"), row=1, col=1)
fig4.add_trace(go.Scatter(x=x_range, y=m2*x_range+b2, mode="lines",
    line=dict(color="#4A4A4A", dash="dash"), name="Trend"), row=1, col=2)
fig4.update_layout(**LAYOUT, title="H3 Preview: Screen Time vs Wellness Outcomes", showlegend=False)
fig4.update_xaxes(title_text="Screen Time (hrs)", row=1, col=1)
fig4.update_xaxes(title_text="Screen Time (hrs)", row=1, col=2)
fig4.update_yaxes(title_text="Life Satisfaction", row=1, col=1)
fig4.update_yaxes(title_text="Stress Level", row=1, col=2)
save_fig(fig4, "preview_h3_screen_wellness.png")

# ══════════════════════════════════════════════════════════════════════════════
# H4: Part-time job → Study hours & GPA
# ══════════════════════════════════════════════════════════════════════════════
print("\n[H4] Part-time job → Study hours & GPA")
job_yes = df[df["has_part_time_job"] == "Yes"]
job_no  = df[df["has_part_time_job"] == "No"]
print(f"  Study hrs (job):    {job_yes['study_hours_per_day'].mean():.2f}")
print(f"  Study hrs (no job): {job_no['study_hours_per_day'].mean():.2f}")
print(f"  GPA (job):          {job_yes['gpa'].mean():.3f}")
print(f"  GPA (no job):       {job_no['gpa'].mean():.3f}")

fig5 = make_subplots(rows=1, cols=2, subplot_titles=["Study Hours by Job Status", "GPA by Job Status"])
for i, col in enumerate(["study_hours_per_day", "gpa"]):
    for j, (status, color) in enumerate([("Yes", PASTEL[1]), ("No", PASTEL[0])]):
        vals = df[df["has_part_time_job"] == status][col]
        fig5.add_trace(go.Box(y=vals, name=f"Job: {status}", marker_color=color,
                              boxpoints="outliers", showlegend=(i==0)), row=1, col=i+1)
fig5.update_layout(**LAYOUT, title="H4 Preview: Part-Time Job vs Academic Variables",
                   legend=dict(x=0.45, y=0.95))
save_fig(fig5, "preview_h4_job_study_gpa.png")

# ══════════════════════════════════════════════════════════════════════════════
# H5: Year in school → Anxiety score
# ══════════════════════════════════════════════════════════════════════════════
print("\n[H5] Year in school → Anxiety score")
year_anxiety = df.groupby("year_label")["anxiety_score"].mean()
print(f"  Anxiety by year:\n{year_anxiety.to_string()}")

fig6 = px.box(df, x="year_label", y="anxiety_score",
              color="year_label", color_discrete_sequence=PASTEL,
              category_orders={"year_label": ["1st", "2nd", "3rd", "4th"]},
              labels={"year_label": "Year in School", "anxiety_score": "Anxiety Score (GAD-7)"},
              title="H5 Preview: Anxiety Score by Academic Year")
fig6.update_layout(**LAYOUT, showlegend=False)
save_fig(fig6, "preview_h5_anxiety_by_year.png")

print(f"\n{'='*60}")
print("BIVARIATE PREVIEW COMPLETE")
print(f"5 hypothesis previews generated → {FIGS}")
print(f"{'='*60}")
print("\nRecommendation for Phase 3 (select 3):")
print("  H1 (sleep→GPA):        r =", round(r, 3), "— clean signal, policy-relevant")
print("  H2 (STEM→stress):      t =", round(t, 3), "— strong STEM/non-STEM contrast")
print("  H3 (screen→wellness):  r =", round(r3, 3), "— moderate effect, nuanced story")

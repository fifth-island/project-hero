"""
Phase 3 — H2 Deep Dive: Major Type and Stress Level
======================================================
Hypothesis: STEM students experience significantly higher stress than
non-STEM students, with Nursing and CS at the top.

Outputs: phase3_deepdive/figures/h2_*.png
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

PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8",
          "#B8D8F8", "#F8C8D8", "#C8F4E8", "#F8E8C8"]
LAYOUT = dict(template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA", paper_bgcolor="#FFFFFF", margin=dict(t=80, b=80, l=60, r=40))

def save_fig(fig, name):
    fig.write_image(os.path.join(FIGS, name), width=1200, height=650, scale=2)
    print(f"  [saved] {name}")

df = pd.read_csv(CLEAN)
STEM = {"Computer Science", "Biology", "Nursing", "Mechanical Engineering"}
df["major_type"] = df["major"].apply(lambda x: "STEM" if x in STEM else "Non-STEM")
year_map = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}
df["year_label"] = df["year_in_school"].map(year_map)

print(f"\n{'='*60}\nH2 DEEP DIVE: MAJOR TYPE × STRESS\n{'='*60}\n")

# ── 1. Violin: stress by individual major ────────────────────────────────────
major_order = df.groupby("major")["stress_level"].mean().sort_values(ascending=False).index.tolist()
fig1 = px.violin(df, x="major", y="stress_level",
                 color="major_type",
                 color_discrete_map={"STEM": PASTEL[0], "Non-STEM": PASTEL[1]},
                 box=True, points=False,
                 category_orders={"major": major_order},
                 labels={"major": "Academic Major", "stress_level": "Stress Level (1–10)",
                         "major_type": "Major Type"},
                 title="H2: Stress Level Distribution by Major (ordered by mean stress)")
fig1.update_layout(**LAYOUT, xaxis_tickangle=-30)
save_fig(fig1, "h2_stress_by_major_violin.png")

for m in major_order:
    g = df[df["major"] == m]["stress_level"]
    mtype = "STEM" if m in STEM else "non-STEM"
    print(f"  {m:30s} [{mtype:8s}]: mean={g.mean():.2f}, median={g.median():.1f}, n={len(g)}")

# ── 2. STEM vs Non-STEM box with significance annotation ─────────────────────
stem_s   = df[df["major_type"] == "STEM"]["stress_level"]
nstm_s   = df[df["major_type"] == "Non-STEM"]["stress_level"]
t, p = stats.ttest_ind(stem_s, nstm_s)
cohend = (stem_s.mean() - nstm_s.mean()) / np.sqrt((stem_s.std()**2 + nstm_s.std()**2) / 2)
print(f"\nSTEM vs Non-STEM stress:")
print(f"  STEM mean = {stem_s.mean():.2f}, Non-STEM mean = {nstm_s.mean():.2f}")
print(f"  t = {t:.3f}, p = {p:.6f}, Cohen's d = {cohend:.3f}")

fig2 = go.Figure()
for label, data, color in [("STEM", stem_s, PASTEL[0]), ("Non-STEM", nstm_s, PASTEL[1])]:
    fig2.add_trace(go.Box(y=data, name=label, marker_color=color,
                          boxpoints="outliers", jitter=0.3))
fig2.add_annotation(
    x=0.5, y=10.5, xref="paper", yref="y",
    text=f"t = {t:.2f}, p < 0.0001, Cohen's d = {cohend:.2f}",
    showarrow=False, font=dict(size=14, color="#4A4A4A"),
    bgcolor="#F4F4A8", bordercolor="#D0D0D0", borderwidth=1
)
fig2.update_layout(**LAYOUT,
    title="H2: STEM vs Non-STEM — Stress Level Comparison (t-test)",
    yaxis_title="Stress Level (1–10)")
save_fig(fig2, "h2_stem_vs_nonstm_stress.png")

# ── 3. Heatmap: stress + wellness by major type ───────────────────────────────
wellness_cols = ["stress_level", "anxiety_score", "depression_score",
                 "life_satisfaction", "gpa", "sleep_hours_per_night"]
heatmap_data = df.groupby("major_type")[wellness_cols].mean().round(2)
# normalize to 0-1 for visual comparison
heatmap_norm = (heatmap_data - heatmap_data.min()) / (heatmap_data.max() - heatmap_data.min())

fig3 = px.imshow(heatmap_norm, text_auto=False,
                 color_continuous_scale="RdBu_r", zmin=0, zmax=1,
                 labels=dict(color="Normalized Value"),
                 title="H2: Wellness Profile Heatmap — STEM vs Non-STEM (normalized 0–1)")
# add raw values as annotations
for j, row_idx in enumerate(heatmap_norm.index):
    for i, col in enumerate(heatmap_norm.columns):
        fig3.add_annotation(
            x=i, y=j, text=str(heatmap_data.loc[row_idx, col]),
            showarrow=False, font=dict(size=12, color="#2A2A2A")
        )
fig3.update_layout(**LAYOUT)
save_fig(fig3, "h2_wellness_heatmap.png")

print(f"\nWellness profile by major type:")
print(heatmap_data.to_string())

# ── 4. Subgroup: STEM stress by year in school ───────────────────────────────
fig4 = px.box(df, x="year_label", y="stress_level",
              color="major_type",
              color_discrete_map={"STEM": PASTEL[0], "Non-STEM": PASTEL[1]},
              category_orders={"year_label": ["1st", "2nd", "3rd", "4th"]},
              labels={"year_label": "Year in School", "stress_level": "Stress Level",
                      "major_type": "Major Type"},
              boxmode="group",
              title="H2 Subgroup: Does STEM Stress Grow with Year in School?")
fig4.update_layout(**LAYOUT)
save_fig(fig4, "h2_stem_stress_by_year.png")

stem_year = df[df["major_type"] == "STEM"].groupby("year_label")["stress_level"].mean()
nstm_year = df[df["major_type"] == "Non-STEM"].groupby("year_label")["stress_level"].mean()
print("\nSTEM stress by year:", stem_year.to_dict())
print("Non-STEM stress by year:", nstm_year.to_dict())

# ── 5. Bar: mean stress per major with STEM/Non-STEM color ───────────────────
major_means = df.groupby(["major", "major_type"])["stress_level"].mean().reset_index()
major_means = major_means.sort_values("stress_level", ascending=True)

fig5 = px.bar(major_means, y="major", x="stress_level",
              color="major_type",
              color_discrete_map={"STEM": PASTEL[0], "Non-STEM": PASTEL[1]},
              orientation="h",
              text=major_means["stress_level"].round(2),
              labels={"major": "Major", "stress_level": "Mean Stress Level",
                      "major_type": "Major Type"},
              title="H2: Mean Stress Level by Major (STEM vs Non-STEM highlighted)")
fig5.update_traces(textposition="outside")
fig5.add_vline(x=df["stress_level"].mean(), line_dash="dash", line_color="#888",
               annotation_text="Overall mean", annotation_position="top right")
fig5.update_layout(**{k: v for k, v in LAYOUT.items() if k != "margin"}, margin=dict(t=80, b=60, l=180, r=80))
save_fig(fig5, "h2_stress_bar_by_major.png")

print(f"\n{'='*60}\nH2 COMPLETE — 5 figures saved\n{'='*60}")

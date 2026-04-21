"""
Phase 3 — H3 Deep Dive: Screen Time and Wellness
===================================================
Hypothesis: Higher daily screen time is associated with lower life
satisfaction and higher stress, with social media being the key driver.

Outputs: phase3_deepdive/figures/h3_*.png
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

PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8"]
LAYOUT = dict(template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA", paper_bgcolor="#FFFFFF", margin=dict(t=80, b=60, l=60, r=40))

def save_fig(fig, name):
    fig.write_image(os.path.join(FIGS, name), width=1200, height=650, scale=2)
    print(f"  [saved] {name}")

df = pd.read_csv(CLEAN)
df["screen_cat"] = pd.cut(df["screen_time_hours"], bins=[0, 5, 9, 100],
                           labels=["Low (<5hrs)", "Moderate (5–9hrs)", "High (>9hrs)"])
STEM = {"Computer Science", "Biology", "Nursing", "Mechanical Engineering"}
df["major_type"] = df["major"].apply(lambda x: "STEM" if x in STEM else "Non-STEM")

# Wellness composite (inverted stress + life satisfaction + inverted anxiety + inverted depression)
df["wellness_composite"] = (
    (10 - df["stress_level"]) +
    df["life_satisfaction"] +
    (21 - df["anxiety_score"]) / 2.1 +  # scale to ~0-10
    (27 - df["depression_score"]) / 2.7   # scale to ~0-10
) / 4

print(f"\n{'='*60}\nH3 DEEP DIVE: SCREEN TIME × WELLNESS\n{'='*60}\n")

# ── Correlations ──────────────────────────────────────────────────────────────
wellness_vars = ["life_satisfaction", "stress_level", "anxiety_score",
                 "depression_score", "wellness_composite"]
screen_vars   = ["screen_time_hours", "social_media_hours"]

print("Correlations with wellness outcomes:")
print(f"{'Variable':<30} {'Screen Time':>12} {'Social Media':>12}")
for wv in wellness_vars:
    r1, p1 = stats.pearsonr(df["screen_time_hours"], df[wv])
    r2, p2 = stats.pearsonr(df["social_media_hours"], df[wv])
    sig1 = "***" if p1 < 0.001 else ("**" if p1 < 0.01 else ("*" if p1 < 0.05 else ""))
    sig2 = "***" if p2 < 0.001 else ("**" if p2 < 0.01 else ("*" if p2 < 0.05 else ""))
    print(f"  {wv:<30} r={r1:+.3f}{sig1:<3}   r={r2:+.3f}{sig2:<3}")

# ── 1. Scatter: screen time vs life satisfaction ─────────────────────────────
r1, p1 = stats.pearsonr(df["screen_time_hours"], df["life_satisfaction"])
fig1 = px.scatter(df, x="screen_time_hours", y="life_satisfaction",
                  color="major_type",
                  color_discrete_map={"STEM": PASTEL[0], "Non-STEM": PASTEL[1]},
                  trendline="ols", opacity=0.6,
                  labels={"screen_time_hours": "Daily Screen Time (hrs)",
                          "life_satisfaction": "Life Satisfaction (1–10)",
                          "major_type": "Major Type"},
                  title=f"H3: Screen Time vs Life Satisfaction (r={r1:.2f}, p={p1:.4f})")
fig1.update_layout(**LAYOUT)
save_fig(fig1, "h3_screen_life_satisfaction.png")

# ── 2. Scatter: social media vs life satisfaction (key comparison) ────────────
r2, p2 = stats.pearsonr(df["social_media_hours"], df["life_satisfaction"])
r3, p3 = stats.pearsonr(df["social_media_hours"], df["stress_level"])

fig2 = make_subplots(rows=1, cols=2,
    subplot_titles=[
        f"Total Screen Time → Life Satisfaction (r={r1:.2f})",
        f"Social Media → Life Satisfaction (r={r2:.2f})"
    ])
m1, b1 = np.polyfit(df["screen_time_hours"], df["life_satisfaction"], 1)
m2, b2 = np.polyfit(df["social_media_hours"], df["life_satisfaction"], 1)
x1r = np.linspace(df["screen_time_hours"].min(), df["screen_time_hours"].max(), 100)
x2r = np.linspace(df["social_media_hours"].min(), df["social_media_hours"].max(), 100)

fig2.add_trace(go.Scatter(x=df["screen_time_hours"], y=df["life_satisfaction"],
    mode="markers", marker=dict(color=PASTEL[0], opacity=0.5, size=6), showlegend=False), row=1, col=1)
fig2.add_trace(go.Scatter(x=x1r, y=m1*x1r+b1, mode="lines",
    line=dict(color="#4A4A4A", width=2), showlegend=False), row=1, col=1)
fig2.add_trace(go.Scatter(x=df["social_media_hours"], y=df["life_satisfaction"],
    mode="markers", marker=dict(color=PASTEL[1], opacity=0.5, size=6), showlegend=False), row=1, col=2)
fig2.add_trace(go.Scatter(x=x2r, y=m2*x2r+b2, mode="lines",
    line=dict(color="#4A4A4A", width=2), showlegend=False), row=1, col=2)
fig2.update_xaxes(title_text="Total Screen Time (hrs)", row=1, col=1)
fig2.update_xaxes(title_text="Social Media Hours", row=1, col=2)
fig2.update_yaxes(title_text="Life Satisfaction", row=1, col=1)
fig2.update_layout(**LAYOUT, title="H3: Is Social Media the Key Driver? Comparing Effect Sizes")
save_fig(fig2, "h3_screen_vs_social_media_comparison.png")

print(f"\nEffect size comparison:")
print(f"  Total screen → life sat:  r = {r1:.3f}")
print(f"  Social media → life sat:  r = {r2:.3f}")
print(f"  Social media → stress:    r = {r3:.3f}")

# ── 3. Wellness by screen time category ──────────────────────────────────────
screen_cat_order = ["Low (<5hrs)", "Moderate (5–9hrs)", "High (>9hrs)"]
wellness_by_screen = df.groupby("screen_cat")[
    ["life_satisfaction", "stress_level", "anxiety_score", "wellness_composite"]
].mean().round(2)
print(f"\nWellness by screen time category:")
print(wellness_by_screen.to_string())

fig3 = make_subplots(rows=2, cols=2,
    subplot_titles=["Life Satisfaction", "Stress Level", "Anxiety Score", "Wellness Composite"])
metrics = ["life_satisfaction", "stress_level", "anxiety_score", "wellness_composite"]
positions = [(1,1), (1,2), (2,1), (2,2)]
for metric, (r, c) in zip(metrics, positions):
    vals = [df[df["screen_cat"] == cat][metric].mean() for cat in screen_cat_order]
    fig3.add_trace(go.Bar(x=screen_cat_order, y=vals,
        marker_color=PASTEL[:3], text=[f"{v:.2f}" for v in vals],
        textposition="outside", showlegend=False), row=r, col=c)
fig3.update_layout(**LAYOUT, title="H3: Wellness Outcomes by Screen Time Category",
                   height=800)
save_fig(fig3, "h3_wellness_by_screen_cat.png")

# ── 4. Correlation heatmap: all screen/social vs wellness ─────────────────────
all_vars = screen_vars + wellness_vars
corr_matrix = df[all_vars].corr()
fig4 = px.imshow(corr_matrix.loc[screen_vars, wellness_vars].round(2),
                 text_auto=".2f",
                 color_continuous_scale="RdBu", zmin=-0.5, zmax=0.5,
                 title="H3: Correlation Heatmap — Screen Variables × Wellness Outcomes")
fig4.update_layout(**LAYOUT)
save_fig(fig4, "h3_correlation_heatmap.png")

# ── 5. Advanced: screen time + sleep interaction on wellness ─────────────────
df["sleep_deprived"] = (df["sleep_hours_per_night"] < 6.5).map({True: "Sleep < 6.5hrs", False: "Sleep ≥ 6.5hrs"})

fig5 = px.scatter(df, x="screen_time_hours", y="wellness_composite",
                  color="sleep_deprived",
                  color_discrete_map={"Sleep < 6.5hrs": PASTEL[1], "Sleep ≥ 6.5hrs": PASTEL[2]},
                  trendline="ols", opacity=0.6,
                  facet_col="sleep_deprived",
                  labels={"screen_time_hours": "Screen Time (hrs)",
                          "wellness_composite": "Wellness Composite Score",
                          "sleep_deprived": "Sleep Status"},
                  title="H3 Advanced: Screen Time × Sleep Deprivation → Wellness Composite")
fig5.update_layout(**LAYOUT)
save_fig(fig5, "h3_screen_sleep_wellness_interaction.png")

# compute within-group correlations
for label in ["Sleep < 6.5hrs", "Sleep ≥ 6.5hrs"]:
    sub = df[df["sleep_deprived"] == label]
    r, p = stats.pearsonr(sub["screen_time_hours"], sub["wellness_composite"])
    print(f"  {label}: screen→wellness r = {r:.3f} (p={p:.4f}, n={len(sub)})")

print(f"\n{'='*60}\nH3 COMPLETE — 5 figures saved\n{'='*60}")

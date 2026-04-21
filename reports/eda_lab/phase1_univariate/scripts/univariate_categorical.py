"""
Phase 1 — Univariate Analysis: Categorical Columns
====================================================
Produces bar charts for each categorical column, sorted by frequency.
Prints value counts and % breakdown.

Outputs: phase1_univariate/figures/[col]_bar.png
"""

import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

BASE  = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab"
CLEAN = os.path.join(BASE, "dataset", "student_wellness_clean.csv")
FIGS  = os.path.join(BASE, "phase1_univariate", "figures")
os.makedirs(FIGS, exist_ok=True)

PASTEL = ["#A8C8E8", "#F4A8B0", "#A8E8C8", "#F4D8A8", "#C8A8E8", "#F4F4A8", "#B8D8F8", "#F8C8D8"]
LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Inter, Arial, sans-serif", size=13, color="#4A4A4A"),
    plot_bgcolor="#FAFAFA", paper_bgcolor="#FFFFFF",
    margin=dict(t=80, b=100, l=60, r=40),
)

def save_fig(fig, name):
    fig.write_image(os.path.join(FIGS, name), width=1200, height=600, scale=2)
    print(f"  [saved] {name}")

df = pd.read_csv(CLEAN)
# on_campus to string for display
df["on_campus_str"] = df["on_campus"].map({True: "On Campus", False: "Off Campus"})

CAT_COLS = [
    ("gender",          "Gender Identity"),
    ("major",           "Academic Major"),
    ("year_in_school",  "Year in School"),
    ("has_part_time_job", "Has Part-Time Job"),
    ("on_campus_str",   "Living Situation (On/Off Campus)"),
]

print(f"\n{'='*60}")
print("PHASE 1 — UNIVARIATE ANALYSIS: CATEGORICAL COLUMNS")
print(f"{'='*60}\n")

for col, label in CAT_COLS:
    counts = df[col].astype(str).value_counts().reset_index()
    counts.columns = ["value", "count"]
    counts["pct"] = (counts["count"] / counts["count"].sum() * 100).round(1)

    print(f"\n[{col}]")
    for _, row in counts.iterrows():
        print(f"  {row['value']:30s}  {row['count']:4d}  ({row['pct']:.1f}%)")

    # sort by count descending
    counts = counts.sort_values("count", ascending=False)

    fig = go.Figure()
    for i, (_, row) in enumerate(counts.iterrows()):
        fig.add_trace(go.Bar(
            x=[row["value"]], y=[row["count"]],
            name=str(row["value"]),
            marker_color=PASTEL[i % len(PASTEL)],
            text=f"{row['count']} ({row['pct']}%)",
            textposition="outside",
            showlegend=False,
        ))

    fig.update_layout(**LAYOUT,
        title=f"{label} — Frequency Distribution",
        xaxis_title=label,
        yaxis_title="Number of Students",
        xaxis=dict(categoryorder="total descending"),
    )
    fname = col.replace("_str", "") + "_bar.png"
    save_fig(fig, fname)

# ── Special: year_in_school with labels ──────────────────────────────────────
year_map = {1: "1st Year (Freshman)", 2: "2nd Year (Sophomore)",
            3: "3rd Year (Junior)", 4: "4th Year (Senior)"}
df["year_label"] = df["year_in_school"].map(year_map)
year_counts = df["year_label"].value_counts().reset_index()
year_counts.columns = ["year", "count"]
year_counts["pct"] = (year_counts["count"] / year_counts["count"].sum() * 100).round(1)
year_order = ["1st Year (Freshman)", "2nd Year (Sophomore)", "3rd Year (Junior)", "4th Year (Senior)"]

fig = px.bar(year_counts, x="year", y="count",
             color="year", color_discrete_sequence=PASTEL,
             text=year_counts["count"].astype(str) + "<br>(" + year_counts["pct"].astype(str) + "%)",
             category_orders={"year": year_order},
             labels={"year": "Academic Year", "count": "Number of Students"})
fig.update_traces(textposition="outside", showlegend=False)
fig.update_layout(**LAYOUT, title="Distribution by Academic Year")
fig.write_image(os.path.join(FIGS, "year_in_school_labeled_bar.png"), width=1200, height=600, scale=2)
print(f"  [saved] year_in_school_labeled_bar.png")

print(f"\n{'='*60}")
print("CATEGORICAL UNIVARIATE COMPLETE")
print(f"Figures saved to: {FIGS}")
print(f"{'='*60}")

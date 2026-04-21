# Phase 5 — Dashboard Design Brief

**Tool:** Google Stitch (AI Design Generator)  
**Style:** Microsoft PowerBI  
**Date:** 2026-04-11  
**Three dashboards to design — one per hypothesis**

---

## Dashboard 1: H2 — "The Cost of STEM"

**Title:** The STEM Wellness Gap: What the Data Shows  
**Audience:** University administrators, department heads, student affairs directors  
**Key message:** STEM students pay a significantly higher psychological cost for the same academic outcomes as non-STEM peers. This gap is real, large, and persistent across all four years.

### Required Elements
- **KPI cards (top row):** STEM mean stress (6.16), Non-STEM mean stress (4.91), Stress gap (+1.25), Cohen's d (0.648)
- **Main chart:** Horizontal bar chart showing mean stress by major (10 bars, colored STEM blue/Non-STEM rose, with overall mean dashed line)
- **Supporting chart 1:** Grouped box plot — Stress by year in school, split STEM vs. non-STEM
- **Supporting chart 2:** Wellness heatmap — 2×5 grid (STEM/Non-STEM × stress/anxiety/depression/life-sat/sleep)
- **Insight callout:** Bold dark card: "STEM students experience 26% more stress per GPA point achieved — yet reach the same average GPA of 3.07"
- **Filters:** Major (multi-select), Year in School (toggle), Gender (dropdown)
- **Footnote:** n=532 students | Survey data | Spring 2025

---

## Dashboard 2: H3 — "The Screen Time Penalty"

**Title:** Digital Habits & Student Wellness: A Data Story  
**Audience:** Student wellness counselors, students themselves, health education teams  
**Key message:** More screen time consistently predicts worse wellness outcomes — and it's not just social media. Total screen consumption is the relevant behavior.

### Required Elements
- **KPI cards:** Avg screen time (7.56 hrs), Avg social media (2.55 hrs), % high screen users >9hrs, life satisfaction gap (low vs high screen: 2.18 pts)
- **Main chart:** Side-by-side grouped bar — 4 wellness metrics (life sat, stress, anxiety, wellness composite) by 3 screen time categories (Low/Moderate/High), pastel colors
- **Supporting chart 1:** Dual scatter — screen time vs life satisfaction (left), screen time vs stress (right), with OLS trendlines
- **Supporting chart 2:** Correlation matrix heatmap — screen time + social media vs all 5 wellness outcomes
- **Insight callout:** "Students with >9hrs daily screen time report 2.18 points lower life satisfaction and 2.27 points higher stress than students with <5hrs — a clinically meaningful gap"
- **Filters:** Major type (STEM/Non-STEM toggle), Year in school (toggle), Sleep status (below 6.5hrs / above 6.5hrs)
- **Footnote:** n=532 | All correlations significant at p<0.001

---

## Dashboard 3: H1 — "The Study Matters More"

**Title:** Sleep, Study & GPA: What Actually Predicts Academic Performance?  
**Audience:** Students, academic advisors, faculty  
**Key message:** Study hours (not sleep) is the dominant GPA predictor. Within any study intensity group, getting more sleep makes almost no GPA difference.

### Required Elements
- **KPI cards:** Avg GPA (3.07), Avg study hrs (6.88), Study→GPA correlation (r=0.47), Sleep→GPA correlation (r=-0.06)
- **Main chart:** Side-by-side scatter — study hrs vs GPA (left, strong trend), sleep hrs vs GPA (right, flat), clear trendlines, with r annotated
- **Supporting chart 1:** Grouped box plot — GPA by sleep category (< 6hrs, 6–7hrs, ≥ 7hrs) × study intensity (3 groups) — 3×3 small multiples or grouped
- **Supporting chart 2:** Single bold bar or gauge: "Within the same study intensity group, extra sleep changes GPA by less than 0.04 points"
- **Insight callout:** "For students who already study 8+ hours per day, additional sleep does not meaningfully raise GPA. The study-to-performance link is the actionable lever."
- **Important nuance note:** Small text panel: "This does not mean sleep is unimportant — sleep affects wellness. This finding is specific to GPA."
- **Filters:** Major type, Year in school, Study intensity category

# Phase 5 — Google Stitch Prompts

> Paste these prompts into Google Stitch (stitch.withgoogle.com) one at a time.
> After each generation: screenshot the result, save it to this folder, and note any refinement prompts used.

---

## Prompt 1 — Dashboard: "The Cost of STEM" (H2)

```
Design a professional data analytics dashboard in the exact style of Microsoft PowerBI for a university wellness report.

AUDIENCE: University administrators and student affairs directors
KEY MESSAGE: STEM students pay a 26% higher psychological cost (in stress) for the same average GPA as non-STEM peers.
DASHBOARD TITLE: "The STEM Wellness Gap: What the Data Shows"
SUBTITLE: "532 college students | Stress, Anxiety, Depression & Life Satisfaction | Spring 2025"

LAYOUT (1440×900px, desktop):
- Header bar (full width): white background, dark navy title text (#1A3A5C), university logo placeholder (top left), "Last updated: April 2025" (top right)
- Row 1: 4 KPI metric cards, horizontal, full width, with drop shadow
  Card 1: "STEM Stress" — value "6.16 / 10" — label below in gray — soft blue background (#A8C8E8)
  Card 2: "Non-STEM Stress" — value "4.91 / 10" — soft rose (#F4A8B0)
  Card 3: "Stress Gap" — value "+1.25 pts" — mint (#A8E8C8) — with up arrow icon
  Card 4: "Effect Size" — value "Cohen's d = 0.65 (Medium-Large)" — peach (#F4D8A8)
- Row 2 (main content, 70/30 split):
  LEFT (70%): Horizontal bar chart — Mean stress level by major (10 bars), sorted highest to lowest
    - STEM bars: color #A8C8E8 (soft blue)
    - Non-STEM bars: color #F4A8B0 (soft rose)
    - Dashed vertical line at "Overall Mean: 5.43"
    - Bar labels showing exact stress value (e.g., "6.67") at bar end
    - Axis: 0–10, clean white gridlines
    - Title: "Stress Level by Academic Major"
  RIGHT (30%): Insight callout panel — dark navy card (#1A3A5C) with white text
    - Large bold number: "26%"
    - Below: "more stress per GPA point in STEM vs. Non-STEM"
    - Separator line
    - Bullet points (white, 13px):
      • "Same mean GPA: 3.07 for both groups"
      • "Highest stress: Nursing (6.67/10)"
      • "Gap appears in Year 2 and persists"
    - Background: #1A3A5C
- Row 3 (50/50 split):
  LEFT: Grouped box plot — Stress by academic year (1st/2nd/3rd/4th), STEM vs Non-STEM side by side, colors #A8C8E8 and #F4A8B0
    - Title: "Does STEM Stress Grow with Year in School?"
  RIGHT: Wellness heatmap — 2×5 grid (rows: STEM, Non-STEM; columns: Stress, Anxiety, Depression, Life Satisfaction, Sleep)
    - Color scale: light mint (better) → light rose (worse)
    - Show raw values in each cell (e.g., "6.16", "4.91")
    - Title: "Wellness Profile Comparison"
- Row 4: Filter bar (full width, horizontal)
  - Major (multi-select dropdown with search): label "Filter by Major"
  - Year in School (horizontal toggle buttons: 1st | 2nd | 3rd | 4th | All)
  - Gender (dropdown: All / Male / Female / Non-binary)
  - Clear Filters button (right side, outlined style)
- Footer: "Data: Student Wellness Survey, n=532 | All differences significant at p<0.0001 | Cohen's d=0.648"

STYLING:
- Background: #FFFFFF (white)
- Card backgrounds: pastel colors as specified
- Font: Segoe UI or Inter
- Title font size: 18px bold, section headers 14px bold, body 12px
- Chart gridlines: #F0F0F0 (very light gray)
- No dark backgrounds except the insight panel
- All chart elements have rounded corners (4px radius)
- Cards: 8px border radius, shadow 0 2px 12px rgba(0,0,0,0.08)

INTERACTIVITY LABELS (mark these in the design):
- "Click any major bar to filter all charts"
- "Year toggles filter all charts"
- "Hover for detailed breakdown"
```

---

## Prompt 2 — Dashboard: "The Screen Time Penalty" (H3)

```
Design a student-facing wellness dashboard in Microsoft PowerBI style — clean, engaging, and immediately understandable for a non-technical college student audience.

DASHBOARD TITLE: "Your Screen Time & Your Wellbeing: What the Data Says"
SUBTITLE: "Based on 532 college students | How digital habits connect to life satisfaction and stress"
KEY MESSAGE: Students with >9 hours of screen time per day report 2+ points lower life satisfaction and 2+ points higher stress than students with less than 5 hours.

LAYOUT (1440×900px, desktop):
- Header: White background, soft blue accent bar on left edge (6px), title in dark gray (#4A4A4A), university wellness center logo placeholder
- Row 1: 4 KPI cards (horizontal strip)
  Card 1: "Avg Daily Screen Time" — "7.56 hours" — icon: phone — soft blue (#A8C8E8)
  Card 2: "Avg Social Media" — "2.55 hours" — icon: message bubble — lavender (#C8A8E8)
  Card 3: "Life Satisfaction Gap" — "2.18 points lower" — subtitle: "High vs Low screen users" — rose (#F4A8B0)
  Card 4: "Stress Correlation" — "r = +0.305" — subtitle: "Screen time → Stress (p<0.001)" — peach (#F4D8A8)
- Row 2 (60/40 split):
  LEFT (60%): Grouped bar chart — 4 wellness metrics (Life Satisfaction, Stress, Anxiety, Wellness Score) shown as grouped bars for 3 screen categories
    - Groups: "Low (<5hrs)" [color: #A8E8C8 mint], "Moderate (5–9hrs)" [#A8C8E8 blue], "High (>9hrs)" [#F4A8B0 rose]
    - Y-axis: 0–10
    - Show values on top of each bar
    - Title: "Wellness Outcomes by Daily Screen Time"
    - Add annotation arrow pointing to "High" Stress bar: "⚠ Highest stress group"
  RIGHT (40%): Two small scatter plots stacked vertically
    - Top: Screen Time (x) vs Life Satisfaction (y) — pastel blue dots, OLS trend line — "r = -0.255***"
    - Bottom: Screen Time (x) vs Stress (y) — pastel rose dots, OLS trend line — "r = +0.305***"
    - Title above both: "Is More Screen Time → Lower Wellbeing?"
- Row 3 (50/50 split):
  LEFT: Heatmap — rows: [Total Screen, Social Media]; columns: [Life Sat, Stress, Anxiety, Depression, Wellness Score]
    - Cell values: Pearson r (e.g., "-0.255")
    - Color: blue = positive r, rose = negative r (diverging)
    - Title: "Which Screen Variable Matters More?"
    - Annotation: "Total screen time predicts wellness better than social media alone"
  RIGHT: Bold insight card — white background with navy border
    - Header: "The Social Media Myth"
    - Body text: "While social media does negatively correlate with wellbeing (r = -0.158), total screen time is a stronger predictor (r = -0.255). All passive screen consumption — streaming, gaming, browsing — contributes to the wellness gap."
    - CTA button (outlined navy): "See the Full Study"
- Row 4: Horizontal filter bar
  - Sleep Status toggle: "Well-rested (≥6.5hrs) | Sleep-deprived (<6.5hrs) | All"
  - Major Type toggle: "STEM | Non-STEM | All"
  - Year in School (dropdown)
  - Screen Category (multi-select: Low / Moderate / High)
- Footer: "r values are Pearson correlations | All *** p<0.001, ** p<0.01, * p<0.05 | n=532"

STYLING:
- Pastel palette throughout: #A8C8E8, #F4A8B0, #A8E8C8, #F4D8A8, #C8A8E8
- Background: #FAFAFA (near white)
- Font: Inter or Segoe UI, 13px body
- Rounded corners: 8px cards, 4px chart elements
- No harsh colors — keep everything soft and approachable for student audience
```

---

## Prompt 3 — Dashboard: "Study vs Sleep: The GPA Debate" (H1)

```
Design a clean, minimal data insight dashboard in Microsoft PowerBI style for academic advisors and students.

DASHBOARD TITLE: "What Actually Predicts Your GPA? Study Hours vs Sleep Hours"
SUBTITLE: "Findings from 532 college students | Spoiler: it's not what you might think"
KEY MESSAGE: Study hours (r=+0.47) — not sleep hours (r=-0.06) — is the dominant predictor of GPA. Within any study intensity group, additional sleep changes GPA by less than 0.04 points.

LAYOUT (1440×900px, desktop):
- Header: White, clean; title bold dark navy; right side: "This does NOT mean sleep is unimportant — see the wellness dashboard" in italic gray
- Row 1: 4 KPI cards
  Card 1: "Study → GPA Correlation" — "r = +0.47" — label: "Strong & Significant (p<0.001)" — color: #A8E8C8 mint (positive)
  Card 2: "Sleep → GPA Correlation" — "r = -0.06" — label: "Not Significant (p=0.16)" — color: #F4D8A8 peach (neutral/warning)
  Card 3: "Average GPA" — "3.07" — color: #A8C8E8 blue
  Card 4: "Sleep Impact Within Study Groups" — "<0.04 GPA points" — label: "Controlling for study intensity" — color: #F4A8B0 rose
- Row 2 (60/40 split — the hero comparison):
  LEFT (60%): Side-by-side scatter plots in one panel
    - Left scatter: Study Hours per Day (x) vs GPA (y) — mint dots (#A8E8C8), OLS line, annotation: "r = +0.47 ✓"
    - Right scatter: Sleep Hours per Night (x) vs GPA (y) — peach dots (#F4D8A8), flat OLS line, annotation: "r = -0.06 ✗"
    - Dividing label between the two: "vs"
    - Title: "Which Behavior Actually Predicts GPA?"
  RIGHT (40%): Vertical stacked insight cards
    - Card A (green/mint): "High Studiers (>8hrs/day): avg GPA 3.29 — regardless of sleep"
    - Card B (peach): "Low Studiers (<5hrs/day): avg GPA 2.70 — regardless of sleep"
    - Card C (blue, bold): "The gap between low and high studiers: +0.59 GPA points"
    - Small footnote under cards: "Sleep contributes <0.04 GPA points within any study group"
- Row 3 (full width): Grouped box plot — GPA by sleep category (< 6hrs | 6–7hrs | ≥ 7hrs) × study intensity (Low / Moderate / High)
  - Layout: 3 study intensity groups as column sections, each showing 3 sleep category boxes
  - Colors per sleep category: rose (<6hrs), blue (6–7hrs), mint (≥7hrs)
  - Title: "GPA by Sleep Category — Controlled for Study Intensity"
  - Annotation: "Within each study group, sleep makes <0.04 GPA difference"
  - Show means on each box
- Row 4: Filter bar
  - Major (dropdown with search)
  - Year in School (toggle: 1st | 2nd | 3rd | 4th | All)
  - Major Type (STEM / Non-STEM / All)
- Nuance panel (bottom, full width, light background): 
  - Heading: "Important Context"
  - Text (small, 12px): "This finding applies to GPA only. Sleep significantly affects stress, anxiety, and overall wellbeing (see the Wellness Dashboard). The message is not 'sleep less' — it's 'studying consistently is the most direct path to academic performance in this dataset.'"
  - Color: light yellow background (#FFFDE8), border-left: 4px solid #F4D8A8

STYLING:
- Pastel palette: #A8C8E8, #F4A8B0, #A8E8C8, #F4D8A8
- Font: Segoe UI, clean spacing
- Minimal chart borders — white background, faint gridlines
- All key numbers: 24px bold, descriptions: 12px regular gray
```

---

## Refinement Prompts (Use After First Generation)

**If the layout needs restructuring:**
```
Keep the same content and data but reorganize the layout: move the filter bar to the right side as a collapsible vertical panel (280px wide). The main content area should expand to fill the freed space. The filter panel should have a toggle button (hamburger icon) to show/hide it.
```

**If the KPI cards need better visual hierarchy:**
```
Redesign the KPI cards: make the primary metric number larger (40px, ExtraBold), the label smaller (11px, gray), and add a subtle trend arrow icon below the number (↑ for positive, ↓ for negative). The card should have a thin 2px left border in the accent color instead of a full background fill.
```

**If the insight callouts need more impact:**
```
Transform the insight panel into a "Key Finding" story card: full-width banner below the main charts, dark navy background (#1A3A5C), white text, with the main finding in 24px bold on the left, a simple illustrative icon in the center, and 3 bullet points of supporting evidence on the right. Add a soft bottom border gradient.
```

**If charts need annotations:**
```
Add data annotations to the bar chart: for each bar, add a small callout label at the bar tip showing the value. For STEM bars, add a small "STEM" pill badge in soft blue. For the highest and lowest bars, add a small tooltip-style bubble with an insight: "Highest: Nursing 6.67" and "Lowest: Economics 4.81".
```

**To simplify for student audience:**
```
Redesign this dashboard for a student (not administrator) audience. Remove all statistical notation (p-values, Cohen's d, r values). Replace them with plain-language callouts: instead of "r = -0.255", write "Students who scroll more, report feeling worse". Keep only the 2 most important charts. Make the key finding the single largest visual element on the page.
```

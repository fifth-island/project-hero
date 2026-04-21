# Skill: Phase 5 — Dashboard Design with Google Stitch (AI Designer)

## Purpose
Your analysis is complete. Now you turn findings into a dashboard that communicates insights to a non-technical audience. You will use **Google Stitch** (AI design tool) to generate a PowerBI-style dashboard layout from your research reports. The critical skill here is learning how to give an AI designer enough context and structure to produce something useful — not just beautiful, but analytically meaningful.

## When to Use This Skill
After Phase 4 is complete. You have 3 research reports with figures and conclusions.

## Inputs Required
- `phase4_reports/h1_sleep_gpa/report.md`
- `phase4_reports/h2_stress_major/report.md`
- `phase4_reports/h3_screen_wellness/report.md`
- `context/context.md` — the full accumulated context
- Selected figures from all phases

## Outputs Produced
- `phase5_dashboard/stitch_prompts.md` — the prompts you used in Stitch
- `phase5_dashboard/dashboard_brief.md` — design brief (what the dashboard must communicate)
- `phase5_dashboard/[dashboard_name].png` or `.svg` — the Stitch-generated design (you add this)
- Updated `context/context.md` with Phase 5 summary

---

## Understanding the Two Approaches

### Approach A — Full Report Dump
Feed Stitch the entire content of one or more phase reports. Let the AI decide what to highlight.
- **Pro:** Less work, might surface unexpected layout choices
- **Con:** AI may emphasize the wrong things, miss your key finding
- **Best for:** Getting a first draft quickly, then refining

### Approach B — Curated Brief
Select 2–4 specific charts and write a tight brief telling Stitch exactly what the dashboard must communicate.
- **Pro:** More control, usually better quality
- **Con:** Requires you to know what matters most
- **Best for:** Final deliverable quality

**Recommendation:** Try Approach A first for inspiration, then use Approach B for the final version.

---

## Step-by-Step Workflow

### Step 1 — Write the Dashboard Brief (with the agent)
```
Help me write a dashboard design brief for a PowerBI-style dashboard summarizing our H1 findings (sleep vs. GPA). The brief should specify:
- Who the audience is (students, university administrators, counselors)
- What the 1–2 key insights are that must be immediately visible
- What filters or slicers should exist (by major, by year, by gender)
- What types of charts to include and why
- What callouts or annotations are needed
- What action the viewer should take after seeing this dashboard
Save this brief to phase5_dashboard/dashboard_brief.md.
```

### Step 2 — Generate the Stitch Prompts
Use the prompts below as templates and customize for your specific findings.

**Prompt Template A (Full Report Dump):**
```
[Paste into Google Stitch]

Design a data dashboard in Microsoft PowerBI style for a university audience. 
The dashboard analyzes the relationship between sleep habits and academic performance among college students.

CONTENT TO VISUALIZE:
[Paste the key sections of your H1 report here — Sections 3, 4, 5, 6, and 8]

DESIGN SPECIFICATIONS:
- Style: Microsoft PowerBI — clean white background, card elements with drop shadows, blue accent tones
- Layout: 3-column grid, 12px gutters, header bar at top with title and last-updated date
- Typography: Segoe UI or Inter, title 20px bold, body 13px regular
- Color palette: Soft/pastel — primary blue #A8C8E8, rose #F4A8B0, mint #A8E8C8, peach #F4D8A8

REQUIRED ELEMENTS:
1. Title bar: "Student Sleep & Academic Performance Dashboard"
2. KPI cards (top row): Average GPA, Average Sleep Hours, % Students Sleeping < 6hrs, % Students with GPA > 3.5
3. Main chart: Scatter plot (Sleep Hours vs GPA) with trend line, colored by Major
4. Supporting chart: Box plot of GPA by Sleep Category (< 6hrs, 6–8hrs, > 8hrs)
5. Filter panel (right sidebar): Slicers for Major, Year in School, Gender, Has Part-Time Job
6. Insight callout box: Bold callout card with key finding ("Students sleeping 7+ hours have GPAs 0.4 points higher on average")
7. Footnote: Data source, sample size, collection period

INTERACTIVITY HINTS (label these in the design):
- All charts respond to slicer selections
- Clicking a Major in the scatter highlights that group
- Hover tooltip on scatter shows: Student ID, GPA, Sleep Hours, Major
```

**Prompt Template B (Curated Brief — Recommended for Final):**
```
[Paste into Google Stitch]

Design a professional data dashboard in the style of Microsoft PowerBI for a university wellness report.

AUDIENCE: University administrators and student counselors (not data scientists — plain language)

KEY MESSAGE TO CONVEY: "Students who sleep fewer than 6 hours per night consistently underperform academically, and this effect is strongest in first-year STEM students."

DASHBOARD TITLE: "Sleep & Academic Performance: What the Data Says"

LAYOUT:
- Full-width header bar (white background, dark blue title text, institution logo placeholder top-left)
- Row 1: 4 KPI metric cards (horizontal, full width)
- Row 2: Main visualization (70% width) + Insight panel (30% width)
- Row 3: Two supporting charts side by side (50/50 split)
- Row 4: Filter row (full width, horizontal slicers)
- Footer: data note + sample size

SPECIFIC CHARTS:
1. [KPI cards] Average GPA | Avg Sleep Hours | % < 6hrs Sleep | Sample Size (n)
2. [Main: scatter] X = Sleep Hours per Night, Y = GPA, color = Year in School, size = Study Hours, trend line shown
3. [Insight panel] Dark card with white text: key finding + one supporting stat + recommendation
4. [Bottom left: violin] GPA distribution split by Sleep Category — three groups: "< 6 hrs", "6–8 hrs", "> 8 hrs"
5. [Bottom right: small multiples or grouped bar] Average GPA by Major for each Sleep Category (faceted)

FILTERS / SLICERS (horizontal bar, below charts):
- Major (multi-select dropdown)
- Year in School (toggle buttons: 1st / 2nd / 3rd / 4th)
- Gender (radio buttons)
- Part-Time Job (toggle: Yes / No)

CALLOUT ANNOTATIONS:
- Arrow pointing to the GPA dip for <6hrs group: "⚠ 23% of students"
- Highlight box around first-year STEM cluster in scatter

STYLE:
- PowerBI white background (#FFFFFF), header #1A3A5C
- Accent colors: pastel blue #A8C8E8, soft rose #F4A8B0
- Card shadows: 0 2px 8px rgba(0,0,0,0.08)
- Charts: thin gridlines (#E8E8E8), minimal axes, Segoe UI font

OUTPUT: Full desktop dashboard layout (1440×900px), all elements labeled
```

### Step 3 — Use Google Stitch
1. Go to Google Stitch (stitch.withgoogle.com)
2. Paste your chosen prompt
3. Review the generated design
4. If it's not quite right, add refinement prompts (examples below)
5. Screenshot or export the result
6. Save to `phase5_dashboard/`

### Step 4 — Refinement Prompts for Stitch
After the first generation, use these to iterate:

```
The layout looks good but the KPI cards need more visual hierarchy. Make the primary metric number larger (36px, bold) and the label smaller (11px, gray). Add a subtle trend indicator arrow next to each number.
```

```
The scatter plot is too small relative to the page. Increase its width to span 80% of the canvas, push the filter panel to the right side as a collapsible sidebar.
```

```
Add a "story" element: a thin horizontal bar below the title that says "Key Finding: Students sleeping 7+ hours score 0.4 GPA points higher | n=412 students | Spring 2025" in italic text.
```

### Step 5 — Critical Reflection
After generating the dashboard, answer these questions:
```
Review the Stitch dashboard output. 
1. Does it immediately communicate the key finding without reading any text?
2. Is the most important chart the most visually prominent?
3. Would a non-data person understand what action to take?
4. What would you change if you had one more iteration?
Write your answers as a reflection in phase5_dashboard/stitch_prompts.md.
```

---

## Key Teaching Points

**The dashboard is an argument, not a gallery.** Every element should serve the key message. If a chart doesn't support the main finding, cut it or move it to a supporting position.

**Filters are for exploration, not the main message.** The main charts should tell the story even without any filters applied. Filters let curious users dig deeper.

**Callouts do the analytical heavy lifting for non-technical readers.** A bold callout card saying "Students sleeping <6hrs have 0.4 lower GPA" communicates more than a scatter plot alone.

**AI design tools need context, not just aesthetics.** The more you tell Stitch about the audience, the key message, and the analytical hierarchy, the better the result. Vague prompts produce generic dashboards.

---

## Common Prompts After Stitch Generation

**To regenerate with a specific fix:**
```
Keep the same layout but change the main chart from a scatter to a violin plot. The violin should show three groups side by side: students sleeping <6hrs, 6-8hrs, and >8hrs. Each violin should be a different pastel color.
```

**To add a narrative element:**
```
Add a "What This Means" text panel below the main chart with three bullet points, each starting with an action verb, explaining what a university counselor should do with this finding.
```

**To simplify for a specific audience:**
```
Simplify this dashboard for a student audience (not administrators). Remove the technical statistics, keep only the most impactful chart, and make the key finding larger and more prominent.
```

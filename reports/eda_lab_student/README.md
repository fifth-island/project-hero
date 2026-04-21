# EDA Lab — Student Guide

You will work through a structured Exploratory Data Analysis of a real student wellness dataset, using Claude Code as a collaborative partner at every step. The agent writes code, runs it, reviews the output, and iterates — your job is to direct the analysis, evaluate what comes back, and push it further.

**By the end of this lab you will be able to:**
1. Diagnose and clean a real-world messy dataset systematically
2. Conduct univariate and bivariate EDA using AI-assisted analysis
3. Formulate data-driven hypotheses and select the strongest for investigation
4. Write research-quality analytical reports using AI as a writing collaborator
5. Design professional-grade data dashboards using AI design tools

---

## Setup

### 1. Create and activate the virtual environment

```bash
cd reports/eda_lab_student
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# venv\Scripts\Activate.ps1       # Windows PowerShell
```

You should see `(venv)` at the start of your terminal prompt.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Verify

```bash
python3 -c "import pandas, plotly, scipy; print('All good!')"
```

### 4. Open Claude Code

```bash
claude
```

Keep Claude Code open in your terminal for the entire lab. All analysis happens here.

---

## How the system works

### Three files you attach to every prompt

| File | What it does |
|------|-------------|
| `agent/agent.md` | The agent's operating manual — visualization standards, script standards, report writing rules. Attach at the start of every session. |
| `skills/skill_phaseN_*.md` | The workflow guide for the current phase. Attach at the start of each phase. |
| `context/context.md` | The lab's shared memory — all findings and decisions from previous phases. Attach at the start of every session and update at the end of each phase. |

### The `@filename` syntax

In Claude Code, `@filename` attaches a file directly into the agent's context:

```
@agent/agent.md @skills/skill_phase0_diagnostic.md @context/context.md

[Your prompt here]
```

Always attach all three relevant files at the start of a session.

### How the agent works

When you give the agent an analysis task it will:
1. Write the script
2. Run it immediately
3. Review the output (printed stats, saved figures)
4. Make adjustments and re-run if needed
5. Report back what it found — with interpretation, not just code

You don't run any commands yourself. Your job is to read the output, look at the figures saved in `figures/`, and tell the agent what to do next.

### Context accumulation

`context/context.md` grows across the lab. At the end of each phase ask the agent to append its summary. At the start of the next phase attach it again — the agent remembers everything. **Never delete entries, only append.**

---

## Phase 0 — Data Orientation & Diagnostic

**Objective:** Develop full situational awareness of the raw dataset. Find every quality issue. Document every cleaning decision.

**Deliverables:** `phase0_diagnostic/scripts/diagnostic.py`, `phase0_diagnostic/scripts/cleaning.py`, `phase0_diagnostic/report.md`, `phase0_diagnostic/notebook.ipynb`, updated `context/context.md`

---

### Step 1 — Look at the data yourself first (no agent, ~10 minutes)

Open `dataset/student_wellness.csv` in a spreadsheet or text editor. Before asking the agent anything, write down:
- Which columns do you think have problems?
- What are the most "interesting" relationships you expect to find?

Save these notes — you'll compare them to the agent's findings later.

---

### Step 2 — Structural overview

```
@agent/agent.md @skills/skill_phase0_diagnostic.md @context/context.md

I'm starting Phase 0. The dataset is at dataset/student_wellness.csv.
Give me a structural overview of every column:
- Data type as read by pandas (before any conversion)
- Number of missing values and percentage missing
- Number of unique values
- For numeric columns: min, max, mean, median, std
- For string/object columns: list all unique values (if fewer than 20), or the top 10 most frequent
Do not generate any charts yet. Just give me the data dictionary with these statistics.
```

---

### Step 3 — Diagnostic script

```
@agent/agent.md @context/context.md

Generate a Python script called diagnostic.py in phase0_diagnostic/scripts/ that:
1. Loads the raw CSV from dataset/student_wellness.csv
2. Prints a full quality report per column
3. Creates diagnostic charts (Plotly, pastel palette) for every column with issues
4. Saves all charts to phase0_diagnostic/figures/
5. Saves a quality_summary.csv with: column, issue_type, affected_rows, recommendation

Follow the agent.md standards: self-contained script, docstring, print summary at end.

Run the script immediately after writing it. Review the output and figures — if you spot anything unexpected or worth highlighting, adjust the script and re-run before reporting back.
```

---

### Step 4 — Review and challenge the findings

Look at the figures in `phase0_diagnostic/figures/` and the printed output. For any issue where you disagree with the agent's recommendation:

```
@agent/agent.md @context/context.md @phase0_diagnostic/quality_summary.csv

For [column], you recommend [action]. I think we should [alternative] because [reason].
Update the cleaning strategy to reflect this decision.
```

---

### Step 5 — Cleaning script

```
@agent/agent.md @context/context.md @phase0_diagnostic/quality_summary.csv

Generate a cleaning.py script in phase0_diagnostic/scripts/ that applies all the decisions we made.
It should:
1. Load dataset/student_wellness.csv
2. Apply every cleaning step (with inline comments explaining each decision)
3. Save the result to dataset/student_wellness_clean.csv
4. Save a cleaning_log.csv listing each change made
5. Print a before/after summary (row count, missing values, data types)

Run it immediately. Verify the before/after numbers look correct. If anything seems off, investigate and fix before reporting back.
```

---

### Step 6 — Write the report

```
@agent/agent.md @context/context.md @phase0_diagnostic/quality_summary.csv @phase0_diagnostic/cleaning_log.csv

Write the Phase 0 report to phase0_diagnostic/report.md.
Structure:
1. Executive Summary
2. Column-by-Column Findings with chart embeds
3. Cleaning Decision Log as a markdown table
4. Key Questions Raised for Phase 1
Then append the Phase 0 summary block to context/context.md.
```

---

### Step 7 — Generate the notebook

```
@agent/agent.md @phase0_diagnostic/report.md

Phase 0 is complete. Convert diagnostic.py and cleaning.py into a single Jupyter notebook at phase0_diagnostic/notebook.ipynb.
Structure: alternating markdown cells (explaining what each section does and what it found) and code cells.
The notebook should reproduce all outputs when run top-to-bottom.
```

> Notebooks are always generated last — scripts and reports first.

---

## Phase 1 — Univariate Bootstrap

**Objective:** Describe every variable individually. Build intuition for shape, spread, and character before examining any relationships.

**Deliverables:** `phase1_univariate/scripts/univariate_numeric.py`, `phase1_univariate/scripts/univariate_categorical.py`, `phase1_univariate/report.md`, `phase1_univariate/notebook.ipynb`, updated `context/context.md`

---

### Step 1 — Orient the agent

```
@agent/agent.md @skills/skill_phase1_univariate.md @context/context.md

We are now in Phase 1. The clean dataset is at dataset/student_wellness_clean.csv.
We are going to analyze every column individually — one variable at a time, no relationships yet.
Let's start with numeric columns. Ready?
```

---

### Step 2 — Numeric sweep

```
@agent/agent.md @context/context.md

Generate a self-contained Python script called univariate_numeric.py in phase1_univariate/scripts/ that:
- Loads dataset/student_wellness_clean.csv
- For each numeric column, creates:
  a) A histogram with 30 bins and a KDE overlay
  b) A box plot showing median, IQR, and outliers
- Both charts use Plotly with the pastel palette from agent.md
- Saves each chart to phase1_univariate/figures/ as [col]_hist.png and [col]_box.png
- Annotates the histogram with vertical dashed lines for mean (blue) and median (rose)
- Prints descriptive stats: mean, median, std, skewness, kurtosis for each column
- Saves a numeric_summary_stats.csv

Run the script. Review all the output statistics and figures. If any distribution is surprising, bimodal, or has outliers worth calling out, add a printed note for that column before reporting back.
```

---

### Step 3 — Categorical sweep

```
@agent/agent.md @context/context.md

Generate univariate_categorical.py in phase1_univariate/scripts/ that:
- For each categorical column (gender, major, year_in_school, has_part_time_job, on_campus):
  - Creates a bar chart showing frequency sorted descending, using Plotly pastel palette
  - Shows count AND percentage on each bar
- Saves to phase1_univariate/figures/ as [col]_bar.png
- Prints value counts and % breakdown to console

Run it and review the output. Flag any category that has an unexpectedly high or low share.
```

---

### Step 4 — Interpret distributions

For any chart that surprises you:

```
@context/context.md

The [column] distribution shows [describe what you see — shape, peaks, spread, anything unusual].
What does this tell us about the student population?
Is it expected? What are the "so what?" implications?
```

---

### Step 5 — Write the report

```
@agent/agent.md @context/context.md @phase1_univariate/numeric_summary_stats.csv

Write the Phase 1 report to phase1_univariate/report.md.
For each variable include:
- Chart reference (embedded image markdown)
- Key statistics (mean, median, std, or value counts)
- Shape description (normal, left-skewed, right-skewed, bimodal, uniform)
- Notable features (any surprising finding)
- One "So what?" sentence — what does this tell us about this student population?
End with a Phase 1 Summary table identifying the top 3 most analytically interesting variables for Phase 2.
Then append the Phase 1 summary block to context/context.md.
```

---

### Step 6 — Generate the notebook

```
@agent/agent.md @phase1_univariate/report.md

Phase 1 is complete. Convert univariate_numeric.py and univariate_categorical.py into a single Jupyter notebook at phase1_univariate/notebook.ipynb.
Add markdown cells between code blocks explaining what each section produces and what the key findings are.
```

---

## Phase 2 — Hypothesis Negotiation

**Objective:** Generate hypotheses before looking at any bivariate data. Compare your intuitions against the agent's. Select the three strongest for Phase 3.

**Deliverables:** `phase2_hypothesis/hypothesis_log.md`, `phase2_hypothesis/scripts/bivariate_preview.py`, `phase2_hypothesis/report.md`, `phase2_hypothesis/notebook.ipynb`, updated `context/context.md`

> **Critical rule:** Write your own hypotheses before sending any prompt in this phase. The comparison is a graded deliverable. If you look at the agent's list first, the exercise loses its value.

---

### Step 1 — Write your own hypotheses (no agent, ~10 minutes)

Create `phase2_hypothesis/hypothesis_log.md` and write 5 hypotheses in this format:

```
H1: [Variable A] is [positively/negatively/not] related to [Variable B]
Because: [reasoning from Phase 1 findings]
Expected finding: [what you think the chart will show]
```

Do this independently, then continue.

---

### Step 2 — Ask the agent for its hypotheses

```
@agent/agent.md @skills/skill_phase2_hypothesis.md @context/context.md @phase1_univariate/report.md

Based on the univariate findings in the report above, generate 7 data-driven hypotheses about relationships in this dataset.
For each hypothesis:
- State it clearly (X is related to Y in what direction)
- Explain the analytical reasoning (what in the univariate data suggests this?)
- Suggest the best chart type to test it
- Rate your confidence: high / medium / low and explain why
Format as a markdown table.
```

---

### Step 3 — Compare and negotiate

```
@agent/agent.md @context/context.md

Here are my hypotheses:
[paste your list from hypothesis_log.md]

Compare them to your list:
- Which hypotheses overlap? What does that tell us?
- Which are unique to my list? What might I be seeing that you missed?
- Which are unique to your list? What did I overlook?
What does this comparison reveal about how humans and AI approach hypothesis generation differently?
```

---

### Step 4 — Preview charts

```
@agent/agent.md @context/context.md

For these 5 hypotheses: [list your top 5 from the combined lists]
Generate a Python script called bivariate_preview.py in phase2_hypothesis/scripts/ that creates one quick preview chart for each:
- Scatter for continuous×continuous (with OLS trendline)
- Box or violin for continuous×categorical
Use Plotly, pastel palette. Save to phase2_hypothesis/figures/.
Print the key statistic (r, t, or group means) for each.

Run the script immediately. Review the output — if any result is surprising or suggests a stronger signal than expected, add a second chart for that hypothesis to dig one level deeper. Report what you found.
```

---

### Step 5 — Select 3 and write the report

```
@agent/agent.md @context/context.md @phase2_hypothesis/hypothesis_log.md

Looking at the preview charts, help me select the 3 strongest hypotheses for Phase 3.
For each recommendation:
- What signal did the chart show?
- What analytical angles should we pursue in Phase 3?
- What would "confirmed", "rejected", and "nuanced" look like for this hypothesis?
Write this to phase2_hypothesis/report.md with the full hypothesis log, comparison analysis, and selected 3 with rationale.
Then append Phase 2 summary to context/context.md.
```

---

### Step 6 — Generate the notebook

```
@agent/agent.md @phase2_hypothesis/report.md

Phase 2 is complete. Convert bivariate_preview.py into a Jupyter notebook at phase2_hypothesis/notebook.ipynb.
Add markdown cells explaining what each hypothesis preview tests, what the key statistic shows, and why we selected or rejected each for Phase 3.
```

---

## Phase 3 — Deep Dive Analysis

**Objective:** Build thorough analysis for each of the 3 selected hypotheses. The agent generates charts, runs them, and proposes next steps — you direct what to pursue.

**Deliverables:** scripts and figures for each hypothesis in `phase3_deepdive/`, `phase3_deepdive/report.md`, `phase3_deepdive/notebook.ipynb`, updated `context/context.md`

---

### Step 1 — Orient the agent

```
@agent/agent.md @skills/skill_phase3_deepdive.md @context/context.md @phase2_hypothesis/report.md

We are in Phase 3. Our 3 selected hypotheses are:
H1: [paste]
H2: [paste]
H3: [paste]
We'll tackle them one at a time. Let's start with H1. Generate the most fundamental chart for this hypothesis, run it, and tell me what you see. Then suggest 3 directions we could take next.
```

---

### Step 2 — Let the data drive the next step

After each round of charts, choose a direction and push:

```
@agent/agent.md @context/context.md @phase3_deepdive/report.md

The output shows [describe what you observe — direction, strength, clusters, outliers, anything unexpected].
Take option [1/2/3] from your suggestions: [brief description].
Generate the next script, run it, and append the new finding to phase3_deepdive/report.md under H[N].
If the result opens up a further question, go one level deeper before stopping.
```

---

### Step 3 — Slice by subgroup

```
@agent/agent.md @context/context.md @phase3_deepdive/report.md

Slice this relationship by [major / year / gender / on_campus].
Generate and run a script that creates a faceted or grouped comparison.
If one subgroup behaves differently from the others, investigate that subgroup further.
Append findings to phase3_deepdive/report.md under H[N].
```

---

### Step 4 — Add statistical validation

```
@agent/agent.md @context/context.md @phase3_deepdive/report.md

The charts suggest [finding]. Now add statistical rigor:
Generate and run a script that computes the appropriate test (correlation / t-test / ANOVA), prints p-values and effect sizes.
If the result is significant, check whether it holds in subgroups too.
Append a "Statistical Validation" subsection to the report.
```

---

### Step 5 — Push beyond the obvious

When you feel you've covered the main angles:

```
@agent/agent.md @context/context.md @phase3_deepdive/report.md

We've covered the obvious angles on H[N]. What's a less conventional or more creative way to look at this relationship that might reveal something we'd miss with standard charts?
Pick the most promising approach, implement and run it, and add it to the report if it's worth including.
```

---

### Step 6 — Conclude each hypothesis

```
@agent/agent.md @context/context.md @phase3_deepdive/report.md

Summarize H[N]. Write a "H[N] Conclusion" section in phase3_deepdive/report.md that states:
- What we hypothesized
- What we actually found (with specific numbers)
- Whether confirmed / rejected / nuanced
- The single most important implication
Then we'll move to H[N+1].
```

Repeat Steps 2–6 for H2 and H3.

---

### Step 7 — Notebook and context wrap-up

```
@agent/agent.md @phase3_deepdive/report.md

Phase 3 is complete. Convert all hypothesis scripts into a single Jupyter notebook at phase3_deepdive/notebook.ipynb.
One section per hypothesis: markdown explaining the finding → code cell → conclusion markdown.
Then append the Phase 3 summary to context/context.md.
```

---

## Phase 4 — Per-Hypothesis Research Reports

**Objective:** Write a standalone research-quality report for each of the 3 hypotheses. Logical progression: background → descriptive → exploratory → statistical → advanced → conclusion → implications.

**Deliverables:** `phase4_reports/h1_sleep_gpa/report.md`, `phase4_reports/h2_stress_major/report.md`, `phase4_reports/h3_screen_wellness/report.md`, updated `context/context.md`

> Phase 4 is writing-only — no new scripts or notebooks. All figures come from Phase 3.

---

### Step 1 — Orient the agent (repeat for each hypothesis)

```
@agent/agent.md @skills/skill_phase4_reports.md @context/context.md @phase3_deepdive/report.md

We are in Phase 4. Write a standalone research report for H1: [hypothesis].
Logical progression: background → variable definitions → descriptive overview → relationship exploration → subgroup analysis → statistical evidence → advanced analysis → conclusion → implications.
Start with Sections 1 (Background) and 2 (Variable Definitions). Save to phase4_reports/h1_sleep_gpa/report.md.
```

> For H2 swap `h1_sleep_gpa` → `h2_stress_major`. For H3 swap → `h3_screen_wellness`.

---

### Step 2 — Build section by section

```
@agent/agent.md @context/context.md @phase4_reports/h1_sleep_gpa/report.md

Draft Section [N+1]. What is the most valuable content here to build the analytical argument?
Use existing figures from phase3_deepdive/figures/ — don't regenerate. Reference them with markdown image embeds.
```

---

### Step 3 — Advanced analysis section

```
@agent/agent.md @context/context.md @phase4_reports/h1_sleep_gpa/report.md

We're at Section 7 (Advanced Analysis). We've covered the obvious angles.
Give me 3 creative or non-obvious analytical approaches for H[N] that might reveal something surprising.
I'll choose one and we'll implement it together.
```

---

### Step 4 — Polish pass

```
@agent/agent.md @phase4_reports/h1_sleep_gpa/report.md

Review the full report.
Check: (1) does the narrative flow from basic to complex? (2) is every chart referenced? (3) does every statistical claim have a number? (4) is the "so what?" clear in every section? (5) is the conclusion specific and falsifiable?
Make any needed edits in place.
```

---

### Step 5 — Update context

After all three reports are complete:

```
@agent/agent.md @context/context.md @phase4_reports/h1_sleep_gpa/report.md @phase4_reports/h2_stress_major/report.md @phase4_reports/h3_screen_wellness/report.md

Append the Phase 4 summary block to context/context.md.
For each hypothesis: final verdict, key statistic, single most important implication.
```

---

## Phase 5 — Dashboard Design with Google Stitch

**Objective:** Design a PowerBI-style analytics dashboard from your research reports. Learn how prompt quality determines output quality.

**Deliverables:** `phase5_dashboard/dashboard_brief.md`, Stitch screenshot(s), `phase5_dashboard/reflection.md`

**Tool:** [stitch.withgoogle.com](https://stitch.withgoogle.com) — the one phase where you leave the terminal.

---

### Step 1 — Generate a dashboard brief with the agent

```
@agent/agent.md @skills/skill_phase5_dashboard.md @context/context.md @phase4_reports/h2_stress_major/report.md

We are starting Phase 5. I need to design a PowerBI-style dashboard for H2 (STEM vs. Non-STEM stress).
The audience is university administrators.
Distill the report into a dashboard brief: key message (1 sentence), 3 KPI numbers, 2 main charts, 1 insight callout, and the filter controls needed.
Save to phase5_dashboard/dashboard_brief.md.
```

> Swap the report and audience for H1 (advisors) or H3 (students) if designing a different hypothesis.

---

### Step 2 — Try two approaches in Stitch

Open `phase5_dashboard/dashboard_brief.md`, then go to Stitch.

**Approach A — Vague prompt:**
```
Make a dashboard about student stress and STEM majors.
```

**Approach B — Curated brief:**
Write a detailed prompt specifying: title, audience, KPI values, main charts, insight callout, filter controls, color palette, layout. Use `dashboard_brief.md` as your source.

Compare the outputs. Which communicates the key finding more effectively?

---

### Step 3 — Refinement round

After your first good generation, write one refinement prompt based on what you want to improve. For example:

```
Keep the same content but make the key finding (the main statistic) the largest visual element on the page — more prominent than any chart title.
```

```
Redesign the KPI cards: larger metric number, smaller label, thin accent left border instead of full background fill.
```

---

### Step 4 — Reflection (required deliverable)

Save your answers to `phase5_dashboard/reflection.md`:

1. Does the dashboard immediately communicate the key finding without any explanation?
2. Is the most important chart the most visually prominent element?
3. Would a non-data person understand what action to take?
4. What would you change with one more iteration?

---

## Key rules

| Rule | Why it matters |
|------|---------------|
| **Write your Phase 2 hypotheses before sending any agent prompt** | The comparison is a graded deliverable. Anchoring to the agent's list first defeats the exercise. |
| **Never accept agent output without reviewing it** | Read every interpretation, check every number. The agent can be confidently wrong. |
| **Update `context/context.md` at the end of every phase** | This is how the agent maintains continuity across sessions. |
| **Notebooks are always last** | Scripts and reports first — the notebook is the archival artifact, not the working tool. |
| **Every conclusion needs a number** | "Stress is higher in STEM" is not a conclusion. "STEM students report 1.25 points higher stress on average (t=7.35, p<0.0001)" is. |
| **Non-findings are findings** | If a relationship does not exist in the data, investigate why. That is a result. |

---

## Deliverables summary

| Phase | Key deliverables |
|-------|-----------------|
| 0 | `diagnostic.py`, `cleaning.py`, `report.md`, `notebook.ipynb`, updated `context.md` |
| 1 | `univariate_numeric.py`, `univariate_categorical.py`, `report.md`, `notebook.ipynb`, updated `context.md` |
| 2 | `hypothesis_log.md`, `bivariate_preview.py`, `report.md`, `notebook.ipynb`, updated `context.md` |
| 3 | hypothesis scripts + figures, `report.md`, `notebook.ipynb`, updated `context.md` |
| 4 | 3 × `report.md` (one per hypothesis), updated `context.md` |
| 5 | `dashboard_brief.md`, Stitch screenshot(s), `reflection.md` |

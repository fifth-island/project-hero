# Skill: Phase 1 — AI-Assisted Univariate Bootstrap

## Purpose
Now that the data is clean, you will systematically describe every variable on its own — before looking at any relationships. This phase is about building full intuition for the shape, spread, and character of each column. The agent will help you move fast, but you drive every decision.

## When to Use This Skill
After Phase 0 is complete and `phase0_diagnostic/report.md` exists.

## Inputs Required
- `dataset/student_wellness_clean.csv` — cleaned version produced in Phase 0
- `context/context.md` — read Phase 0 summary before starting

## Outputs Produced
- `phase1_univariate/scripts/univariate_numeric.py`
- `phase1_univariate/scripts/univariate_categorical.py`
- `phase1_univariate/figures/` — histograms, box plots, bar charts, violin plots
- `phase1_univariate/report.md` — written narrative for every variable
- Updated `context/context.md` with Phase 1 summary

---

## Step-by-Step Workflow

### Step 1 — Brief the Agent on Context
Always start a new phase by reorienting the agent:

```
We are now in Phase 1 of the EDA lab. Read context/context.md to understand what we found in Phase 0. The clean dataset is at dataset/student_wellness_clean.csv. We are going to do a univariate analysis of every column — one variable at a time, no relationships yet. Ready?
```

### Step 2 — Numeric Variables: Sweep
```
Generate a Python script called univariate_numeric.py that:
- Loads dataset/student_wellness_clean.csv
- For each numeric column, creates:
  a) A histogram with a KDE overlay (use Plotly, pastel palette)
  b) A box plot showing median, IQR, and any remaining outliers
- Saves each pair of charts to phase1_univariate/figures/ as [column]_hist.png and [column]_box.png
- Prints descriptive stats (mean, median, std, skewness, kurtosis) for each column
```

### Step 3 — Categorical Variables: Sweep
```
Generate a Python script called univariate_categorical.py that:
- For each categorical column (gender, major, year_in_school, has_part_time_job, on_campus):
  a) Creates a bar chart showing frequency/proportion (Plotly, pastel palette, sorted descending)
  b) Prints the value counts and percentage breakdown
- Saves charts to phase1_univariate/figures/ as [column]_bar.png
```

### Step 4 — Interpret Together
After running the scripts, go column by column with the agent:

```
Let's interpret the results for [column]. Based on the histogram and box plot, what does the distribution tell us? Is the variable skewed? Are there any remaining concerns? What does this distribution suggest about the student population?
```

### Step 5 — What Did the Agent Miss That You Caught?
Document any column where your visual inspection noticed something the stats didn't flag.

### Step 6 — Ask the Agent: Write the Univariate Report
```
Write the Phase 1 report to phase1_univariate/report.md.
For each variable, include:
- Chart reference (embedded image)
- Key statistics (mean, median, mode if categorical)
- Shape description (normal, skewed left/right, bimodal, uniform)
- Notable features (any surprising finding)
- One "So what?" sentence — what does this tell us about students?
Then append the Phase 1 summary to context/context.md.
```

---

## Key Teaching Points

**Prompt specificity matters.** A vague prompt like "analyze GPA" produces a generic result. A specific prompt like "create a histogram of GPA with 20 bins, overlay a KDE curve, and annotate the mean and median with vertical dashed lines" produces a professional chart.

**Skewness is a story.** If GPA is left-skewed (long tail toward low GPAs), that tells you most students do well but a minority struggle significantly. If sleep is right-skewed, most students sleep little. These are stories about the population.

**Bimodality is a red flag.** Two peaks in one variable often mean there are two hidden subgroups. This becomes a hypothesis for Phase 2.

---

## Common Prompts for This Phase

**To improve a chart:**
```
The GPA histogram looks good but I want to add a vertical dashed line at the GPA mean and another at the median, with labels. Can you update the script to add those annotations?
```

**To probe a surprising distribution:**
```
The screen_time distribution looks bimodal — there seem to be two groups. Can you add a note in the report that we should investigate whether this splits by major or by year in Phase 2?
```

**To get a specific stat:**
```
What percentage of students report more than 8 hours of screen time per day? And what percentage sleep fewer than 6 hours? Add these percentages as callouts in the report.
```

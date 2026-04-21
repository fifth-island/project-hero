# Skill: Phase 0 — Data Orientation & Diagnostic

## Purpose
This skill guides you and the agent through a systematic, column-by-column diagnostic of the raw dataset. The goal is to develop full situational awareness before touching any analysis. You should finish Phase 0 knowing exactly what you have, what is broken, and what you decided to do about it.

## When to Use This Skill
At the very start of the lab, before any plots or statistics are generated.

## Inputs Required
- `dataset/student_wellness.csv` — the raw dataset
- `context/context.md` — read the Column Catalogue before starting

## Outputs Produced
- `phase0_diagnostic/scripts/diagnostic.py` — full diagnostic script
- `phase0_diagnostic/figures/` — all diagnostic charts
- `phase0_diagnostic/report.md` — findings and cleaning decisions per column
- Updated `context/context.md` with Phase 0 summary

---

## Step-by-Step Workflow

### Step 1 — First Contact (no agent)
Before opening the agent, look at the raw CSV manually:
- Open `dataset/student_wellness.csv` in a text editor or spreadsheet
- Read the column names and write down in your own words what each column measures
- Hypothesize: which columns might have issues? Which relationships might be interesting?
- Write this down — you will compare it to the agent's findings later

### Step 2 — Ask the Agent: Structural Overview
Activate the agent and use this prompt:

```
Read the file at dataset/student_wellness.csv.
Give me a structural overview of every column:
- Data type as read by pandas
- Number of missing values and % missing
- Number of unique values
- For numeric columns: min, max, mean, median, std
- For string/object columns: list the unique values (if fewer than 20) or the top 10 most frequent
Do not generate any charts yet. Just give me the data dictionary with these stats.
```

### Step 3 — Ask the Agent: Identify Data Quality Issues
```
Based on the structural overview, identify every data quality issue in this dataset.
For each issue, tell me:
1. Which column
2. What the issue is (impossible value, inconsistent encoding, wrong type, missing, duplicate)
3. How many rows are affected
4. What you recommend we do about it and why

Then generate a Python script called diagnostic.py that:
- Loads the raw CSV
- Prints a full quality report (per column)
- Generates one diagnostic chart per column with issues using Plotly with the pastel palette
- Saves all charts to phase0_diagnostic/figures/
- Saves a quality_summary.csv with: column, issue_type, affected_rows, recommendation
```

### Step 4 — Run the Script
```bash
# Activate the lab environment first
source venv/bin/activate

# Run the diagnostic
python3 phase0_diagnostic/scripts/diagnostic.py
```

### Step 5 — Review & Decide
For each issue flagged:
- Do you agree with the agent's recommendation?
- If not, tell the agent your preferred approach and ask it to update the script
- Document every decision in the report

### Step 6 — Ask the Agent: Write the Diagnostic Report
```
Based on the diagnostic results and the cleaning decisions we made, write the Phase 0 report.
Save it to phase0_diagnostic/report.md.
Structure it as:
1. Executive Summary (what did we find overall)
2. Column-by-Column Findings (one subsection per column with issues)
3. Cleaning Decision Log (table: column | issue | decision | rationale)
4. Key Questions Raised (what do you still not know about this data?)
5. Update context/context.md with the Phase 0 summary block
```

---

## Key Teaching Points

**What you're learning here:**
- Data is never clean. Assume problems exist until proven otherwise.
- Impossible values are different from outliers — impossible means the data entry was wrong (age=200); outliers are real but extreme values.
- Missing data has patterns — is it random, or are certain student types less likely to report certain things?
- Every cleaning decision is a *choice* with consequences. Document them so future-you (and the agent) knows why.

**Questions to reflect on after Phase 0:**
1. Were your pre-analysis guesses about issues correct?
2. What surprised you most?
3. How would the analysis be wrong if you hadn't cleaned these issues?

---

## Common Prompts for This Phase

**If the agent misses an issue:**
```
You flagged [X] issues but I also see a problem with [column]. The values [example] don't seem valid. Can you add this to the quality report and suggest a fix?
```

**If you disagree with a recommendation:**
```
For [column], you recommend [action]. I think we should [alternative] because [reason]. Can you update the diagnostic script and report to reflect this decision?
```

**If you want to explore a specific column deeper:**
```
I want to understand the distribution of [column] before deciding how to handle the outliers. Can you generate a box plot and a histogram side by side using Plotly?
```

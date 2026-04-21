# Skill: Phase 2 — Hypothesis Negotiation

## Purpose
This is the strategic heart of the EDA. You will generate your own hypotheses from Phase 1 insights, ask the agent to generate its own, then compare, debate, and prioritize which 3 you'll investigate deeply in Phase 3. The goal is to practice thinking like a data analyst — forming testable questions before diving into analysis.

## When to Use This Skill
After Phase 1 is complete and `phase1_univariate/report.md` exists.

## Inputs Required
- `phase1_univariate/report.md` — your univariate findings
- `context/context.md` — read all previous phases

## Outputs Produced
- `phase2_hypothesis/hypothesis_log.md` — structured record of all hypotheses
- `phase2_hypothesis/scripts/bivariate_preview.py` — quick preview charts for top hypotheses
- `phase2_hypothesis/figures/` — preview scatter plots, grouped box plots
- `phase2_hypothesis/report.md` — final chosen hypotheses with rationale
- Updated `context/context.md` with Phase 2 summary

---

## Step-by-Step Workflow

### Step 1 — Your Hypotheses First (no agent)
Before asking the agent anything, write down 5 hypotheses of your own based on what you saw in Phase 1. Use this format:

```
H1: [Variable A] is [positively/negatively/not] related to [Variable B]
Because: [your reasoning based on Phase 1]
Expected finding: [what you think the chart will show]
```

### Step 2 — Ask the Agent for Its Hypotheses
```
Read phase1_univariate/report.md and context/context.md.
Based on the univariate findings, generate 7 data-driven hypotheses about relationships in this dataset. For each hypothesis:
- State it clearly (X is related to Y)
- Explain the analytical reasoning (not just intuition)
- Suggest what type of chart would best test it
- Rate confidence: high / medium / low
Format as a markdown table.
```

### Step 3 — Compare and Negotiate
Look at both lists side by side:
- Which hypotheses appeared in both? (Strong candidates — both human and AI converged)
- Which did the agent have that you missed? (What did you overlook?)
- Which did you have that the agent missed? (What did the AI overlook?)

Ask the agent:
```
I have my own hypotheses list. Here they are: [paste your list].
Compare them to your list. Which hypotheses overlap? Which are unique to my list? Which are unique to yours? What does that comparison tell us about how humans and AI approach this differently?
```

### Step 4 — Quick Preview Charts
Pick your top 5 hypotheses (before narrowing to 3) and ask the agent:

```
For these 5 hypotheses, generate a Python script called bivariate_preview.py that creates one quick preview chart for each:
- Scatter plot for continuous vs. continuous relationships
- Box plot or violin plot for continuous vs. categorical
- Heatmap or grouped bar for categorical vs. categorical
Use Plotly and the pastel palette. Save to phase2_hypothesis/figures/.
The goal is quick and clear — not final publication quality. We just need enough to decide which 3 to investigate deeply.
```

### Step 5 — Finalize Your Top 3
Look at the preview charts and decide which 3 hypotheses to investigate in Phase 3. Consider:
- Which show the clearest signal?
- Which are most interesting / meaningful?
- Which are most surprising?

Ask the agent to help finalize:
```
Based on the preview charts, help me select the 3 strongest hypotheses to investigate in Phase 3. For each one you recommend, explain what we should look for and what a "yes" vs "no" result would look like.
```

### Step 6 — Write the Hypothesis Report
```
Write the Phase 2 report to phase2_hypothesis/report.md.
Include:
1. Full hypothesis log (all hypotheses considered, both mine and yours)
2. The comparison analysis (where we agreed and disagreed)
3. The 3 selected hypotheses with full rationale
4. For each selected hypothesis: what analysis we'll do in Phase 3 and why
Then append Phase 2 summary to context/context.md.
```

---

## Key Teaching Points

**Hypotheses before analysis.** The order matters. If you plot first and then form your hypothesis, you're rationalizing, not discovering. Real EDA forms questions before running charts.

**AI sees patterns humans miss.** The agent scans correlations across all variable pairs simultaneously. You think one thread at a time. The gap between your list and the agent's list is instructive.

**Rejecting a hypothesis is a finding.** If the preview chart shows no relationship, that's informative. Document it.

---

## Common Prompts for This Phase

**To challenge an agent hypothesis:**
```
You suggested that exercise_days_per_week is related to GPA, but in my univariate analysis I noticed exercise had a very flat distribution. I'm skeptical this will show a strong signal. Can you defend your hypothesis with a statistical argument? What correlation coefficient do you expect?
```

**To add domain knowledge:**
```
I know from research that the relationship between sleep and academic performance is well-documented. Can you incorporate that context into how we frame Hypothesis H2, and suggest a more specific testable version?
```

**To prioritize:**
```
If I can only pick 3 hypotheses to investigate deeply, help me rank all [N] by: expected effect size, importance to students, and how novel the finding might be.
```

# Skill: Phase 3 — Targeted Deep Dives

## Purpose
You now have 3 validated hypotheses. This phase is where you build a real analysis for each one — iteratively, with the agent generating scripts and figures, and you directing the narrative. The output is a growing `report.md` that accumulates as you go, not a document written at the end.

## When to Use This Skill
After Phase 2 is complete. You have 3 selected hypotheses in `phase2_hypothesis/report.md`.

## Inputs Required
- `dataset/student_wellness_clean.csv`
- `phase2_hypothesis/report.md` — your 3 selected hypotheses
- `context/context.md` — previous phase summaries

## Outputs Produced
- `phase3_deepdive/scripts/` — one script per analysis step (named descriptively)
- `phase3_deepdive/figures/` — all figures from this phase
- `phase3_deepdive/report.md` — the growing analysis narrative (append as you go)
- Updated `context/context.md` with Phase 3 summary

---

## Two Modes of Working

### Mode A — Active Collaboration (recommended)
You and the agent build the analysis together, step by step. After each output, you review, interpret, and decide what to do next. The report grows in real time.

**How to work in Mode A:**
1. Start a deep dive on one hypothesis
2. Agent generates a script → you run it → you review the figure
3. You tell the agent what you see and ask for the next layer of analysis
4. Agent appends the finding to the report
5. Repeat until you feel you've answered the hypothesis

### Mode B — Structured Batch
You specify the full analysis plan upfront and let the agent generate all scripts at once, then you review the bundle.

**How to work in Mode B:**
1. Write a full analysis plan (what charts, what stats, what slices)
2. Agent generates all scripts at once
3. You run them all, review all figures
4. Agent writes the full section report at once

**Recommendation:** Use Mode A for hypotheses where you're uncertain. Use Mode B when you have a clear plan and want to move fast.

---

## Step-by-Step Workflow (Mode A — Recommended)

### Step 1 — Orient the Agent
```
We are now in Phase 3. Read context/context.md for everything we've discovered so far.
Our 3 selected hypotheses from Phase 2 are:
H1: [paste hypothesis]
H2: [paste hypothesis]
H3: [paste hypothesis]
We'll tackle them one at a time. Let's start with H1. Ready?
```

### Step 2 — First Analysis Layer (for each hypothesis)
```
For H1 ([your hypothesis]), start with the most fundamental visualization.
Generate a script called h1_base.py that creates:
- [specify what chart you want — scatter, violin, grouped box, etc.]
- With a trend line / grouping by [variable] if relevant
- Using Plotly, pastel palette
- Saved to phase3_deepdive/figures/h1_base.png
After running the script, append a first-pass interpretation of H1 to phase3_deepdive/report.md.
```

### Step 3 — Iterative Deepening
After reviewing the base chart, ask the agent: "What should we look at next to either confirm or challenge this finding?" Then build on the answer:

```
The base chart shows [what you see]. Now I want to go deeper.
Can you generate h1_breakdown.py that:
- Slices the same relationship by [major / year / gender / on_campus]
- Creates a faceted chart or grouped comparison
- Highlights whether the relationship holds across subgroups or only in some
Append the new finding to phase3_deepdive/report.md under H1.
```

### Step 4 — Statistical Validation
```
The charts suggest [finding]. Now let's add statistical rigor.
Generate h1_stats.py that:
- Computes Pearson/Spearman correlation between [var A] and [var B]
- Runs a t-test or ANOVA if comparing groups
- Prints p-values and effect sizes
- Appends a "Statistical Validation" subsection to phase3_deepdive/report.md for H1
```

### Step 5 — Agent Suggestion Loop
After each analytical step, use this prompt to generate the next idea:

```
Based on what we've found so far for H1, what are 3 directions we could go next?
Option 1: [deeper on this finding]
Option 2: [related variable we haven't looked at]
Option 3: [challenge the finding / look for counterevidence]
Which would you recommend and why?
```

### Step 6 — Summarize H1, Move to H2
```
Wrap up H1. Write a summary section in phase3_deepdive/report.md titled "H1 Conclusion" that states: what we hypothesized, what we found, whether the hypothesis was confirmed/rejected/nuanced, and the most important implication.
Then let's move to H2.
```

---

## Report Structure for Phase 3

The `phase3_deepdive/report.md` should grow to look like this as you work:

```markdown
# Phase 3: Deep Dive Analysis

## H1: [Hypothesis Statement]
### 1.1 Initial Exploration
[chart + interpretation]
### 1.2 Subgroup Analysis
[chart + interpretation]
### 1.3 Statistical Validation
[stats + interpretation]
### H1 Conclusion
[confirmed / rejected / nuanced + implication]

## H2: [Hypothesis Statement]
...

## H3: [Hypothesis Statement]
...

## Phase 3 Summary
[overall narrative connecting the 3 findings]
```

---

## Key Teaching Points

**Build, don't dump.** The report grows with you. Don't wait until the end to write — write as you discover.

**Direction matters.** You choose what to do next. The agent suggests but you decide. This is the core skill of being a data analyst.

**Challenge your findings.** Always ask the agent: "What would make this finding wrong?" A good analysis looks for counterevidence, not just confirmation.

---

## Common Prompts for This Phase

**When you see something unexpected:**
```
The chart shows [unexpected finding]. I didn't expect this based on H1. Can you help me understand what might explain this? Generate a chart that tests [alternative explanation].
```

**When you want the agent's creative input:**
```
We've covered the obvious angles on H2. What's a less obvious or more creative way to look at this relationship that might reveal something we'd miss with standard charts?
```

**When building the narrative:**
```
We've generated 5 charts for H1. Help me synthesize them into a coherent 3-paragraph narrative that tells the story of what we found. Start with the main finding, explain what drives it, and end with what it means for students.
```

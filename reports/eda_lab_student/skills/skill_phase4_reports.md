# Skill: Phase 4 — Per-Hypothesis Research Reports

## Purpose
Each of your 3 hypotheses now gets its own standalone research-quality `.md` report. These are not just analysis summaries — they are mini research papers with a logical flow: from basic context, through increasing analytical complexity, to conclusions and implications. The agent helps you build the narrative layer by layer, always suggesting what to add next.

## When to Use This Skill
After Phase 3 is complete. All charts and statistical tests for the 3 hypotheses have been generated.

## Inputs Required
- `phase3_deepdive/report.md` — all the analysis already done
- `phase3_deepdive/figures/` — all generated figures
- `context/context.md` — full lab context

## Outputs Produced (per hypothesis)
- `phase4_reports/h1_sleep_gpa/report.md`
- `phase4_reports/h2_stress_major/report.md`
- `phase4_reports/h3_screen_wellness/report.md`
- Updated `context/context.md` with Phase 4 summary

---

## Report Structure (Required for Each Hypothesis)

Each per-hypothesis report must follow this exact progression — from simple to complex:

```markdown
# [Hypothesis Title]: [One-line Question]

## 1. Background & Motivation
- Why does this question matter in the context of student life?
- What does existing knowledge or common sense suggest?
- What specific gap are we trying to fill with this data?

## 2. Variable Definitions
- What exactly are we measuring? (precise definition of each variable)
- What are the valid ranges and what do extreme values mean?
- Any caveats about how the data was collected or cleaned?

## 3. Descriptive Overview
- Basic stats for the two (or more) key variables
- Simple chart: individual distributions (reference Phase 1 figures)
- First-level observation: do the ranges and shapes make sense?

## 4. Relationship Exploration
- The base relationship chart (scatter, box, etc.)
- Is there a visible pattern? Direction? Strength?
- What does the center of the distribution tell us? The tails?

## 5. Subgroup Analysis
- Does the relationship hold across all groups (major, year, gender)?
- Where is it strongest? Where does it break down?
- Are there meaningful exceptions?

## 6. Statistical Evidence
- Correlation coefficient or test statistic
- p-value and what it means in plain English
- Effect size (small / medium / large) and practical significance

## 7. Advanced / Creative Analysis
- One analysis that goes beyond the obvious
- (Agent will suggest this — ask: "What's a non-obvious angle here?")
- This is the most intellectually interesting part of the report

## 8. Conclusion
- Was the hypothesis confirmed, rejected, or nuanced?
- What is the single most important finding in one sentence?
- What would need to be true for this finding to NOT generalize?

## 9. Implications & Recommendations
- What should a student, counselor, or university administrator do with this finding?
- What follow-up data or analysis would strengthen this conclusion?
```

---

## Step-by-Step Workflow

### Step 1 — Orient the Agent to Report Mode
```
We are now in Phase 4. Read context/context.md and phase3_deepdive/report.md.
We are writing a standalone research report for H1: [hypothesis].
The report should go from basic context to advanced analysis, following a logical progression.
Start by drafting Section 1 (Background & Motivation) and Section 2 (Variable Definitions).
Save to phase4_reports/h1_sleep_gpa/report.md.
```

### Step 2 — Build Section by Section
Don't write the whole report at once. Do it section by section and review each before continuing:

```
Good. Now draft Section 3 (Descriptive Overview) using the Phase 1 findings. Reference the existing figures from phase1_univariate/figures/ — don't regenerate them. Add the figure path references.
```

```
Now Section 4 (Relationship Exploration). Use the base chart from phase3_deepdive/figures/. Interpret what we see in detail.
```

### Step 3 — Ask "What's Next?" at Each Step
After each section, always ask:
```
We've completed Section [N]. What would be the most valuable thing to add in Section [N+1] to build the analytical argument? What data or chart would strengthen the narrative most?
```

### Step 4 — The Advanced Analysis Section
This is where the agent earns its keep. Always ask for a creative angle:

```
We're at Section 7 (Advanced Analysis). We've covered the obvious. What's a less conventional or more creative analytical approach for H1 that might reveal something surprising? Give me 3 options and I'll choose one.
```

Then:
```
Let's go with [your choice]. Generate the script and add the findings to Section 7 of the report.
```

### Step 5 — Write the Conclusion Sections
```
Draft Sections 8 (Conclusion) and 9 (Implications). Make the conclusion specific and falsifiable — not just "sleep is important." What exact pattern did we find, in which population, with what strength? What policy or behavior change does this suggest?
```

### Step 6 — Polish Pass
```
Review the full report at phase4_reports/h1_sleep_gpa/report.md. Check that:
- The narrative flows logically from simple to complex
- Every chart is referenced with an image embed
- Every statistical claim has a number behind it
- The "So what?" is clear in the conclusion
- The tone is analytical but accessible to a college student audience
Make any edits needed.
```

### Step 7 — Repeat for H2 and H3

---

## Key Teaching Points

**Structure is persuasion.** A report that starts with background, builds through data, and arrives at a clear conclusion is more convincing than a collection of charts. The structure does analytical work.

**Complexity should be earned.** Section 7 (Advanced Analysis) comes after you've established the basics. Don't start with the fancy analysis — build to it.

**Always ask "what next?"** The agent is best used as a creative collaborator when you explicitly ask for its suggestions, not just its execution. The prompt "what are 3 directions we could go?" produces better outputs than "show me a scatter plot."

**Conclusions should be specific.** "Sleep affects GPA" is not a conclusion. "Students sleeping fewer than 6 hours show a GPA 0.4 points lower on average (p=0.003), with the strongest effect in first-year STEM students" is a conclusion.

---

## Common Prompts for This Phase

**To improve the narrative flow:**
```
The transition between Section 4 and Section 5 feels abrupt. Can you add a bridging paragraph that explains why we're now looking at subgroups, and what question that analysis is designed to answer?
```

**To challenge the interpretation:**
```
In Section 6 you say the correlation is "strong." But r=0.38 is actually moderate. Can you update the language to be more precise, and add a comparison: what would a strong correlation (r>0.7) have meant, and why doesn't our finding reach that level?
```

**To add domain knowledge:**
```
I want to add a brief literature reference in Section 1. I know that [study/fact]. Can you incorporate this into the Background section as context?
```

**To generate the advanced analysis:**
```
For the advanced analysis section, I want to explore whether the relationship between [X] and [Y] differs by [third variable] using a faceted scatter plot. Generate the script and interpret the result.
```

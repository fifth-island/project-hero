"""
Generate Jupyter notebooks from existing phase scripts.
One notebook per phase, reproducing all scripts as cells with markdown commentary.
"""

import nbformat as nbf
import os

BASE = "/Users/joaoquintanilha/Downloads/project-hero/reports/eda_lab"

def read_script(path):
    with open(path) as f:
        return f.read()

def make_nb():
    nb = nbf.v4.new_notebook()
    nb.metadata["kernelspec"] = {
        "display_name": "Python 3 (EDA Lab venv)",
        "language": "python",
        "name": "eda_lab"
    }
    return nb

def save_nb(nb, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        nbf.write(nb, f)
    print(f"  [saved] {path}")

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 0
# ══════════════════════════════════════════════════════════════════════════════
nb0 = make_nb()
nb0.cells = [
    nbf.v4.new_markdown_cell("""# Phase 0 — Data Orientation & Diagnostic

This notebook reproduces the full Phase 0 workflow:
1. **Diagnostic** — column-by-column quality audit of the raw dataset
2. **Cleaning** — applying all documented cleaning decisions to produce the clean dataset

> **Before running:** activate the lab virtualenv (`source venv/bin/activate`) and install dependencies (`pip install -r requirements.txt`).

All outputs (figures, CSVs) are saved to `phase0_diagnostic/`. Run cells top to bottom.
"""),

    nbf.v4.new_markdown_cell("## Part 1 — Data Quality Diagnostic\n\nLoads the raw CSV and produces a full quality audit: missing values, impossible values, encoding inconsistencies, duplicates. Saves 13 diagnostic charts and a `quality_summary.csv`."),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase0_diagnostic/scripts/diagnostic.py"))),

    nbf.v4.new_markdown_cell("""## Part 2 — Data Cleaning

Applies all cleaning decisions documented in `phase0_diagnostic/report.md`:
- Drop 3 duplicate rows
- Null and impute impossible values (age, GPA, study hours, sleep hours)
- Cap attendance > 100% at 100%
- Standardize gender encoding (12 variants → 4 canonical)
- Map stress_level text labels to numeric (low→2.5, medium→5.0, high→7.5, very high→9.5)
- Standardize on_campus boolean (10 variants → True/False)
- Median imputation for all remaining missing numeric values

Produces `dataset/student_wellness_clean.csv` used in all subsequent phases.
Saves 3 before/after comparison charts.
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase0_diagnostic/scripts/cleaning.py"))),

    nbf.v4.new_markdown_cell("""## Summary

After running both cells above:
- **Raw → Clean:** 535 rows → 532 rows (3 duplicates removed)
- **Issues resolved:** 18 distinct data quality issues across 10 columns
- **Clean dataset:** `dataset/student_wellness_clean.csv`
- **Key caveats:** anxiety/depression missing values may reflect response bias; stress_level text imputation is approximate

See `phase0_diagnostic/report.md` for the full column-by-column findings and cleaning decision log.
"""),
]
save_nb(nb0, os.path.join(BASE, "phase0_diagnostic/notebook.ipynb"))


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 1
# ══════════════════════════════════════════════════════════════════════════════
nb1 = make_nb()
nb1.cells = [
    nbf.v4.new_markdown_cell("""# Phase 1 — Univariate Bootstrap

This notebook reproduces the full Phase 1 univariate analysis:
1. **Numeric variables** — histogram + KDE + box plot for all 14 numeric columns
2. **Categorical variables** — frequency bar charts for all 5 categorical columns

All 28+ figures are saved to `phase1_univariate/figures/`.
Summary statistics are saved to `phase1_univariate/numeric_summary_stats.csv`.

> **Input:** `dataset/student_wellness_clean.csv` (produced in Phase 0)
"""),

    nbf.v4.new_markdown_cell("""## Part 1 — Numeric Columns

For each numeric column: histogram with KDE overlay + box plot.
Annotates mean and median with vertical dashed lines.
Prints descriptive stats (mean, median, std, skewness, kurtosis).

**Key findings from this phase:**
- Sleep mean = 6.81 hrs (below 7-hr clinical recommendation)
- Screen time mean = 7.56 hrs/day (rivals sleep duration)
- Stress mean = 5.43/10 (moderate); anxiety mean = 6.07 (mild threshold)
- GPA slightly left-skewed (mean 3.07, median 3.12)
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase1_univariate/scripts/univariate_numeric.py"))),

    nbf.v4.new_markdown_cell("""## Part 2 — Categorical Columns

For each categorical column: frequency bar chart sorted descending, showing count and %.
Variables covered: gender, major, year_in_school, has_part_time_job, on_campus.

**Key findings:**
- Gender: balanced 45/45% Male/Female, 10% other identities
- Major: Business (15.2%) and CS (14.1%) largest groups; STEM combined ~41%
- Year: well-balanced across all four years (22–28% each)
- Part-time job: 40.2% of students hold one — large enough for comparison
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase1_univariate/scripts/univariate_categorical.py"))),

    nbf.v4.new_markdown_cell("""## Summary

All 28+ figures saved to `phase1_univariate/figures/`.

**Top 3 variables flagged for Phase 2 hypothesis generation:**
1. `sleep_hours_per_night` — below clinical recommendation, high variance
2. `screen_time_hours` — enormous daily commitment (7.56 hrs avg), wide spread
3. `stress_level` — central wellness axis; STEM vs. non-STEM contrast expected

See `phase1_univariate/report.md` for full narrative interpretation of every variable.
"""),
]
save_nb(nb1, os.path.join(BASE, "phase1_univariate/notebook.ipynb"))


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2
# ══════════════════════════════════════════════════════════════════════════════
nb2 = make_nb()
nb2.cells = [
    nbf.v4.new_markdown_cell("""# Phase 2 — Hypothesis Negotiation

This notebook reproduces the bivariate preview analysis for 5 candidate hypotheses.
The previews inform the decision of which 3 hypotheses to investigate deeply in Phase 3.

**Hypotheses previewed:**
- H1: Sleep hours → GPA
- H2: Major type (STEM vs. Non-STEM) → Stress level
- H3: Screen time → Life satisfaction / wellness
- H4: Part-time job → Study hours & GPA
- H5: Year in school → Anxiety score

> **Input:** `dataset/student_wellness_clean.csv`
> **Output:** 6 preview charts in `phase2_hypothesis/figures/`

> **Note:** Before running this notebook, the student should have already written their own hypothesis list (without AI assistance). This script represents what the AI agent would generate — compare its findings to your list.
"""),

    nbf.v4.new_markdown_cell("""## Bivariate Preview Script

Generates one quick preview chart per hypothesis.
Prints key statistics (Pearson r, t-test results, group means) for each.

**Key results:**
- H1 Sleep→GPA: r = -0.061 (p=0.159) — **non-significant, slight negative direction** (surprise!)
- H2 STEM→Stress: t = 7.351 (p<0.0001) — **strongest signal in the dataset**
- H3 Screen→Wellness: r = -0.255 (life sat), r = +0.305 (stress) — **both significant**
- H4 Job→GPA: negligible effect (<0.01 GPA difference) — **rejected**
- H5 Year→Anxiety: modest trend (5.81→6.34), non-monotonic — **rejected**

**Selected for Phase 3:** H1 (reframed around confounding), H2, H3
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase2_hypothesis/scripts/bivariate_preview.py"))),

    nbf.v4.new_markdown_cell("""## Summary

6 preview charts saved to `phase2_hypothesis/figures/`.

**Selection rationale:**
- H1 kept despite weak direct correlation — the confound with study hours is the real story
- H2 selected — strongest statistical signal, large effect size, policy-relevant
- H3 selected — moderate but consistent effect, highly relatable, allows multi-variable analysis
- H4 rejected — trivial effect size
- H5 rejected — weak trend, better used as subgroup variable in H2 and H3

See `phase2_hypothesis/report.md` for the full human-vs-AI hypothesis comparison and selection log.
"""),
]
save_nb(nb2, os.path.join(BASE, "phase2_hypothesis/notebook.ipynb"))


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 3
# ══════════════════════════════════════════════════════════════════════════════
nb3 = make_nb()
nb3.cells = [
    nbf.v4.new_markdown_cell("""# Phase 3 — Deep Dive Analysis

This notebook reproduces all three hypothesis deep dives:
1. **H1** — Sleep × Study Hours × GPA (the confound revealed)
2. **H2** — STEM vs. Non-STEM Stress (major, wellness profile, year progression)
3. **H3** — Screen Time × Wellness (dose-response, social media comparison, sleep interaction)

> **Input:** `dataset/student_wellness_clean.csv`
> **Output:** 15 figures (5 per hypothesis) in `phase3_deepdive/figures/`

Run each section independently or top-to-bottom. All scripts are self-contained.
"""),

    nbf.v4.new_markdown_cell("""## H1 — Sleep, Study Hours, and GPA

**Hypothesis (reframed):** The direct sleep→GPA relationship is a confound. Study hours is the true driver.

**Scripts produce:**
- `h1_correlation_matrix.png` — 4-variable correlation matrix (sleep, study, GPA, attendance)
- `h1_sleep_gpa_by_study.png` — sleep vs GPA scatter colored by study intensity
- `h1_gpa_sleep_controlled_study.png` — GPA by sleep category within each study group
- `h1_study_vs_sleep_driver.png` — side-by-side: study→GPA (r=0.47) vs sleep→GPA (r=-0.06)
- `h1_study_sleep_gpa_confound.png` — study vs sleep scatter colored by GPA

**Key finding:** Study hours (r=+0.466) is the dominant GPA predictor. Sleep (r=-0.061) is non-significant. Within any study intensity group, sleep category changes GPA by less than 0.04 points.
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase3_deepdive/scripts/h1_sleep_gpa.py"))),

    nbf.v4.new_markdown_cell("""## H2 — STEM vs. Non-STEM Stress

**Hypothesis:** STEM students experience significantly higher stress, with Nursing and CS at the top.

**Scripts produce:**
- `h2_stress_by_major_violin.png` — violin plot for all 10 majors sorted by mean stress
- `h2_stem_vs_nonstm_stress.png` — box plot comparison with t-test annotation
- `h2_wellness_heatmap.png` — 2×6 wellness profile heatmap (STEM vs Non-STEM)
- `h2_stem_stress_by_year.png` — STEM vs Non-STEM stress across 4 academic years
- `h2_stress_bar_by_major.png` — horizontal bar: mean stress per major, STEM highlighted

**Key finding:** t=7.35, p<0.0001, Cohen's d=0.648. STEM students report 1.25 pts higher stress yet achieve identical GPA (3.07). Gap doubles from Year 1 to Year 2.
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase3_deepdive/scripts/h2_stress_major.py"))),

    nbf.v4.new_markdown_cell("""## H3 — Screen Time and Wellness

**Hypothesis:** Higher screen time → lower life satisfaction and higher stress. Social media is the key driver.

**Scripts produce:**
- `h3_screen_life_satisfaction.png` — scatter with OLS trendline colored by major type
- `h3_screen_vs_social_media_comparison.png` — side-by-side: total screen vs social media effect sizes
- `h3_wellness_by_screen_cat.png` — 4 wellness metrics × 3 screen categories (grouped bars)
- `h3_correlation_heatmap.png` — screen/social media × 5 wellness outcomes
- `h3_screen_sleep_wellness_interaction.png` — screen effect within sleep-deprived vs adequate sleep groups

**Key finding:** Screen time r=-0.255 (life sat), r=+0.305 (stress) — both p<0.001. Total screen time is a stronger predictor than social media alone. High-screen (>9hrs) students score 2.18 pts lower on life satisfaction. Effect is independent of sleep status.
"""),

    nbf.v4.new_code_cell(read_script(os.path.join(BASE, "phase3_deepdive/scripts/h3_screen_wellness.py"))),

    nbf.v4.new_markdown_cell("""## Summary

15 figures saved to `phase3_deepdive/figures/`.

| Hypothesis | Verdict | Key Statistic |
|-----------|---------|--------------|
| H1: Sleep → GPA | Nuanced (confound) | Study r=0.47; Sleep r=-0.06 (NS) |
| H2: STEM → Stress | Confirmed, large effect | t=7.35, d=0.648, +1.25 pt gap |
| H3: Screen → Wellness | Confirmed, moderate | r=-0.255 to -0.305 across all outcomes |

See `phase3_deepdive/report.md` for the full narrative analysis of all three hypotheses.
"""),
]
save_nb(nb3, os.path.join(BASE, "phase3_deepdive/notebook.ipynb"))

print("\nAll notebooks generated:")
print(f"  phase0_diagnostic/notebook.ipynb")
print(f"  phase1_univariate/notebook.ipynb")
print(f"  phase2_hypothesis/notebook.ipynb")
print(f"  phase3_deepdive/notebook.ipynb")

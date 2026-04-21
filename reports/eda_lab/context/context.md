# EDA Lab — Accumulating Context

> This file is the shared memory of the lab. The agent reads it at the start of each phase to understand what has already been discovered, what decisions were made, and what questions remain open. Students should not delete entries — only append.

---

## Dataset Overview

**Name:** Student Wellness & Academic Performance  
**File:** `dataset/student_wellness.csv`  
**Rows:** 535 (raw, before cleaning)  
**Columns:** 21  
**Generated:** 2026-04-11  

### Column Catalogue

| Column | Type (raw) | Description | Expected Range |
|--------|-----------|-------------|----------------|
| student_id | string | Unique student identifier | STU0001–STU0520 |
| age | float | Student age in years | 18–25 |
| gender | string | Gender identity | Male/Female/Non-binary/Prefer not to say |
| major | string | Academic major | 10 categories |
| year_in_school | float | Year (1=Freshman, 4=Senior) | 1–4 |
| gpa | object | Grade Point Average | 0.0–4.0 |
| study_hours_per_day | float | Daily study hours | 0–16 |
| attendance_rate | float | Class attendance % | 0–100 |
| sleep_hours_per_night | object | Average nightly sleep | 3–11 |
| exercise_days_per_week | object | Exercise frequency | 0–7 |
| screen_time_hours | float | Daily screen time (hrs) | 1–16 |
| social_media_hours | float | Daily social media (hrs) | 0–10 |
| caffeine_mg_per_day | object | Daily caffeine intake (mg) | 0–700 |
| stress_level | object | Self-reported stress (1–10) | 1–10 (CONTAMINATED with text) |
| anxiety_score | object | GAD-7 anxiety score | 0–21 |
| depression_score | object | PHQ-9 depression score | 0–27 |
| life_satisfaction | float | Life satisfaction (1–10) | 1–10 |
| num_clubs | object | Number of clubs/orgs | 0–6 |
| on_campus | object | Lives on campus | True/False (CONTAMINATED) |
| has_part_time_job | object | Has part-time job | Yes/No |
| monthly_spending | object | Monthly spending ($) | 200–2000 |

---

## Phase Updates

*Phases will append their findings here as the lab progresses.*

---
## Phase 0 — Data Orientation & Diagnostic (completed: 2026-04-11)

### Key Findings
- Dataset has 535 raw rows / 532 after deduplication; 21 columns
- 18 distinct data quality issues found across 10 columns
- Most pervasive issues: missing values in anxiety/depression (12.9%), sleep (9.9%), monthly_spending (9%), gpa (7.9%)
- Structural issues: gender had 12 variants (75 rows), on_campus had 10 boolean variants (60 rows), stress_level mixed numeric+text (20 rows)
- Impossible values: age (6 rows), GPA > 4.0 (8 rows), study hours > 18 (5 rows), sleep hours negative/> 16 (4 rows), attendance > 100% (10 rows)

### Cleaning Decisions Made
- Dropped 3 exact duplicate rows
- Impossible values → NaN → median imputation for all numeric columns
- GPA capped at 4.0 for values ≤4.3; larger outliers → NaN → median (3.12)
- Attendance rate capped at 100%
- Gender standardized to 4 canonical values
- stress_level text mapped: low→2.5, medium→5.0, high→7.5, very high→9.5
- on_campus standardized to True/False boolean
- All numeric missing values imputed with column median; categorical with mode

### Key Caveats for Future Phases
- anxiety_score and depression_score missingness may NOT be random (response bias from more severe students) — treat group means with caution
- stress_level for 20 text-imputed rows is an approximation
- Median imputation for GPA reduces variance slightly

### Open Questions for Next Phase
- Is there a bimodal pattern in screen_time_hours?
- Do the mental health variables cluster into types of student wellness profiles?
- Does the GPA distribution differ meaningfully by major?
## Phase 1 — Univariate Bootstrap (completed: 2026-04-11)

### Key Findings
- All numeric distributions are approximately symmetric (skewness all < 0.5) — no extreme skew requiring transformation
- **Sleep mean = 6.81 hrs** — below the 7-hr clinical recommendation; this is the most policy-relevant finding
- **Screen time mean = 7.56 hrs/day** — rivals sleep duration; large spread (1.4–14.4 hrs)
- Stress mean = 5.43/10 (moderate); anxiety mean = 6.07/21 (mild); depression mean = 5.05/27 (mild threshold)
- Life satisfaction (mean 5.43) inversely mirrors stress (mean 5.43) — strong negative correlation expected
- GPA mean = 3.07, left-skewed — minority of poor performers pull the mean down
- 40% of students hold part-time jobs; STEM = ~41% of sample; sample balanced by gender and year

### Top Candidate Variables for Phase 2 Hypotheses
- sleep_hours_per_night (key wellness + performance variable)
- screen_time_hours (lifestyle factor with high variance)
- stress_level (central wellness axis)
- gpa (main academic outcome)
- major (grouping variable — STEM vs. non-STEM contrast)

### Open Questions for Phase 2
- Does sleep < 6hrs significantly predict lower GPA?
- Does screen time mediate the stress–GPA relationship?
- Do STEM students show higher stress than non-STEM students?
- Is there a bimodal pattern in screen time by major or year?
## Phase 2 — Hypothesis Negotiation (completed: 2026-04-11)

### Hypotheses Generated
- Human: 5 hypotheses (sleep→GPA, STEM→stress, screen→wellness, job→study, year→anxiety)
- Agent: 7 hypotheses (overlapping + exercise→stress, job×study interaction, social media specific effect)
- Human missed: interaction effects; Agent missed: temporal/developmental framing

### Preview Results Summary
| Hypothesis | Result | Decision |
|-----------|--------|----------|
| H1 Sleep→GPA | r = -0.061 (NS) — surprising negative direction; confound with study hours | KEEP — reframed |
| H2 STEM→Stress | t = 7.35, p<0.0001 — strongest signal | SELECTED |
| H3 Screen→Wellness | r = -0.255 (satisfaction), r = 0.305 (stress) — both sig | SELECTED |
| H4 Job→GPA | Trivial effect (<0.01 GPA difference) | REJECTED |
| H5 Year→Anxiety | Modest trend (5.81→6.34), non-monotonic | REJECTED |

### Three Selected Hypotheses for Phase 3
- H1: Sleep→GPA — confound with study hours; reframed as "controlling for study hours"
- H2: STEM vs non-STEM stress — Nursing(6.67), CS(6.22) vs Psych(4.82), Econ(4.81)
- H3: Screen time → life satisfaction (r=-0.255) and stress (r=0.305)

### Open Questions for Phase 3
- Does controlling for study hours reveal a true sleep effect on GPA?
- Does STEM stress compound into worse mental health outcomes (anxiety, depression)?
- Is social media specifically (vs total screen time) the wellness driver in H3?
## Phase 3 — Deep Dive Analysis (completed: 2026-04-11)

### H1: Sleep vs GPA — Confound Revealed
- Study hours → GPA: r = 0.466 (strong, p<0.0001)
- Sleep hours → GPA: r = -0.061 (weak, p=0.159, non-significant)
- Within each study intensity group, sleep category makes <0.04 GPA difference
- Sleep and study hours barely correlated (r=-0.057) — students don't straightforwardly trade sleep for study
- Conclusion: Study time is the GPA lever, not sleep. Sleep's effect on GPA is confounded.

### H2: STEM vs. Non-STEM Stress — Confirmed, Large Effect
- STEM mean stress: 6.16 | Non-STEM: 4.91 | Gap: +1.25 pts
- t = 7.351, p < 0.0001, Cohen's d = 0.648 (medium-large)
- STEM also higher on: anxiety (+1.14), depression (+1.18), lower life satisfaction (-1.44)
- GPA is IDENTICAL (3.07) — STEM students pay more psychological cost for same academic output
- Gap grows year 1 → year 2 and persists through graduation
- Top stressed majors: Nursing (6.67), MechEng (6.43), CS (6.22)

### H3: Screen Time → Wellness — Confirmed, Moderate
- Screen time → life satisfaction: r = -0.255 (p<0.001)
- Screen time → stress: r = +0.305 (p<0.001)
- Social media (r=-0.158 satisfaction) is NOT stronger than total screen time — all screen types matter
- High screen (>9hrs): life sat 4.74 vs low screen (<5hrs): 6.92 — a 2.18 point gap
- Effect holds regardless of sleep status (r≈-0.30 in both sleep groups)

### Open Questions for Phase 4
- For H1: What happens if we segment by major type? Does sleep matter more for STEM GPAs?
- For H2: Can we quantify the "price of STEM" in wellness units per GPA point?
- For H3: What specific screen behaviors drive the effect? Is it displacement of social activity?
## Phase 4 — Per-Hypothesis Research Reports (completed: 2026-04-11)

### H1 Report: Sleep → GPA
- Final verdict: Study hours is the real driver (r=0.47); sleep is non-significant (r=-0.06)
- Within study intensity groups, sleep category explains <0.04 GPA points
- Advanced finding: The "confound" is that students don't clearly trade sleep for study — both may be driven by a latent self-regulation variable
- Report: phase4_reports/h1_sleep_gpa/report.md

### H2 Report: STEM vs. Stress
- Final verdict: Confirmed strongly — Cohen's d=0.648 (medium-large), p<0.0001
- STEM students pay 26% more stress per GPA point than non-STEM
- Gap emerges at Year 2 and persists; Nursing highest (6.67), Biology outlier (5.43)
- All 5 wellness metrics show STEM disadvantage; GPA is identical
- Report: phase4_reports/h2_stress_major/report.md

### H3 Report: Screen Time → Wellness
- Final verdict: Confirmed — r=-0.255 to -0.305 across outcomes, all significant
- Total screen time > social media as a predictor (partially refutes social media narrative)
- Dose-response: high screen (>9hrs) = 2.18 pts lower life sat than low screen (<5hrs)
- Effect independent of sleep deprivation — two separate pathways to wellness risk
- Wellness composite formula created: composite of stress, life sat, anxiety, depression
- Report: phase4_reports/h3_screen_wellness/report.md

### Key Cross-Cutting Insight
Three parallel stressors compound for STEM students: (1) high academic demands driving high study hours, (2) higher inherent stress from STEM culture, and (3) screen time potentially used as coping that further undermines wellness. The intersection of all three represents the highest-risk student profile.
## Phase 5 — Dashboard Design (completed: 2026-04-11)

### Dashboards Produced (Google Stitch)

| Dashboard | Folder | Hypothesis | Audience |
|-----------|--------|------------|----------|
| Executive Overview | executive_overview/ | H2 (STEM stress) | Administrators |
| Wellness Profile & Sentiment Matrix | wellness_profile/ | H2 + H3 combined | Counselors |
| Academic Deep-Dive | academic_deep_dive/ | H2 (major-level) | Faculty / Program directors |

### Key Design Decisions Documented
- Executive Overview: hero panel with "26% higher psychological cost" as dominant element; Sleep-GPA Paradox cross-reference callout linking H1 and H2 findings
- Wellness Profile: 2×5 heatmap (STEM vs Non-STEM × 5 wellness metrics) with clinical labels; "Selection Effect Paradox" narrative prose section; Correlation Matrix sidebar
- Academic Deep-Dive: horizontal bar chart for 10-major comparison; grouped bar for year progression; checkbox filter sidebar for program-level slicing

### Prompt Quality Lesson Documented in PROPOSAL.md
- Level 1 (bad) → Level 3 (good) progression shown
- Two approaches demonstrated: Full Report Dump vs. Curated Brief
- Refinement prompt examples provided for further iteration

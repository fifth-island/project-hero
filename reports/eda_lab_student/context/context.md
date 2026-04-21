# EDA Lab — Accumulating Context

> This file is the shared memory of the lab. The agent reads it at the start of each phase to understand what has already been discovered, what decisions were made, and what questions remain open. **Do not delete entries — only append.**

---

## Dataset Overview

**Name:** Student Wellness & Academic Performance  
**File:** `dataset/student_wellness.csv`  
**Rows:** 535 (raw, before cleaning)  
**Columns:** 21  

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
| stress_level | object | Self-reported stress (1–10) | 1–10 |
| anxiety_score | object | GAD-7 anxiety score | 0–21 |
| depression_score | object | PHQ-9 depression score | 0–27 |
| life_satisfaction | float | Life satisfaction (1–10) | 1–10 |
| num_clubs | object | Number of clubs/orgs | 0–6 |
| on_campus | object | Lives on campus | True/False |
| has_part_time_job | object | Has part-time job | Yes/No |
| monthly_spending | object | Monthly spending ($) | 200–2000 |

---

## Phase Updates

*Append your findings here at the end of each phase. Do not delete previous entries.*

---
## Phase 0 — Data Orientation & Diagnostic (completed: 2026-04-13)

### Key Findings
- **535 rows × 21 columns** raw; 520 unique student IDs
- **3 exact duplicate rows** (indices 189, 404, 488) → dataset becomes 532 after dedup
- **6 impossible ages** (−3, 0, 5, 150, 200, 999) — mean inflated to 23.8 vs. true median 21
- **75 rows (14%)** gender encoded inconsistently across 12 variants → maps to 4 canonical values
- **60 rows (11%)** on_campus encoded 10 different ways (YES, 1, true, no, etc.)
- **20 stress_level entries** are text ("low", "medium", "high", "very high") instead of numeric
- **8 GPA values** outside [0, 4] range; 42 missing (7.85%)
- **10 attendance_rate values** exceed 100%
- **4 extreme sleep_hours** (negative or > 16); 53 missing (9.91%)
- **5 impossible study_hours** (negative or > 16)
- **anxiety_score & depression_score** both have 12.9% missing (69 rows each) — highest missingness
- **397 total missing cells** across 9 columns (3.5% of dataset)
- Clean columns (no issues): major, year_in_school, screen_time_hours, social_media_hours, life_satisfaction

### Cleaning Decisions Made
- Drop 3 exact duplicate rows (keep first)
- Set 6 impossible ages to NaN (impute with median=21 later)
- Map gender variants to 4 canonical values: Male / Female / Non-binary / Prefer not to say
- Set 8 out-of-range GPA values to NaN
- Set 5 impossible study_hours to NaN
- Set 10 attendance_rate > 100 to NaN
- Set 4 extreme sleep_hours to NaN
- Map stress_level text: low→2, medium→5, high→8, very high→9.5; coerce rest to float
- Map on_campus variants to boolean True/False
- Defer imputation of all missing values to Phase 1 (need to assess missingness patterns first)

### Key Caveats for Future Phases
- anxiety_score and depression_score likely share missing rows — investigate MNAR (Missing Not At Random) vs. MAR before imputation
- stress_level text→number mapping (low→2, etc.) is a judgment call — sensitivity analysis may be needed
- After cleaning, ~50 GPA values will be NaN (42 original missing + 8 impossible) = ~9.4% — substantial for a key outcome variable
- attendance_rate > 100 could theoretically be extra credit; treated as error for now

### Open Questions for Next Phase
- Do anxiety_score and depression_score always go missing together? Is missingness correlated with stress, major, or year?
- What is the actual age distribution after removing impossibles — is it uniform 18–25 or skewed?
- Is GPA missingness associated with specific majors or year levels?
- What imputation strategy is appropriate for each column's missingness pattern?
- Are there any meaningful outliers (not impossible values) that need attention in Phase 1?

---
## Phase 1 — Univariate Bootstrap (completed: )

### Key Findings
- 

### Top Candidate Variables for Phase 2 Hypotheses
- 

### Open Questions for Phase 2
- 

---
## Phase 2 — Hypothesis Negotiation (completed: )

### Hypotheses Generated
- Human:
- Agent:

### Preview Results Summary
| Hypothesis | Result | Decision |
|-----------|--------|----------|
| | | |

### Three Selected Hypotheses for Phase 3
- H1:
- H2:
- H3:

### Open Questions for Phase 3
- 

---
## Phase 3 — Deep Dive Analysis (completed: )

### H1:
- 

### H2:
- 

### H3:
- 

### Open Questions for Phase 4
- 

---
## Phase 4 — Per-Hypothesis Research Reports (completed: )

### H1 Report:
- 

### H2 Report:
- 

### H3 Report:
- 

### Key Cross-Cutting Insight
- 

---
## Phase 5 — Dashboard Design (completed: )

### Dashboards Produced

| Dashboard | Folder | Hypothesis | Audience |
|-----------|--------|------------|----------|
| | | | |

### Key Design Decisions Documented
- 

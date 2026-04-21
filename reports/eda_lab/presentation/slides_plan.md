# Mastering EDA in the Age of AI Agents
## Presentation Slide Plan — Gemini Build Brief

**Total slides:** 29  
**Tone:** Professional, modern, data-forward. Think McKinsey deck meets developer conference keynote.  
**Color palette:** Dark navy (#1A3A5C) + white + pastel accents (soft blue #A8C8E8, mint #A8E8C8, rose #F4A8B0, peach #F4D8A8). Clean, minimal, high contrast.  
**Font:** Inter or Google Sans throughout. Bold numbers, small labels.  
**Icon style:** Flat line icons, consistent stroke weight.

---

## SECTION 1 — THE CONTEXT

---

### Slide 1 — Title Slide

**Title:** Mastering EDA in the Age of AI Agents  
**Subtitle:** A Structured Methodology for Going from Raw Data to Real Insights — Faster

**Visual:**  
Full-bleed dark navy background. Center-left: large white title text. Bottom-right: an abstract illustration of a data pipeline — nodes connected by glowing lines, flowing from a raw CSV icon → chart icons → report icon → dashboard icon. Subtle grid dot pattern in the background (like a neural net). Small institutional logo top-left.

**Speaker note area:** "This is not about using AI to skip the work. It's about using AI to go deeper than you ever could alone."

---

### Slide 2 — Plan for Today

**Title:** What We'll Cover

**Visual — Six section cards arranged in a clean 2×3 grid, each with a number, icon, and label:**

| # | Icon | Section | One-line description |
|---|------|---------|---------------------|
| 1 | 📊 | The Context | Why AI agents are changing how we do data science |
| 2 | 🛠 | Your Toolkit | The agents you have access to — including free options |
| 3 | 🔁 | The Methodology | A 6-phase framework from raw data to dashboard |
| 4 | ✅ | Best Practices | How to prompt, structure, and feed context effectively |
| 5 | 🔒 | The NDA Challenge | Working with confidential data without exposing it |
| 6 | 🧠 | The Human in the Loop | What the agent does — and what only you can do |

Cards use the pastel color palette (one color per section, matching the rest of the deck). Each card has a soft drop shadow and rounded corners.

**Bottom strip (navy):** *"90 minutes. Six sections. One methodology you can use on your next project tomorrow."*

---

### Slide 3 — The Numbers Don't Lie

**Title:** AI in Data Science Is No Longer Optional

**Visual — 4-stat infographic strip (horizontal):**  
Four large KPI cards side by side, each with a giant number and a small label below:

| Card | Number | Label | Color |
|------|--------|-------|-------|
| 1 | **62%** | of organizations actively using AI agents | Soft blue |
| 2 | **97%** | of analysts say AI accelerates their daily tasks | Mint |
| 3 | **81%** | of professionals want to master LLMs & agents | Peach |
| 4 | **87%** | of analysts report increased strategic importance | Rose |

Below the cards: a single sentence in italic gray — *"And yet: most are still using AI as a search engine, not a collaborator."*

**Source footnote:** McKinsey State of AI 2025 · Alteryx State of the Data Analyst 2025

---

### Slide 4 — The Gap

**Title:** The Problem: Most People Prompt, Not Direct

**Visual — Two-column comparison:**  

Left column (red-tinged, titled "How most people use AI"):
- Single giant prompt → single output
- Paste raw data → hope for the best
- One-shot analysis → "looks good, I guess"
- Illustrated with a stick figure dumping a bucket into a chatbot box

Right column (mint-tinged, titled "How experts use AI agents"):
- Structured phases → iterative outputs
- Curated context → precise responses
- Agent reviews its own work → iterates
- Illustrated with a stick figure at a control panel directing a pipeline

**Bottom:** A bold statement centered: *"The bottleneck is no longer compute. It's how well you can direct the agent."*

---

### Slide 5 — What Is an AI Agent?

**Title:** Agent vs. Chatbot — Not the Same Thing

**Visual — Diagram with two boxes and an arrow:**

Box 1 (left, gray): **Chatbot**  
- Input → Output  
- One turn  
- No memory  
- No tools  
- Can't run code

Arrow in the middle labeled: **"Give it tools + memory + a workflow"**

Box 2 (right, navy): **AI Agent**  
- Input → Plan → Execute → Observe → Adjust → Output  
- Multi-turn  
- Reads files, writes files  
- Runs code  
- Remembers context across sessions

Below: A circular diagram showing the agent loop — **Plan → Act → Observe → Reflect → Plan...**  
Each stage labeled with an icon: 🗺 Plan · ⚙️ Act · 👁 Observe · 🔄 Reflect

---

## SECTION 2 — YOUR TOOLKIT

---

### Slide 6 — The Agent Landscape

**Title:** Three Agents Worth Knowing

**Visual — Three large cards side by side:**

| Card | Agent | Access | Best For | Logo |
|------|-------|--------|----------|------|
| Left | **GitHub Copilot** | Free for students | Fast code generation, multi-model, VSCode native | GitHub Copilot logo |
| Center | **Claude** | Paid / Claude Code CLI | Deep reasoning, long context, complex analysis | Anthropic logo |
| Right | **Codex / ChatGPT** | Paid (Plus) | General purpose, strong at explanation | OpenAI logo |

Below each card: a one-line behavior note  
- Copilot: *"Plugs into your editor — works where you work"*  
- Claude: *"Longest context window — reads entire codebases"*  
- Codex: *"Great explainer — strong for teaching moments"*

**Bottom banner:** *"Master the methodology once — it transfers to all three."*

---

### Slide 7 — Free Access for Students

**Title:** You Already Have Access — Here's How

**Visual — Split layout with two large feature panels:**

**Left panel — GitHub Copilot (dark navy card):**  
- GitHub logo + Copilot icon, large, centered at top
- **"FREE for verified students"** in bold mint text
- Feature list with checkmarks:  
  ✓ Unlimited code completions  
  ✓ Multi-model: GPT-4o, Claude Sonnet, Gemini Flash  
  ✓ Agent Mode in VSCode  
  ✓ Next Edit Suggestions  
- QR code bottom-left linking to: `docs.github.com/en/copilot/...enable-copilot/set-up-for-students`
- Label: "Apply via GitHub Education"

**Right panel — Google Gemini (white card with Google colors):**  
- Google Gemini logo, large, centered at top
- **"Free trial available for students"** in bold blue text
- Feature list with checkmarks:  
  ✓ Gemini Advanced model  
  ✓ Deep Research  
  ✓ NotebookLM Plus  
  ✓ 2TB cloud storage  
- QR code bottom-right linking to: `gemini.google/students/`
- Label: "Sign up with your .edu email"

---

### Slide 8 — Where to Run Your Agent

**Title:** Your Workspace: VSCode + the Chat Panel

**Visual — A zoomed-in screenshot mockup of VSCode with three annotated zones:**

Left panel: file tree showing `agent.md`, `context.md`, `skills/`, `phase0_diagnostic/` — the project folder structure.

Center panel: an open Python script that the agent just wrote — visible code, clean and readable.

Right panel: the **VSCode Chat tab** (Copilot Chat / Claude extension panel) — a conversation UI embedded directly in the editor, showing a multi-turn exchange between user and agent.

Annotated with callout bubbles:  
- Arrow to file tree: *"Attach context files with @ — agent reads them before responding"*  
- Arrow to Chat panel: *"This is where you direct the agent — no terminal needed"*  
- Arrow to script: *"The agent writes this directly to disk — you review, it runs"*

**Bottom:** Two tool logos side by side — VSCode logo + GitHub Copilot Chat logo — with label:  
*"The Chat tab is built into VSCode. Free for students via GitHub Copilot."*

---

### Slide 9 — One Skill, All Agents

**Title:** Learn the Methodology Once — Use It Everywhere

**Visual — Hub-and-spoke diagram:**  
Center node: **"Structured EDA Methodology"** (large, bold)  
Spokes connecting to 5 outer nodes:  
- GitHub Copilot (with logo)  
- Claude Code (with logo)  
- ChatGPT / Codex (with logo)  
- Cursor (with logo)  
- Any future agent

Each spoke labeled: *"Same prompts. Same workflow. Same results."*

**Below the diagram:** A single bold quote:  
*"The skill is directing the analysis. The agent is just the engine."*

---

## SECTION 3 — THE METHODOLOGY

---

### Slide 10 — The 6-Phase EDA Framework

**Title:** A Repeatable Methodology for AI-Assisted EDA

**Visual — Vertical stacked phase cards (full height of slide):**  
Six cards, each with: phase number (large, left), phase name (bold), one-line purpose, and a right-side column showing Input → Output.

| # | Phase | Purpose | Input | Output |
|---|-------|---------|-------|--------|
| 0 | Data Orientation & Diagnostic | Understand what you're working with before touching it | Raw dataset | Quality audit + clean dataset |
| 1 | Univariate Bootstrap | Profile every variable individually | Clean dataset | Variable summaries + "So what?" per column |
| 2 | Hypothesis Negotiation | Decide what's worth investigating — before the agent does | Variable profiles | 3 prioritized hypotheses |
| 3 | Deep Dive Analysis | Build iterative, rigorous evidence per hypothesis | Hypotheses | Charts + statistical validation + growing report |
| 4 | Research Reports | Synthesize findings into structured, defensible documents | Analysis outputs | Standalone research report per hypothesis |
| 5 | Dashboard Design | Turn your report into a story anyone can read | Reports | PowerBI-style dashboard |

A thin vertical accent line on the left, color-coded from light blue (Phase 0) to dark navy (Phase 5), showing progression from exploratory to polished.

**Bottom strip (navy):** *"Each phase has a defined input, a defined output, and a clear question it answers. That's what makes it repeatable on any dataset."*

---

### Slide 11 — Phase 0: Never Skip the Audit

**Title:** Phase 0 — Understand the Data Before You Touch It

**Visual — Three-column layout:**

**Left — "What can go wrong in raw data" (icon list):**
- 🔴 Impossible values (ages of 999, negative prices, future dates in historical data)
- 🟡 Inconsistent encodings (True / true / 1 / yes / Y — all meaning the same thing)
- 🟡 Missing data with a pattern (not random — certain groups systematically don't respond)
- 🟡 Duplicates masquerading as real rows
- ⚪ Wrong data types (numbers stored as strings, dates as plain text)

**Center — "What the agent produces" (generic mockup):**  
A clean `quality_summary.csv` table with generic column names — issue types, affected row counts, and severity flags (High / Medium / Low). Below it: a simple `N rows (raw) → N rows (clean)` stat.

**Right — "The cleaning decision log" (concept):**  
A small markdown table mockup:
| Decision | Reason | Rows affected |
|----------|--------|--------------|
| Drop duplicates | Exact copies add no information | — |
| Null impossible values | Cannot impute fabricated data | — |
| Standardize encoding | Multiple variants → 1 canonical | — |

**Key lesson (bottom):** *"The goal of Phase 0 is not to clean the data. It is to understand it well enough to make informed cleaning decisions — and document every one of them."*

---

### Slide 12 — Phase 1: One Variable at a Time

**Title:** Phase 1 — Build Intuition Before Looking at Relationships

**Visual — Left/right split:**

**Left — "Three questions to ask about every variable":**

📐 **Shape** — Is it symmetric, skewed, bimodal? What does the shape tell us about the population?

📍 **Center & Spread** — Where does most of the data sit? How wide is the variance?

🚩 **Anomalies** — Are there outliers? Unexpected spikes? A suspiciously round distribution?

**Right — Generic chart thumbnails (illustrative, no real data):**  
- A histogram with KDE overlay and dashed mean/median lines
- A box plot with a visible outlier cluster
- A frequency bar chart with one dominant category

**Bottom — The "So what?" rule (full width, navy bar):**  
*"Every variable needs a 'So what?' sentence before moving on. Not 'Variable X has a mean of Y' — but 'What does this tell us about the people or things in this dataset?'"*

---

### Slide 13 — Phase 2: Hypotheses Before Analysis

**Title:** Phase 2 — The Human and the Agent Don't Think the Same Way

**Visual — Full-width three-panel layout:**

**Left panel (peach) — "Human hypotheses":**  
Icon: person thinking  
- Driven by domain knowledge and intuition  
- Strong on contextual and narrative connections  
- Tend toward direct, simple relationships  
- Often miss statistical interaction effects

**Center panel (mint) — "The negotiation":**  
Icon: two-way arrow / handshake  
- Both lists are compared side by side  
- Overlapping hypotheses = high confidence  
- Human-only = domain insight the agent can't see  
- Agent-only = statistical pattern intuition missed  
- **3 hypotheses selected together**

**Right panel (soft blue) — "Agent hypotheses":**  
Icon: robot / sparkle  
- Driven by statistical patterns in the data  
- Catches interaction effects and non-obvious correlations  
- Tends toward multi-variable complexity  
- Misses temporal, cultural, domain-specific context

**Key lesson (bottom):** *"Write your list first. Always. If you look at the agent's list before writing your own, you will anchor to it — and lose the most valuable part of the exercise."*

---

### Slide 14 — Phase 2: Not All Signals Are Equal

**Title:** Phase 2 — Quick Previews Rank the Hypotheses

**Visual — A 2×3 grid of generic, illustrative chart thumbnails:**  
No real data — just shapes showing different signal strengths:

| Thumbnail | Signal | Decision |
|-----------|--------|----------|
| Scatter with clear upward slope | Strong positive correlation | ✅ Selected |
| Box plots with no overlap between groups | Clear group difference | ✅ Selected |
| Scatter with moderate downward slope | Moderate negative correlation | ✅ Selected |
| Box plots with nearly identical distributions | No effect | ❌ Rejected |
| Bar chart with slight, non-monotonic trend | Weak, non-significant | ❌ Rejected |

Each thumbnail has a colored badge: green (Selected) or gray (Rejected).

**Right sidebar (navy card) — Selection criteria:**
- **Effect size** — is the difference large enough to matter in practice?
- **Statistical significance** — is it likely real, not noise?
- **Analytical depth** — is there more to explore here?
- **Audience relevance** — does this answer a question someone cares about?

**Key lesson (bottom):** *"A rejected hypothesis is not a failed hypothesis. 'This relationship does not exist in this data' is a result — and often the most interesting one."*

---

### Slide 15 — Phase 3: The Iterative Loop

**Title:** Phase 3 — The Agent Runs. You Direct.

**Visual — Large circular loop diagram (center):**  
5 nodes in a circle connected by directional arrows:

1. **Base chart** — agent generates the most fundamental visualization for the hypothesis
2. **Run & observe** — agent executes, reviews its own output, reports what it found
3. **You describe** — you characterize what you see (patterns, surprises, clusters, outliers)
4. **Agent proposes** — 3 next-step options (go deeper / add subgroup / find counterevidence)
5. **You direct** — you choose one; loop repeats

Arrow labels:
- 1→2: *"agent writes + runs immediately"*
- 2→3: *"agent interprets; you read the figure"*
- 3→4: *"your observation is the input"*
- 4→5: *"your judgment drives the analysis"*
- 5→1: *"continues until hypothesis is confirmed, rejected, or nuanced"*

**Left sidebar — prompt template (code block):**
```
The chart shows [your observation].
What should we look at next?
Give me 3 options:
1. Go deeper on this finding
2. Look at a related variable
3. Look for counterevidence
```

**Key lesson (bottom):** *"You describe. The agent proposes. You decide. This is what direction looks like."*

---

### Slide 16 — Phase 4: Structure Is Persuasion

**Title:** Phase 4 — Build the Analytical Argument, Section by Section

**Visual — Center: a document structure diagram:**  
A tall document icon with 9 labeled sections shown as horizontal bands, color intensity increasing top to bottom (light → dark = basic → advanced):

| Band | Section | Complexity |
|------|---------|-----------|
| 1 | Background | ░ Lightest |
| 2 | Variable Definitions | ░░ |
| 3 | Descriptive Overview | ░░ |
| 4 | Relationship Exploration | ░░░ |
| 5 | Subgroup Analysis | ░░░ |
| 6 | Statistical Evidence | ░░░░ |
| 7 | Advanced Analysis | ░░░░ ← *Earned, not rushed* |
| 8 | Conclusion | ░░░░░ |
| 9 | Implications | ░░░░░ Darkest |

**Right side — two contrasting conclusion examples (generic):**

❌ Weak conclusion (red left border):  
*"[Variable A] appears to be somewhat related to [Variable B] in some cases."*

✅ Strong conclusion (green left border):  
*"[Variable A] significantly predicts [Variable B] (test statistic, effect size, p-value). The effect holds across [subgroups] but disappears under [condition]. This suggests [mechanism], with implications for [decision-maker]."*

**Key lesson (bottom):** *"Structure is persuasion. A report that builds logically from context to conclusion is more convincing than a chart collection — even with identical underlying analysis."*

---

### Slide 17 — Phase 5: Brief First, Design Second

**Title:** Phase 5 — The Quality of Your Brief Determines the Quality of Your Dashboard

**Visual — Three-step horizontal flow (large icons, arrows between):**

**Step 1 — Generate the brief (Claude Code):**  
Icon: terminal / agent  
Input: research report  
Output: `dashboard_brief.md`  
Contains: key message (1 sentence) · 3 KPI values · 2 main charts · 1 insight callout · filter controls needed

**Step 2 — Build the Stitch prompt (you):**  
Icon: person writing  
Takes the brief → turns it into a detailed design prompt: title, audience, layout, exact values, chart types, color coding, interactivity

**Step 3 — Generate in Stitch (AI design tool):**  
Icon: Google Stitch logo  
Input: detailed prompt → Output: polished PowerBI-style dashboard

**Below — two-level prompt comparison:**

Level 1 (gray, red badge): `"Make a dashboard about my analysis"`  
→ Generic output. Agent decides everything. Key finding buried.

Level 3 (navy, green badge): `"Title: [X]. Audience: [Y]. KPI 1: [value + label]. Main chart: [type, variables, colors]. Insight callout: [exact finding]. Filters: [list]."`  
→ Precise output. Nothing left to chance.

**Key lesson (bottom):** *"Dashboards are arguments. Every visual element should serve the key message. If a chart doesn't support the main finding, cut it."*

---

## SECTION 4 — BEST PRACTICES

---

### Slide 18 — The Three-File System

**Title:** Your Agent Needs a Memory. Give It One.

**Visual — Three-card layout:**

**Card 1 — agent.md (blue)**  
Icon: robot / gear  
*"The agent's operating manual"*  
- Visualization standards (palette, fonts)
- Script standards (self-contained, docstrings)
- Report writing rules ("So what?" required)
- *Attach at the start of every session*

**Card 2 — context.md (mint)**  
Icon: layers / accumulating stack  
*"The lab's shared memory"*  
- Grows across phases  
- Carries all findings forward  
- Agent reads it before every session  
- *Update at the end of every phase*

**Card 3 — skill_phaseN.md (peach)**  
Icon: map / compass  
*"The phase workflow guide"*  
- Step-by-step for each phase  
- Prompts, outputs, teaching points  
- *Swap in the relevant one at the start of each phase*

**Bottom:** A prompt code snippet showing the syntax:  
```
@agent/agent.md @skills/skill_phase1.md @context/context.md

[Your prompt here]
```

---

### Slide 19 — The Notebook Trap

**Title:** Don't Ask AI to Do EDA in Jupyter Notebooks

**Visual — Split layout:**

**Left (the trap, red-tinged):**  
Icon: Jupyter notebook logo with a warning sign overlaid.  
List of problems:
- 🔴 Token bloat — a single plot adds thousands of tokens
- 🔴 Hidden state — cell execution order creates invisible bugs
- 🔴 Agent gets stuck — especially on freemium tiers
- 🔴 Reproducibility problems — notebooks are not programs

Stat callout: *"A notebook with a few hundred lines can contain 250,000+ characters — mostly base64 image data."*

**Right (the solution, mint-tinged):**  
Icon: Python `.py` file + markdown `.md` file  
List of benefits:
- ✅ Scripts are linear, debuggable, re-runnable
- ✅ Markdown files are token-efficient
- ✅ Agent can generate notebooks FROM scripts (not in them)
- ✅ No hidden state — what you see is what runs

**Bottom arrow (full width):** Scripts + Markdown → *(at the end of each phase)* → Notebook as archival artifact

---

### Slide 20 — Markdown Is Your Best Friend

**Title:** Feed AI Markdown, Not PDFs

**Visual — Token efficiency infographic (center):**

Large comparison of three document formats side by side:

| Format | Example | Tokens used |
|--------|---------|-------------|
| HTML | `<h1 class="title-large font-bold text-xl">My Title</h1>` | **23 tokens** |
| Markdown | `# My Title` | **3 tokens** |
| PDF / image | [rendered binary] | **400+ tokens** |

Large bold callout: **"Markdown saves up to 70% on tokens vs. other formats"**  
*(Source: markdownconverters.com)*

**Below — practical tip box (navy background):**  
> ✅ `.md` files — findings, decisions, column catalogues  
> ✅ `.csv` summaries — small, structured, readable  
> ✅ Plain text stat outputs  
> ❌ PDFs — layout overhead  
> ❌ Excel / xlsx — binary format  
> ❌ Images of charts — base64 explosion

---

### Slide 21 — Prompt Quality Is Everything

**Title:** The Agent Is Only As Good As Your Brief

**Visual — Three-level prompt progression (stacked bars):**

**Level 1 (red bar):**  
`"Analyze my data"`  
→ Generic summary, no charts, no insights

**Level 2 (yellow bar):**  
`"Create a chart comparing Group A vs Group B on Metric X"`  
→ A plain chart, no statistical test, no annotation

**Level 3 (green bar):**  
`"Generate a horizontal bar chart of [Metric X] by [Category] (N bars), sorted highest to lowest. Color Group A bars soft blue, Group B bars rose. Add a dashed line at the overall mean. Label each bar with its exact value. Compute and annotate the appropriate statistical test. Append the finding to [report file]."`  
→ Publication-quality chart + statistical validation + report entry

**Bottom:** *"Specificity is a skill. Vague in → vague out."*

---

### Slide 22 — Context Accumulation

**Title:** The Agent Should Never Start from Scratch

**Visual — Horizontal accumulation timeline:**  
A horizontal arrow labeled "Project progress →"

Above the arrow, colored blocks representing what gets added at each phase — generic labels:
- Phase 0 → *"N issues found, cleaning decisions documented"*
- Phase 1 → *"+ variable profiles, distributions, key stats"*
- Phase 2 → *"+ 3 hypotheses selected, preview results"*
- Phase 3 → *"+ charts, statistical tests, subgroup findings"*
- Phase 4 → *"+ 3 standalone research reports"*

Below the arrow: a `context.md` icon that grows visually larger across phases.

**Callout box (right, navy):**  
*"Every finding you document in context.md is a finding the agent can use — immediately — in the next phase. Skip it and you start from zero."*

---

## SECTION 5 — THE NDA CHALLENGE

---

### Slide 23 — The Data Privacy Problem

**Title:** What About Confidential Data?

**Visual — Center diagram:**  
A large lock icon in the center.  
Left: "Your company's data" (database icon)  
Right: "AI agent" (robot icon)  
Between them: a red X on the arrow, labeled *"Most commercial AI models may use your inputs for training"*

**Below:** Three enterprise logos in gray (OpenAI, Anthropic, Google) with the note:  
*"Standard consumer tiers: your data may be used for training unless you opt out or use enterprise tiers."*

**Bottom:** Bold question: *"So how do you get AI help without exposing confidential data?"*  
Answer setup: *"Three approaches — and one requires no data sharing at all."*

---

### Slide 24 — Approach 1: Share Outputs, Not Data

**Title:** Run the Analysis Yourself. Share Only What It Produced.

**Visual — Left/right split:**

Left: Illustration of a user running a notebook on their own machine. Raw data stays local. Notebook produces: charts (PNG), summary tables, markdown reports.

Right: The AI agent receives only OUTPUT files — images, tables, summaries. No raw rows ever leave the machine.

**Step diagram (center):**
1. You run the analysis locally
2. You collect the outputs (charts, stats)
3. You share outputs: *"Here's what the analysis produced — help me interpret and write this up"*
4. Agent produces interpretations, reports, dashboards

**Use case label (bottom):** *"Best for: highly sensitive data where even column names can't leave the building."*

---

### Slide 25 — Approach 2: Share the Shape, Not the Rows

**Title:** Describe the Data Without Sharing It

**Visual — A mock "data fingerprint" card (generic columns):**

| Column | Type | Min | Max | Mean | Most Frequent | Missing % |
|--------|------|-----|-----|------|--------------|-----------|
| record_id | string | — | — | — | — | 0% |
| age | float | 18 | 94 | 52.3 | — | 1.2% |
| category | string | — | — | — | "Type A" (34%) | 3.1% |
| revenue | float | 0 | 2.4M | 84K | — | 0% |

**Below — agent prompt example:**
```
Here is the column-level profile of our dataset (no raw data).
Based on this profile, suggest the 5 most analytically interesting 
relationships to explore and the best chart type for each.
```

**Use case label:** *"Best for: most enterprise scenarios — 80% of AI's analytical value, 0% data exposure."*

**Tip callout:** *"Collect this profile with 10 lines of pandas, or export it from Excel's Data Profile tool."*

---

### Slide 26 — Approach 3: Use Enterprise Agents

**Title:** Your Company's Agent Plays by Different Rules

**Visual — Three-tier pyramid (bottom to top):**

Tier 1 (bottom, gray): **Free / Consumer tier** — OpenAI.com, Claude.ai, Gemini.com  
- Data may be used for training · Not suitable for confidential data

Tier 2 (middle, blue): **API / Developer tier** — OpenAI API, Anthropic API  
- Data not used for training (by default) · Requires developer setup

Tier 3 (top, gold): **Enterprise tier** — Azure OpenAI, Google Vertex AI, Anthropic Enterprise  
- Data stays in your company's environment  
- Covered by enterprise data agreements  
- Often provisioned directly to employees

**Callout (right, navy card):**  
*"If your company provides you with an enterprise AI tool — Microsoft 365 Copilot, Google Workspace Gemini, or a custom internal tool — that's your green light. Company data can go in."*

---

## SECTION 6 — THE HUMAN IN THE LOOP

---

### Slide 27 — What AI Does vs. What You Do

**Title:** The Agent Executes. You Direct.

**Visual — Two-column responsibility matrix:**

| The Agent Does | You Do |
|---------------|--------|
| Writes the script | Decides what to analyze |
| Runs the code | Interprets the output |
| Proposes next steps | Chooses which direction |
| Drafts the report | Checks every number |
| Suggests hypotheses | Writes your own first |
| Formats the dashboard | Decides what story to tell |

**Below:** Bold framing statement:  
*"The agent is fast. You are the one who knows what matters."*

**Venn diagram (bottom):**  
Left circle: "What AI does well" (speed, pattern recognition, code generation, formatting)  
Right circle: "What humans do well" (domain knowledge, ethical judgment, narrative, critical thinking)  
Overlap: *"The collaboration zone — where the best work happens"*

---

### Slide 28 — The Skill Progression

**Title:** From Prompt-and-Hope to AI-Native Analyst

**Visual — Four-stage progression ladder (bottom to top):**

**Stage 1 (bottom, gray):** Prompt-and-Hope  
- One-shot prompts · Accepts all outputs · No context management  
- *"Can you analyze my data?"*

**Stage 2 (blue):** Structured Prompter  
- Attaches files with @ · Knows when to reject output · Uses iterative prompts  
- *"Generate the diagnostic script and run it. Flag anything unexpected."*

**Stage 3 (teal):** Agent Director  
- Builds context files · Designs multi-phase workflows · Directs, doesn't just react  
- *"I'll take option 2. Go one level deeper if the result is significant."*

**Stage 4 (top, gold):** AI-Native Analyst  
- Designs reproducible workflows · Handles NDA constraints elegantly · Scales across datasets  
- Produces research-quality outputs in hours, not weeks

**Right callout:** *"The methodology in this deck takes you from Stage 1 to Stage 3. Stage 4 is practice."*

---

### Slide 29 — Key Takeaways + Resources

**Title:** The Six Things to Remember

**Visual — Six large numbered tiles in a 2×3 grid:**

| # | Tile | Color |
|---|------|-------|
| 1 | **Direct, don't just prompt.** Give the agent a workflow, not a question. | Navy |
| 2 | **Scripts + Markdown first. Notebooks last.** Never do EDA live in a notebook. | Soft blue |
| 3 | **Feed markdown, not PDFs.** 70% fewer tokens. 100% more reliable. | Mint |
| 4 | **Context is memory.** A well-maintained context file is worth more than a perfect prompt. | Peach |
| 5 | **Confidential data? Share the shape, not the rows.** Column profiles unlock 80% of AI's value. | Rose |
| 6 | **Master one agent. Transfer everywhere.** Copilot, Claude, Codex — the methodology is the same. | Teal |

**Bottom strip — Resources (three QR codes in a row):**
- QR 1: GitHub Copilot for students — `docs.github.com/en/copilot/.../set-up-for-students`
- QR 2: Gemini for students — `gemini.google/students/`
- QR 3: Lab starter files (if distributing)

**Footer:** *"The future of data science isn't writing more code — it's asking better questions."*

---

## Slide Count Summary

| Section | Slides | Slide Numbers |
|---------|--------|--------------|
| 1 — The Context | 5 | 1–5 |
| 2 — Your Toolkit | 4 | 6–9 |
| 3 — The Methodology | 8 | 10–17 |
| 4 — Best Practices | 5 | 18–22 |
| 5 — The NDA Challenge | 4 | 23–26 |
| 6 — The Human in the Loop | 3 | 27–29 |
| **Total** | **29** | |

---

## Notes for Gemini Build

- Use **Google Sans** or **Inter** throughout
- Dark navy (#1A3A5C) for section headers and key callout cards
- Pastel palette for chart colors: #A8C8E8 (blue), #F4A8B0 (rose), #A8E8C8 (mint), #F4D8A8 (peach)
- White (#FFFFFF) or near-white (#FAFAFA) backgrounds for content slides
- All data tables: light gray row alternation, no heavy borders
- Chart thumbnails on slides 11, 13: illustrative shapes only — no real dataset values or labels
- Logos: use official SVG versions from each company's brand kit
- QR codes: generate from the exact URLs provided in slides 7 and 29
- Icon set: use Google Material Icons or Phosphor Icons (both free, consistent stroke weight)
- Slide transitions: fade only — no animations on individual elements

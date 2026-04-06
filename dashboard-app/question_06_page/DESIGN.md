# Design System Document

## 1. Overview & Creative North Star: The Scholarly Archivist
This design system is built upon the "Scholarly Archivist" North Star. It bridges the gap between a high-density environmental research laboratory and the rich, tactile heritage of a Chinatown cultural epicentre. The experience is designed to feel like a digital manuscript: authoritative, layered, and deeply intentional.

We break the "standard dashboard" template by rejecting rigid, boxy layouts in favor of **Intentional Asymmetry**. By overlapping data visualizations with subtle cultural motifs and using high-contrast typography scales, we create an editorial experience that feels more like an immersive research journal than a sterile software tool. This system honors the past while processing the future of environmental data.

## 2. Colors
Our palette is rooted in the "Five Elements" philosophy, adapted for a modern research interface. It prioritizes tonal depth over flat UI conventions.

*   **Primary Palette (Heritage Red):** `primary` (#6f070f) and `primary_container` (#902223). These are used for primary actions and brand-heavy headers, providing a sense of historical authority.
*   **Secondary Palette (Earthy Ochre):** `secondary` (#87512d) and `secondary_container` (#feb78a). These represent the earth and physical environment being researched.
*   **Tertiary Palette (Jade & Forest):** `tertiary` (#003e2f) and `tertiary_container` (#005744). Reserved for interactive success states, data growth trends, and environmental "health" indicators.
*   **Surface & Neutrals:** A sophisticated range from `surface_container_lowest` (#ffffff) to `surface_dim` (#eed8a6).

### The "No-Line" Rule
To maintain a premium editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts. For example, a `surface_container_low` sidebar should sit directly against a `surface` background. The eye should perceive the edge through the shift in warmth and value, not a black line.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical materials—like heavy vellum or lacquered wood.
*   **Base:** `surface`
*   **Sectioning:** `surface_container_low`
*   **Interactive Cards:** `surface_container` or `surface_variant`
*   **High-Priority Overlays:** `surface_container_highest`

### The "Glass & Gradient" Rule
For floating elements (modals or hover states), utilize **Glassmorphism**. Use a semi-transparent `surface` color with a 12px-20px backdrop-blur. To give buttons "soul," use a subtle linear gradient from `primary` to `primary_container` at a 45-degree angle.

## 3. Typography
The typography system is a dialogue between the traditional and the technical.

*   **Display & Headlines (Newsreader):** A sophisticated serif that evokes traditional Chinese calligraphy strokes and academic prestige. Use `display-lg` for environmental milestones and `headline-md` for section titles.
*   **Data & UI (Manrope):** A clean, geometric sans-serif designed for high-legibility analytics. Use `title-md` for card labels and `body-sm` for dense environmental data points.
*   **Branding Integration:** The Tufts University logo should be treated with a "collaborative seal" approach. Place it within a `secondary_container` element with a reduced opacity, making it feel like a stamped wax seal of approval on the research project.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, mimicking the way light hits physical artifacts.

*   **The Layering Principle:** Instead of using shadows to create lift, place a `surface_container_lowest` card on a `surface_container_low` background. This "paper-on-paper" look is more sophisticated than standard shadows.
*   **Ambient Shadows:** If a component must float (e.g., a critical alert), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(36, 26, 0, 0.06);`. The shadow must use a tint of the `on_surface` color, never pure grey.
*   **The "Ghost Border" Fallback:** For accessibility in high-density data tables, use a "Ghost Border": `outline_variant` at 15% opacity.
*   **Motif Integration:** Use subtle lattice patterns or cloud motifs (from the design system assets) as watermarks within the `surface_container_high` tier. They should be barely visible (3-5% opacity), providing texture without distracting from data.

## 5. Components

### Buttons
*   **Primary:** Heritage Red gradient with `on_primary` text. `md` (0.375rem) roundedness to feel modern yet sturdy.
*   **Secondary:** Jade Green (`tertiary`) text on a `tertiary_fixed` background. No border.
*   **Tertiary:** Transparent background with `secondary` text and a subtle cloud-motif underline on hover.

### Cards & Data Modules
*   **Construction:** Forbid divider lines. Separate content using 24px/32px vertical white space or by nesting a `surface_container_lowest` child inside a `surface_container` parent.
*   **Visual Interest:** Data cards should feature an asymmetrical "header" using a subtle lattice-work background pattern in the top-right corner.

### Inputs & Selectors
*   **Text Inputs:** Filled style using `surface_container_low`. On focus, transition the background to `surface_container_high` with a 2px `primary` bottom-border only.
*   **Checkboxes/Radios:** Use `tertiary` (Jade) for the "selected" state to signify a positive environmental connection.

### Research-Specific Components
*   **The Data Seal:** A custom chip variant for verified research data. It uses a circular shape with a lattice border and `primary` text, resembling a traditional red ink stamp.
*   **Environmental Legend:** A floating glassmorphic panel in the bottom-left corner, providing context for map-based data visualizations.

## 6. Do's and Don'ts

### Do:
*   **Do** embrace negative space. The "Chinatown" aesthetic is rich, so the UI needs room to breathe to remain "High-Tech."
*   **Do** use asymmetrical layouts. For example, a wide data map paired with a narrow, tall insights column.
*   **Do** ensure the Tufts University logo is always accompanied by the "Environmental Research Collaboration" label in `label-sm` Manrope.

### Don't:
*   **Don't** use 1px solid black or grey borders. Use background tonal shifts or 15% opacity ghost borders.
*   **Don't** use standard "Material Blue" for links. Use Gold (`secondary_container`) or Jade (`tertiary`).
*   **Don't** overcrowd the screen with patterns. Patterns are for textures and watermarks, not primary UI containment.
*   **Don't** use sharp corners. Always use at least the `DEFAULT` (0.25rem) roundedness to maintain a "weathered" and approachable heritage feel.
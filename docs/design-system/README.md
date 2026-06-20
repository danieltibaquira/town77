# Town 77 Design System

Comprehensive design documentation for Town 77 multiplayer strategy game.

## Contents

### 1. [Specification](spec-theme-and-voice.md)

Complete design system reference (11 sections):

1. **Purpose & Scope** — What this spec is, who uses it, non-AI philosophy
2. **Principles** — 5 core principles (constrain, imperfection, motion, accessibility, human-in-loop)
3. **Token Hierarchy** — 3-layer architecture (primitives, semantic, component)
4. **Token Naming Conventions** — Rules for kebab-case, semantic prefixes, consistency
5. **Animation Presets & Motion Personalities** — 3 personas (calm, playful, flashy)
6. **Sound & Particle Assets** — Optional sound bank, fallback accessibility
7. **Asset Guidelines & Shapes** — SVG requirements, hand-crafting, contrast validation
8. **Component API Reference** — Variant props for Chip, Cell, Grid, Hand, ActionBar, PlayerBadge
9. **Creating a New Theme — Step by Step** — Complete walkthrough with code examples
10. **Case Study: Town 77 Theme** — Reference implementation, design rationale, accessibility audit
11. **Design Review Checklist & Accessibility** — QA checklist, anti-pattern catches, reviewer roles

### 2. Getting Started

**For designers**: Read sections 1–2, then jump to section 10 (Town 77 case study) for inspiration.

**For developers**: Read sections 3–9, starting with the token hierarchy (section 3).

**For theme authors**: Follow section 9 step-by-step, using the template in `packages/client/src/themes/_template.ts`.

### 3. Quick Links

- **Design Philosophy**: [Principles (Section 2)](spec-theme-and-voice.md#2-principles)
- **How to Create a Theme**: [Step-by-Step Guide (Section 9)](spec-theme-and-voice.md#9-creating-a-new-theme--step-by-step)
- **What Makes Good Design**: [Design Review Checklist (Section 11)](spec-theme-and-voice.md#11-design-review-checklist--accessibility)
- **Inspiration**: [Town 77 Case Study (Section 10)](spec-theme-and-voice.md#10-case-study-town-77-theme)

### 4. Key Concepts

#### Tokens

Design decisions expressed as CSS custom properties:
- **Primitives**: Global values (colors, spacing, timing, easing)
- **Semantic**: Theme-injected meanings (surfaces, text colors, chip palette)
- **Component**: Per-widget compositions (shadow, animation, size)

Example: `--chip-color-1` is a semantic token; `--duration-fast` is a primitive.

#### Themes

A theme bundles:
- 7 SVG shapes (architectural silhouettes)
- 7 colors (chip palette)
- 6 surface colors (backgrounds, states)
- 2 fonts (display, UI)
- 1 motion preset (animation parameters)

#### Motion Personalities

3 animation personas define the "feel" of a theme:
- **Calm**: Slow, meditative (stiffness 100, damping 25)
- **Playful**: Energetic, spring-like (stiffness 260, damping 20)
- **Flashy**: Aggressive, arcade-like (stiffness 350, damping 15)

#### Anti-Patterns to Avoid

- ❌ Procedurally generated designs (no AI-generic output)
- ❌ Stock icons or palettes
- ❌ Generic easing curves (ease-in-out)
- ❌ Hardcoded colors (use tokens)
- ❌ Perfect symmetry (add subtle imperfection)
- ❌ Audio-only feedback (always provide visual)

### 5. Tools & Resources

#### Color Validation

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — WCAG AA validation
- [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis/) — Test for color blindness

#### Font Resources

- [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) — Display font (Town 77)
- [Inter](https://fonts.google.com/specimen/Inter) — UI font (Town 77)
- [Google Fonts](https://fonts.google.com/) — Explore alternatives

#### SVG Tools

- **Figma**: Sketch shapes, right-click > Copy SVG code
- **Illustrator**: Export as SVG, extract `<path>` element
- **Inkscape**: Free, open-source SVG editor

#### Animation Tools

- [Framer Motion](https://www.framer.com/motion/) — React animation library (used in Town 77)
- [Spring Physics Visualizer](https://www.framer.com/motion/) — Adjust stiffness/damping interactively

### 6. Reference Implementation

**Theme**: Town 77 (default)  
**Location**: `packages/client/src/themes/town77.ts`  
**Colors**: Warm earthy palette (terracotta, slate, forest)  
**Shapes**: Colonial American architecture  
**Motion**: Playful spring preset  

See [Case Study: Town 77 Theme](spec-theme-and-voice.md#10-case-study-town-77-theme) for full details.

### 7. Accessibility

All themes and components must meet [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/):

- Color contrast ≥ 4.5:1 for text and interactive elements
- Keyboard navigation (Tab, Enter, Arrow keys, Escape)
- Screen reader support (ARIA labels, semantic HTML)
- `prefers-reduced-motion` respected (animations disabled for users who prefer)
- Focus indicators visible on all interactive elements
- Responsive text sizing (11px–56px)

### 8. Contributing

When adding or modifying themes/components:

1. **Review the spec**: Ensure you understand the design principles (section 2)
2. **Follow conventions**: Use CSS tokens, kebab-case naming, semantic colors
3. **Test accessibility**: Validate contrast, keyboard nav, screen readers
4. **Use design review checklist**: [Section 11](spec-theme-and-voice.md#11-design-review-checklist--accessibility)
5. **Write tests**: Snapshot tests, prop combinations, token validation
6. **Document rationale**: Why did you make this choice? What inspired it?

### 9. Questions?

- **"How do I create a theme?"** → [Section 9: Step-by-Step Guide](spec-theme-and-voice.md#9-creating-a-new-theme--step-by-step)
- **"What makes good design?"** → [Section 2: Principles](spec-theme-and-voice.md#2-principles) + [Section 10: Town 77 Case Study](spec-theme-and-voice.md#10-case-study-town-77-theme)
- **"How do I avoid AI-generic output?"** → [Section 2.6: Avoid Generic AI Slop](spec-theme-and-voice.md#26-avoid-generic-ai-slop)
- **"Is my theme ready for merge?"** → [Section 11: Design Review Checklist](spec-theme-and-voice.md#11-design-review-checklist--accessibility)

---

**Last Updated**: 2026-06-10  
**Version**: 1.0  
**Status**: Approved (Phase 3.5)

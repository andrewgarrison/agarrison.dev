# 🛠️ Portfolio Project Roadmap

This is my public plan for three side projects I'm building to sharpen my skills and try out ideas I've wanted to explore. I'm keeping it here to hold myself accountable. Each project will move from **Planned** to **In progress** to **Shipped**, and once all three are live on this site, this file will be removed.

| # | Project | Status | Target | Links |
|---|---------|--------|--------|-------|
| 1 | Performance-first browser game (three.js) | 🔲 Planned | TBD | — |
| 2 | Design system from scratch | 🔲 Planned | TBD | — |
| 3 | Real-time, offline-first collaborative app | 🔲 Planned | TBD | — |

**Status key:** 🔲 Planned · 🚧 In progress · ✅ Shipped

---

## 1. Performance-first browser game (three.js)

**Why:** A small, polished 3D game that's fun to play and easy to share. It's mainly a showcase of rendering performance, asset pipelines, and cross-device input, backed by a public write-up with real numbers.

**Scope (MVP)**
- [ ] Pick a tight game loop (a short arcade or puzzle game that can be finished in about 2–5 minutes)
- [ ] Core scene, camera, lighting, and game loop in three.js
- [ ] Input support for keyboard, touch, and gamepad
- [ ] Start screen, pause menu, game-over screen, and a local high score
- [ ] Responsive canvas that handles device pixel ratio correctly

**Engineering goals**
- [ ] Steady 60fps on a mid-range phone
- [ ] Code-split, lazily loaded assets (compressed glTF/Draco, KTX2 textures)
- [ ] Instancing and object pooling where it helps; keep draw calls under budget
- [ ] Initial load under a set budget (for example, under 2 MB before first interaction)
- [ ] Performance HUD in dev builds (FPS, draw calls, memory)

**Deliverables**
- [ ] Live, playable demo linked from the portfolio
- [ ] Source code in a public repo
- [ ] Blog post: "Getting a three.js game to 60fps on mobile," with before-and-after profiling data
- [ ] Short gameplay clip for sharing on X

**Stretch:** online leaderboard, WebGPU renderer experiment, sound design with the Web Audio API

---

## 2. Design system from scratch

**Why:** A deep dive into everything it takes to build UI foundations well: API design, accessibility, theming, documentation, testing, and versioned releases.

**Scope (MVP)**
- [ ] Design tokens (color, spacing, typography, radius, motion) with light and dark themes
- [ ] 15–20 components, including the hard ones:
  - [ ] Button, Input, Select, Checkbox, Radio, Switch
  - [ ] Dialog/Modal, Popover, Tooltip, Toast
  - [ ] Tabs, Accordion, Menu
  - [ ] Combobox / Autocomplete
  - [ ] Date picker
  - [ ] Data table (sorting, selection, pagination)
- [ ] Composable, typed component APIs (TypeScript)

**Quality bar**
- [ ] WCAG 2.2 AA: full keyboard support, focus management, correct ARIA
- [ ] Manual screen reader testing (VoiceOver and NVDA)
- [ ] Unit and interaction tests, plus automated a11y checks (axe)
- [ ] Visual regression tests in CI
- [ ] Tree-shakeable package with a tracked bundle size

**Deliverables**
- [ ] Storybook docs site with usage guidelines and do's and don'ts
- [ ] Published npm package with semantic versioning and a changelog
- [ ] This portfolio site rebuilt on the design system (dogfooding)
- [ ] Write-up on the API and accessibility decisions

**Stretch:** Figma token sync, a codemod for a breaking change, RTL support

---

## 3. Real-time, offline-first collaborative app

**Why:** Multiplayer editing, offline support, and sync are among the hardest frontend problems. This project is a chance to dig into state management, conflict resolution, and careful UX for edge cases.

**Idea:** A collaborative trip planner / kanban board / whiteboard (final pick TBD) that several people can edit live.

**Scope (MVP)**
- [ ] Shared documents with real-time editing via CRDTs (for example, Yjs)
- [ ] Live presence: cursors, avatars, who's viewing
- [ ] Works fully offline and syncs cleanly on reconnect (IndexedDB persistence)
- [ ] Optimistic UI with clear sync and connection status
- [ ] Shareable links with basic permissions (view or edit)
- [ ] Undo/redo that behaves correctly with multiple editors

**Engineering goals**
- [ ] Installable PWA with a service worker
- [ ] Handles flaky networks gracefully (test with throttling and dropped connections)
- [ ] End-to-end tests that simulate multiple clients
- [ ] Built with components from Project 2

**Deliverables**
- [ ] Live demo that visitors can open in two tabs to try collaboration
- [ ] Source code in a public repo
- [ ] Write-up on the sync architecture and conflict handling, with diagrams

**Stretch:** comment threads, version history and time travel, AI-assisted suggestions

---

## How these fit together

The design system (2) supplies the UI for the collaborative app (3) and for this portfolio site, and the game (1) shows depth in graphics and performance. Together they cover the things I enjoy most: polished, accessible, high-performance interfaces and the architecture behind them.

## Progress log

- **Oct 2026:** Roadmap created.

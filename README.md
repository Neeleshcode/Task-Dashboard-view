# Project Tracker Dashboard

A production-ready project management dashboard built from scratch with React, TypeScript, Vite, and Tailwind CSS. No UI component libraries, no drag-and-drop libraries, no virtual scroll libraries — every feature is hand-built.

---

## Why pnpm instead of npm?

This project lives inside a **pnpm workspace** (a monorepo). The repository contains multiple apps — an API server, a component preview sandbox, and this dashboard — all sharing a single `node_modules` folder at the root.

pnpm is used because:

- **Workspaces** — pnpm natively supports monorepos. One `pnpm install` at the root installs dependencies for every app at once.
- **Speed** — pnpm caches packages globally and hard-links them instead of copying, so installs are significantly faster than npm.
- **Disk efficiency** — packages are stored once on disk and referenced by multiple projects, saving hundreds of megabytes compared to npm's approach of duplicating files per project.
- **Strictness** — pnpm prevents packages from accessing dependencies they haven't explicitly declared, which catches hidden dependency bugs early.

You can still use familiar commands — just replace `npm` with `pnpm`:

| npm command | pnpm equivalent |
|---|---|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm run dev` |
| `npm install react` | `pnpm add react` |

---

## What was built

| Feature | How |
|---|---|
| 520 dynamically generated tasks | Seeded linear-congruential RNG (deterministic, no flicker on reload) |
| Kanban board with drag and drop | Custom pointer-event DnD — `setPointerCapture`, ghost card, column hit-testing |
| List view with virtual scrolling | Custom virtual scroll — only visible rows rendered in the DOM |
| Timeline / Gantt view | Computed bar geometry, synced label + grid panels |
| URL-synced filters | `URLSearchParams` read/write; browser back/forward supported |
| Sortable columns (List view) | Sort by title, priority, or due date; ascending and descending |
| Collaboration simulation | Random "active users" reassigned to tasks every 5 seconds |
| 6 mock team members | Unique avatar colours, used across all three views |

---

## Project structure

```
artifacts/project-tracker/
├── src/
│   ├── App.tsx                     # Root component + layout shell
│   ├── types/
│   │   └── index.ts                # All TypeScript types (Task, User, FilterState, …)
│   ├── data/
│   │   ├── users.ts                # 6 mock users
│   │   └── tasks.ts                # 520 deterministically generated tasks
│   ├── context/
│   │   └── AppContext.tsx          # Global state (useReducer + React Context)
│   ├── utils/
│   │   ├── filters.ts              # applyFilters, applySort, hasActiveFilters
│   │   └── dates.ts                # Date helpers (getDueDateLabel, getMonthDays, …)
│   ├── components/
│   │   ├── Header.tsx              # Top nav: view switcher + collaborator presence
│   │   ├── FilterPanel.tsx         # Sidebar: status / priority / assignee / date filters
│   │   ├── PriorityBadge.tsx       # Colour-coded priority pill
│   │   ├── UserAvatar.tsx          # Circular avatar with initials
│   │   └── CollaboratorAvatars.tsx # Stacked avatar cluster for active collaborators
│   └── views/
│       ├── KanbanView.tsx          # Four-column board with custom drag-and-drop
│       ├── ListView.tsx            # Sortable table with custom virtual scrolling
│       └── TimelineView.tsx        # Gantt-style timeline for the current month
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Getting started locally

### Prerequisites

- Node.js 18 or later
- pnpm (`npm install -g pnpm`)

### Steps

```bash
# 1. Clone or unzip the project
cd project-tracker   # or wherever you placed it

# 2. Install all dependencies (run from the repo root, not this folder)
pnpm install

# 3. Start the dashboard
pnpm --filter @workspace/project-tracker run dev
```

The app will be available at `http://localhost:5173` (or whichever port Vite picks).

If you only have this folder (not the full monorepo), you can run it standalone:

```bash
cd artifacts/project-tracker
pnpm install   # installs just this app's dependencies
pnpm run dev
```

---

## Key design decisions

**No external component library**
Every button, dropdown, badge, and avatar is built with plain HTML elements and Tailwind utility classes. This keeps the bundle small and makes every pixel intentional.

**Custom drag-and-drop (Kanban)**
The browser's native Pointer Events API (`onPointerDown`, `setPointerCapture`, `pointermove`, `pointerup`) is used directly. This avoids the quirks of the HTML5 Drag-and-Drop API and works consistently on touch screens.

**Custom virtual scrolling (List view)**
Instead of a library, the list view tracks `scrollTop` via an `onScroll` handler, calculates which rows are visible, and renders only that slice. A full-height inner div keeps the scrollbar accurate. This keeps the DOM to ~20 nodes regardless of how many tasks exist.

**Seeded random number generator (task data)**
Using `Math.random()` would generate a different dataset on every page reload, causing React reconciliation noise. A seeded linear-congruential generator produces the same 520 tasks every time, making the app stable during development.

**URL-synced state**
Filters and the active view are stored as query parameters so any filtered view can be bookmarked or shared. The browser's `popstate` event restores state when the user navigates back.
